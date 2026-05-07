import asyncio
import uvicorn
import socketio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config.settings import HOST, PORT
from backend.game.rules import Rules
from backend.network.manager import (
    rejoindre_room, room_est_pleine,
    couleur_du_joueur, supprimer_room, quitter_room, rooms,
)
from backend.api.routes import router as parties_router
from backend.ai.minimax import coup_facile, coup_minimax

# ── Socket.io ──────────────────────────────────────────────────────────────────
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',
)

# ── FastAPI ────────────────────────────────────────────────────────────────────
app = FastAPI(title="QOMET API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

socket_app = socketio.ASGIApp(sio, other_asgi_app=app)

app.include_router(parties_router)

# ── Événements Socket.io ───────────────────────────────────────────────────────

@sio.event
async def connect(sid, _environ):
    print(f"[WS] Connecté : {sid}")


@sio.event
async def disconnect(sid):
    print(f"[WS] Déconnecté : {sid}")
    code, _ = couleur_du_joueur(sid)
    if not code:
        return
    game = rooms[code]["game"]
    # Ne supprimer la room que si la partie était déjà en cours (les deux joueurs présents)
    # En salle d'attente, une déconnexion temporaire ne doit pas tuer la room
    if room_est_pleine(code) or game.termine:
        await sio.emit("adversaire_deconnecte", {
            "message": "Ton adversaire a quitté la partie. Tu remportes la victoire !"
        }, room=code)
        supprimer_room(code)
    else:
        # Salle d'attente : libère juste la place du joueur déconnecté
        quitter_room(sid)
 


@sio.event
async def rejoindre(sid, data):
    """
    Reçu quand un joueur veut rejoindre une room existante.
    data = { "code": "AS58", "prenom": "Bob" }
    La room doit avoir été créée via POST /parties au préalable.
    """
    prenom = data.get("prenom", "Joueur")
    code   = data.get("code", "").upper().strip()

    ok, msg = rejoindre_room(sid, code, prenom)

    if not ok:
        await sio.emit("erreur", {"code": msg}, to=sid)
        return

    await sio.enter_room(sid, code)
    await sio.emit("room_rejointe", {"code": code}, to=sid)

    if room_est_pleine(code):
        game = rooms[code]["game"]
        etat = game.etat()
        etat["code"] = code
        await sio.emit("partie_demarree", etat, room=code)


@sio.event
async def quitter(sid):
    """Le joueur quitte sa room volontairement (ex : annuler depuis la salle d'attente)."""
    quitter_room(sid)


@sio.event
async def deplacements_valides(sid, data):
    """
    Retourne les destinations valides pour une étoile.
    data = { "row": r, "col": c }
    """
    code, _ = couleur_du_joueur(sid)
    if not code:
        return

    game = rooms[code]["game"]
    row, col = data["row"], data["col"]

    coups = Rules.deplacements_valides(
        game.board, row, col, game.board.dernier_coup
    )
    destinations = [
        [c[3], c[4]] for c in coups
        if c[0] not in ("ejecter",)
    ]
    peut_ejecter = any(c[0] == "ejecter" for c in coups)
    await sio.emit("coups_valides", {"destinations": destinations, "peut_ejecter": peut_ejecter}, to=sid)


@sio.event
async def abandonner(sid):
    """Un joueur abandonne volontairement la partie."""
    code, _ = couleur_du_joueur(sid)
    if code:
        await sio.emit("adversaire_deconnecte", {
            "message": "Ton adversaire a abandonné. Tu remportes la victoire !"
        }, room=code)
        supprimer_room(code)


@sio.event
async def pause(sid):
    """Un joueur met la partie en pause."""
    code, _ = couleur_du_joueur(sid)
    if code:
        await sio.emit("adversaire_en_pause", {}, room=code, skip_sid=sid)


@sio.event
async def reprendre(sid):
    """Un joueur reprend la partie."""
    code, _ = couleur_du_joueur(sid)
    if code:
        await sio.emit("adversaire_a_repris", {}, room=code, skip_sid=sid)


@sio.event
async def coup_ia(sid, data):
    """
    Calcule et joue le meilleur coup pour le joueur IA.
    data = { "niveau": "facile"|"moyen"|"difficile" }
    Le coup est appliqué côté serveur puis l'état est diffusé à tous.
    """
    code, couleur = couleur_du_joueur(sid)
    if not code:
        return

    game = rooms[code]["game"]
    if couleur != game.joueur_actif.couleur:
        return

    niveau = data.get("niveau", "moyen")

    if niveau == "facile":
        coup = await asyncio.to_thread(coup_facile, game)
    elif niveau == "difficile":
        coup = await asyncio.to_thread(coup_minimax, game, 4)
    else:
        coup = await asyncio.to_thread(coup_minimax, game, 2)

    if coup is None:
        return

    if coup[0] == "poser":
        ok, msg = game.jouer_poser(coup[1], coup[2])
    else:
        ok, msg = game.jouer_deplacement(coup)

    if not ok:
        await sio.emit("erreur", {"code": "ERR_IA_MOVE_FAILED", "msg": msg}, to=sid)
        return

    await sio.emit("etat", game.etat(), room=code)

    if game.termine:
        carre = Rules.trouver_carre_gagnant(game.board)
        if carre:
            await sio.emit("carre_gagnant", {
                "cellules": carre["cellules"],
                "gagnant":  game.gagnant.nom if game.gagnant else None,
            }, room=code)
        await sio.emit("fin_partie", {
            "gagnant": game.gagnant.nom if game.gagnant else None
        }, room=code)
        supprimer_room(code)


@sio.event
async def jouer(sid, data):
    """
    Reçu quand un joueur joue un coup.
    data = { "type": "poser",       "row": 3, "col": 3 }
        ou { "type": "deplacement", "coup": [...] }
    """
    code, couleur = couleur_du_joueur(sid)

    if not code:
        await sio.emit("erreur", {"code": "ERR_ROOM_NOT_FOUND"}, to=sid)
        return

    game = rooms[code]["game"]

    # Vérifie que c'est le tour de ce joueur
    if couleur != game.joueur_actif.couleur:
        await sio.emit("erreur", {"code": "ERR_NOT_YOUR_TURN"}, to=sid)
        return

    type_coup = data.get("type")

    if type_coup == "poser":
        ok, msg = game.jouer_poser(data["row"], data["col"])

    elif type_coup == "ejecter":
        from_r, from_c = data["row"], data["col"]
        coups_possibles = Rules.deplacements_valides(
            game.board, from_r, from_c, game.board.dernier_coup
        )
        coup = next((c for c in coups_possibles if c[0] == "ejecter"), None)
        if not coup:
            await sio.emit("erreur", {"code": "ERR_ILLEGAL_MOVE", "msg": "Éjection impossible"}, to=sid)
            return
        ok, msg = game.jouer_deplacement(coup)

    elif type_coup == "deplacement":
        from_r, from_c, to_r, to_c = data["coup"]

        # Trouver le coup complet correspondant dans deplacements_valides
        coups_possibles = Rules.deplacements_valides(
            game.board, from_r, from_c, game.board.dernier_coup
        )
        coup = next(
            (c for c in coups_possibles
             if c[0] != "ejecter" and c[3] == to_r and c[4] == to_c),
            None
        )

        if not coup:
            await sio.emit("erreur", {"code": "ERR_ILLEGAL_MOVE", "msg": "Coup introuvable"}, to=sid)
            return

        ok, msg = game.jouer_deplacement(coup)
    else:
        await sio.emit("erreur", {"code": "ERR_INVALID_ACTION"}, to=sid)
        return

    if not ok:
        await sio.emit("erreur", {"code": "ERR_ILLEGAL_MOVE", "msg": msg}, to=sid)
        return

    # Broadcast le nouvel état aux 2 joueurs
    await sio.emit("etat", game.etat(), room=code)

    # Fin de partie : envoie les cellules gagnantes puis le modal
    if game.termine:
        carre = Rules.trouver_carre_gagnant(game.board)
        if carre:
            await sio.emit("carre_gagnant", {
                "cellules": carre["cellules"],
                "gagnant":  game.gagnant.nom if game.gagnant else None,
            }, room=code)
        await sio.emit("fin_partie", {
            "gagnant": game.gagnant.nom if game.gagnant else None
        }, room=code)
        supprimer_room(code)


# ── Routes HTTP ────────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "ok", "port": PORT}


# ── Lancement ──────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run("backend.main:socket_app", host=HOST, port=PORT, reload=True)

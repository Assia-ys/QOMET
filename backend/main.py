import uvicorn
import socketio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config.settings import HOST, PORT
from backend.network.manager import (
    rejoindre_room, room_est_pleine,
    couleur_du_joueur, supprimer_room, rooms,
)
from backend.api.routes import router as parties_router

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
async def connect(sid, environ):
    print(f"[WS] Connecté : {sid}")


@sio.event
async def disconnect(sid):
    print(f"[WS] Déconnecté : {sid}")
    code, _ = couleur_du_joueur(sid)
    if code:
        await sio.emit("adversaire_deconnecte", {
            "message": "Ton adversaire a quitté la partie. Tu remportes la victoire !"
        }, room=code)
        supprimer_room(code)


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
    elif type_coup == "deplacement":
        ok, msg = game.jouer_deplacement(tuple(data["coup"]))
    else:
        await sio.emit("erreur", {"code": "ERR_INVALID_ACTION"}, to=sid)
        return

    if not ok:
        await sio.emit("erreur", {"code": "ERR_ILLEGAL_MOVE", "msg": msg}, to=sid)
        return

    # Broadcast le nouvel état aux 2 joueurs
    await sio.emit("etat", game.etat(), room=code)

    # Fin de partie
    if game.termine:
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

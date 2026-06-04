import random
from backend.game.game import Game

CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

rooms = {}

def _generer_code():
    while True:
        code = ''.join(random.choices(CHARS, k=4))
        if code not in rooms:
            return code

def creer_room(prenom):
    code = _generer_code()
    rooms[code] = {
        "game":    Game(prenom, "En attente"),
        "joueurs": {"clair": None, "fonce": None},
        "prenoms": {"clair": prenom, "fonce": None},
    }
    return code

def quitter_room(sid):
    """Retire un joueur de la room dans laquelle il se trouve, sans supprimer la room."""
    for room in rooms.values():
        if room["joueurs"]["clair"] == sid:
            room["joueurs"]["clair"] = None
            return
        if room["joueurs"]["fonce"] == sid:
            room["joueurs"]["fonce"] = None
            return

def rejoindre_room(sid, code, prenom):
    if code not in rooms:
        return False, "ERR_ROOM_NOT_FOUND"

    # Évite qu'un même sid soit présent dans plusieurs rooms simultanément
    quitter_room(sid)

    room = rooms[code]

    # Remplit clair en premier, puis fonce
    if room["joueurs"]["clair"] is None:
        room["joueurs"]["clair"] = sid
        room["prenoms"]["clair"] = prenom
        room["game"].joueur1.nom = prenom
        return True, "OK"
    elif room["joueurs"]["fonce"] is None:
        room["joueurs"]["fonce"] = sid
        room["prenoms"]["fonce"] = prenom
        room["game"].joueur2.nom = prenom
        return True, "OK"
    else:
        return False, "ERR_ROOM_FULL"

def room_est_pleine(code):
    if code not in rooms:
        return False
    r = rooms[code]
    return r["joueurs"]["clair"] is not None and r["joueurs"]["fonce"] is not None

def couleur_du_joueur(sid):
    for code, room in rooms.items():
        if room["joueurs"]["clair"] == sid:
            return code, "clair"
        if room["joueurs"]["fonce"] == sid:
            return code, "fonce"
    return None, None

def supprimer_room(code):
    if code in rooms:
        del rooms[code]
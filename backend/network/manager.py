import random
from backend.game.game import Game

CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

rooms = {}


def _generer_code():
    while True:
        code = ''.join(random.choices(CHARS, k=4))
        if code not in rooms:
            return code


def creer_room(sid, prenom):
    code = _generer_code()
    rooms[code] = {
        "game":        Game(prenom, "En attente"),
        "joueurs":     {"clair": sid, "fonce": None},
        "prenoms":     {"clair": prenom, "fonce": None},
    }
    return code


def rejoindre_room(sid, code, prenom):
    if code not in rooms:
        return False, "ERR_ROOM_NOT_FOUND"

    room = rooms[code]

    if room["joueurs"]["fonce"] is not None:
        return False, "ERR_ROOM_FULL"

    room["joueurs"]["fonce"]  = sid
    room["prenoms"]["fonce"]  = prenom
    room["game"].joueur2.nom  = prenom

    return True, "OK"


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

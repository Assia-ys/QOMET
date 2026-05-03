from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.network.manager import (
    creer_room, rejoindre_room, room_est_pleine,
    supprimer_room, rooms,
)

router = APIRouter(prefix="/parties", tags=["parties"])


class CreerPartieBody(BaseModel):
    prenom: str


@router.post("")
async def creer_partie(body: CreerPartieBody):
    """Crée une nouvelle partie et retourne le code à 4 caractères."""
    code = creer_room(body.prenom)
    return {"code": code, "message": "Partie créée"}


@router.get("/{code}")
async def verifier_partie(code: str):
    """Vérifie si une room existe et combien de joueurs sont connectés."""
    code = code.upper()
    if code not in rooms:
        raise HTTPException(status_code=404, detail="ERR_ROOM_NOT_FOUND")

    room = rooms[code]
    joueurs_connectes = sum(1 for sid in room["joueurs"].values() if sid is not None)

    return {
        "code":              code,
        "existe":            True,
        "joueurs_connectes": joueurs_connectes,
        "pleine":            room_est_pleine(code),
    }


@router.get("/{code}/etat")
async def etat_partie(code: str):
    """Retourne l'état complet du jeu pour une room donnée."""
    code = code.upper()
    if code not in rooms:
        raise HTTPException(status_code=404, detail="ERR_ROOM_NOT_FOUND")

    etat = rooms[code]["game"].etat()
    etat["code"] = code
    return etat


@router.delete("/{code}")
async def supprimer_partie(code: str):
    """Supprime une room (admin / debug)."""
    code = code.upper()
    if code not in rooms:
        raise HTTPException(status_code=404, detail="ERR_ROOM_NOT_FOUND")
    supprimer_room(code)
    return {"message": f"Room {code} supprimée"}

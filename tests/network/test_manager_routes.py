import pytest
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from backend.network.manager import (
    creer_room, rejoindre_room, quitter_room, supprimer_room,
    room_est_pleine, couleur_du_joueur, rooms,
)
from backend.api.routes import router
from fastapi import FastAPI
from fastapi.testclient import TestClient


# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture(autouse=True)
def nettoyer_rooms():
    rooms.clear()
    yield
    rooms.clear()


# ── Manager ───────────────────────────────────────────────────────────────────

class TestRejoindreRoom:
    def test_rejoindre_valide(self):
        code = creer_room('Alice')
        ok, _ = rejoindre_room('sid1', code, 'Alice')
        assert ok is True

    def test_rejoindre_room_inexistante(self):
        ok, _ = rejoindre_room('sid1', 'ZZZZ', 'Alice')
        assert ok is False

    def test_rejoindre_room_pleine(self):
        code = creer_room('Alice')
        rejoindre_room('sid1', code, 'Alice')
        rejoindre_room('sid2', code, 'Bob')
        ok, _ = rejoindre_room('sid3', code, 'Charlie')
        assert ok is False

    def test_deux_joueurs_couleurs_differentes(self):
        code = creer_room('Alice')
        rejoindre_room('sid1', code, 'Alice')
        rejoindre_room('sid2', code, 'Bob')
        _, couleur1 = couleur_du_joueur('sid1')
        _, couleur2 = couleur_du_joueur('sid2')
        assert couleur1 != couleur2
        assert {couleur1, couleur2} == {'clair', 'fonce'}


class TestRoomEstPleine:
    def test_pas_pleine_avec_un_joueur(self):
        code = creer_room('Alice')
        rejoindre_room('sid1', code, 'Alice')
        assert room_est_pleine(code) is False

    def test_pleine_avec_deux_joueurs(self):
        code = creer_room('Alice')
        rejoindre_room('sid1', code, 'Alice')
        rejoindre_room('sid2', code, 'Bob')
        assert room_est_pleine(code) is True


class TestCouleurDuJoueur:
    def test_retourne_code_et_couleur(self):
        code = creer_room('Alice')
        rejoindre_room('sid1', code, 'Alice')
        code_ret, couleur = couleur_du_joueur('sid1')
        assert code_ret == code
        assert couleur in ('clair', 'fonce')

    def test_sid_inconnu_retourne_none(self):
        code, couleur = couleur_du_joueur('sid_inconnu')
        assert code is None
        assert couleur is None


class TestQuitterSupprimer:
    def test_quitter_room(self):
        code = creer_room('Alice')
        rejoindre_room('sid1', code, 'Alice')
        quitter_room('sid1')
        assert couleur_du_joueur('sid1')[0] is None

    def test_supprimer_room(self):
        code = creer_room('Alice')
        rejoindre_room('sid1', code, 'Alice')
        supprimer_room(code)
        assert code not in rooms


# ── Routes HTTP ───────────────────────────────────────────────────────────────

_app = FastAPI()
_app.include_router(router)
client = TestClient(_app)


class TestRoutesHTTP:
    def test_post_parties_cree_code(self):
        res = client.post('/parties', json={'prenom': 'Alice'})
        assert res.status_code == 200
        data = res.json()
        assert 'code' in data
        assert len(data['code']) == 4

    def test_post_parties_code_alphanumerique(self):
        res = client.post('/parties', json={'prenom': 'Bob'})
        code = res.json()['code']
        assert code.isalnum()
        assert code == code.upper()

    def test_get_partie_existante(self):
        code = client.post('/parties', json={'prenom': 'Alice'}).json()['code']
        res  = client.get(f'/parties/{code}')
        assert res.status_code == 200
        assert res.json()['existe'] is True

    def test_get_partie_inexistante(self):
        res = client.get('/parties/ZZZZ')
        assert res.status_code == 404

    def test_delete_partie(self):
        code = client.post('/parties', json={'prenom': 'Alice'}).json()['code']
        res  = client.delete(f'/parties/{code}')
        assert res.status_code == 200
        assert code not in rooms

    def test_get_etat_partie(self):
        code = client.post('/parties', json={'prenom': 'Alice'}).json()['code']
        res  = client.get(f'/parties/{code}/etat')
        assert res.status_code == 200
        data = res.json()
        assert 'plateau' in data
        assert 'joueurs' in data

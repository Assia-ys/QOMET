import uvicorn
import socketio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config.settings import HOST, PORT

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

# Monter Socket.io sur FastAPI
socket_app = socketio.ASGIApp(sio, other_asgi_app=app)

# ── Événements Socket.io de base ───────────────────────────────────────────────
@sio.event
async def connect(sid, environ):
    print(f"[WS] Client connecté : {sid}")

@sio.event
async def disconnect(sid):
    print(f"[WS] Client déconnecté : {sid}")

# ── Routes HTTP ────────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "ok", "port": PORT}

# ── Lancement ──────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run("backend.main:socket_app", host=HOST, port=PORT, reload=True)
import os
import uvicorn
from backend.main import socket_app

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 7777))
    uvicorn.run(socket_app, host="0.0.0.0", port=port)

FROM python:3.11-slim

# Node.js pour builder le frontend
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Dépendances Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Build frontend
COPY frontend/src/package*.json frontend/src/
RUN cd frontend/src && npm install

COPY . .
RUN cd frontend/src && npm run build

CMD ["sh", "-c", "python -m uvicorn backend.main:socket_app --host 0.0.0.0 --port ${PORT:-8080}"]

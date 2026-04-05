"""WebSocket endpoint for real-time game events (HP, score, league_up)."""
import json
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.auth.service import decode_token

logger = logging.getLogger(__name__)

router = APIRouter(tags=["websocket"])

# In-memory connection store: session_id → list of WebSocket connections
_connections: dict[str, list[WebSocket]] = {}


@router.websocket("/ws/game/{session_id}")
async def game_websocket(websocket: WebSocket, session_id: str):
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4001)
        return

    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            await websocket.close(code=4001)
            return
        user_id = payload["sub"]
    except Exception:
        await websocket.close(code=4001)
        return

    await websocket.accept()
    _connections.setdefault(session_id, []).append(websocket)
    logger.info("WS connected: session=%s user=%s", session_id, user_id)

    try:
        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)
            if msg.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        pass
    finally:
        conns = _connections.get(session_id, [])
        if websocket in conns:
            conns.remove(websocket)
        logger.info("WS disconnected: session=%s", session_id)


async def broadcast(session_id: str, event: dict) -> None:
    """Send event to all WebSocket clients for a session."""
    for ws in _connections.get(session_id, []):
        try:
            await ws.send_json(event)
        except Exception:
            pass

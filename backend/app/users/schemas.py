from pydantic import BaseModel


class UserStats(BaseModel):
    total_sessions: int
    total_correct: int
    total_answers: int
    accuracy_percent: float
    attacks_by_type: dict[str, int]


class SessionHistoryItem(BaseModel):
    id: str
    location: str
    score: int
    accuracy: int
    correct_count: int
    scenarios_count: int
    date: str


class SessionHistoryResponse(BaseModel):
    sessions: list[SessionHistoryItem]
    total: int

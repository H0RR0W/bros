from pydantic import BaseModel


class AnswerOption(BaseModel):
    id: str
    text: str
    is_correct: bool | None = None  # hidden from player


class ScenarioResponse(BaseModel):
    scenario_id: str
    location: str
    attack_type: str
    cwe_id: str
    owasp_category: str
    scenario_text: str
    answer_options: list[dict]  # is_correct stripped server-side


class StartSessionRequest(BaseModel):
    location: str  # office | home | wifi


class StartSessionResponse(BaseModel):
    session_id: str
    hp: int
    scenarios_count: int
    first_scenario: ScenarioResponse


class AnswerRequest(BaseModel):
    session_id: str
    scenario_id: str
    chosen_answer_id: str
    answer_time_seconds: float | None = None  # for speed bonus


class AnswerResponse(BaseModel):
    is_correct: bool
    hp_new: int
    hp_delta: int
    score_delta: int
    total_score: int
    explanation: str
    animation_type: str  # "success" | "hack_animation"
    next_scenario: ScenarioResponse | None
    session_complete: bool
    streak: int


class CompleteSessionRequest(BaseModel):
    session_id: str


class CompleteSessionResponse(BaseModel):
    final_hp: int
    final_score: int
    accuracy_percent: int
    league_new: str
    league_changed: bool
    certificate_id: str | None

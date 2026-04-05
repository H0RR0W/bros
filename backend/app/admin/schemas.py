from pydantic import BaseModel


class AdminUserItem(BaseModel):
    id: str
    email: str
    username: str
    role: str
    league: str
    total_score: int
    is_active: bool
    created_at: str


class AdminUserListResponse(BaseModel):
    users: list[AdminUserItem]
    total: int


class RoleUpdateRequest(BaseModel):
    role: str  # "user" | "admin"


class StatusUpdateRequest(BaseModel):
    is_active: bool


class ScenarioCreateRequest(BaseModel):
    location: str
    attack_type: str
    cwe_id: str
    owasp_category: str
    scenario_text: str
    answer_options: list[dict]
    correct_answer_id: str
    explanation_wrong: str
    explanation_correct: str


class ScenarioUpdateRequest(BaseModel):
    scenario_text: str | None = None
    answer_options: list[dict] | None = None
    correct_answer_id: str | None = None
    explanation_wrong: str | None = None
    explanation_correct: str | None = None


class PublishRequest(BaseModel):
    is_published: bool


class AdminStatsResponse(BaseModel):
    total_users: int
    active_users_7d: int
    total_sessions: int
    avg_accuracy: float
    scenarios_by_location: dict[str, int]
    scenarios_by_type: dict[str, int]


class AdminLogItem(BaseModel):
    id: str
    admin_id: str
    admin_username: str
    action: str
    target_id: str | None
    details: str | None
    created_at: str


class AdminLogListResponse(BaseModel):
    logs: list[AdminLogItem]
    total: int


class UserEditRequest(BaseModel):
    username: str | None = None
    email: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    patronymic: str | None = None

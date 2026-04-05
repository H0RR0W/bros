from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://cybersim:password@postgres:5432/cybersim"

    # Redis
    REDIS_URL: str = "redis://redis:6379/0"
    SCENARIO_CACHE_TTL: int = 86400  # 24h

    # JWT
    SECRET_KEY: str = "change-this-to-a-secure-random-key-at-least-32-chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # Mistral AI
    MISTRAL_API_KEY: str = ""
    MISTRAL_BASE_URL: str = "https://api.mistral.ai/v1"
    MISTRAL_MODEL: str = "mistral-small-latest"
    MISTRAL_TIMEOUT: int = 30

    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:3000,https://localhost"

    # Admin seed
    FIRST_ADMIN_EMAIL: str = "admin@cybersim.local"
    FIRST_ADMIN_PASSWORD: str = "Admin_secure_pass123!"

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]


settings = Settings()

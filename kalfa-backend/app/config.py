from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",  # .env'deki fazladan değişkenleri yoksay
    )

    DATABASE_URL: str = "postgresql+asyncpg://kalfa:kalfa_secret@localhost:5432/kalfa_db"
    SECRET_KEY: str = "change_me_in_production"
    ENVIRONMENT: str = "development"

    @property
    def is_dev(self) -> bool:
        return self.ENVIRONMENT == "development"


settings = Settings()

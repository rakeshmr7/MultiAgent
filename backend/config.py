import os
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # OpenAI Config
    openai_api_key: str
    openai_model: str = "gpt-4o-mini"
    
    # LangSmith Config
    langchain_api_key: Optional[str] = None
    langchain_project: str = "multi-agent-tech-reports"
    langchain_tracing_v2: str = "false"
    
    # App Config
    port: int = 8000
    host: str = "0.0.0.0"

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

# Instantiate settings
try:
    settings = Settings()
except Exception as e:
    # Fallback to loading empty or environment variables if env_file is not populated yet
    class FallbackSettings(BaseSettings):
        openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
        openai_model: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        langchain_api_key: Optional[str] = os.getenv("LANGCHAIN_API_KEY")
        langchain_project: str = os.getenv("LANGCHAIN_PROJECT", "multi-agent-tech-reports")
        langchain_tracing_v2: str = os.getenv("LANGCHAIN_TRACING_V2", "false")
        port: int = int(os.getenv("PORT", "8000"))
        host: str = os.getenv("HOST", "0.0.0.0")
    settings = FallbackSettings()

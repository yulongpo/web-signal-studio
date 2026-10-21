"""Allow `python -m app` to start loopback uvicorn."""

from .main import run

if __name__ == "__main__":
    run()


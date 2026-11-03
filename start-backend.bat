@echo off
echo Starting FinPilot FastAPI Backend...
cd /d "%~dp0backend"
call ".\venv\Scripts\activate.bat"
python run.py
pause

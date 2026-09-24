@echo off
cd /d "%~dp0"
if not exist node_modules (
  echo Instalando dependencias pela primeira vez...
  call npm install || (pause & exit /b 1)
)
call npm run app

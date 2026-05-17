@echo off
cd /d "%~dp0"
if not exist "logs" mkdir "logs"
if exist "%~dp0config-private.cmd" call "%~dp0config-private.cmd"
if "%JAVA_HOME%"=="" set "JAVA_HOME=D:\Java\jdk-17"
set "PATH=%JAVA_HOME%\bin;%PATH%"
if "%DEEPSEEK_MODEL%"=="" set "DEEPSEEK_MODEL=deepseek-v4-flash"

echo Personal Health Intelligent Management System
echo.
echo Website:
echo   http://localhost:9999/
echo.
echo Logs:
echo   %~dp0logs\app.out.log
echo   %~dp0logs\app.err.log
echo.
echo Keep this window open while using the website.
echo Press Ctrl+C to stop.
echo.

"%JAVA_HOME%\bin\java.exe" -jar "target\x-admin-0.0.1-SNAPSHOT.jar" >> "logs\app.out.log" 2>> "logs\app.err.log"

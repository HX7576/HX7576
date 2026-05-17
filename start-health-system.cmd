@echo off
cd /d "%~dp0"
set "JAVA_HOME=D:\Java\jdk-17"
set "PATH=%JAVA_HOME%\bin;D:\Maven\apache-maven-3.9.6\bin;%PATH%"
if exist "%~dp0start-health-system.private.cmd" call "%~dp0start-health-system.private.cmd"
if "%DEEPSEEK_MODEL%"=="" set "DEEPSEEK_MODEL=deepseek-v4-flash"

echo Personal Health Intelligent Management System
echo.
echo MySQL default:
echo   database: health
echo   username: %MYSQL_USERNAME%
echo   url: %MYSQL_URL%
echo.
echo DeepSeek:
echo   model: %DEEPSEEK_MODEL%
if "%DEEPSEEK_API_KEY%"=="" (
  echo   API Key: not configured
) else (
  echo   API Key: configured
)
echo.
echo Open after startup:
echo   http://localhost:9999/
echo.
mvn -Dmaven.compiler.fork=true spring-boot:run

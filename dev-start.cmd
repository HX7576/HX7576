@echo off
cd /d "%~dp0"
if not exist "logs" mkdir "logs"
if exist "%~dp0config-private.cmd" call "%~dp0config-private.cmd"
if "%JAVA_HOME%"=="" set "JAVA_HOME=D:\Java\jdk-17"
set "PATH=%JAVA_HOME%\bin;%PATH%"
set "MAVEN_USER_HOME=S:\lunwen\.m2-wrapper"
if "%DEEPSEEK_MODEL%"=="" set "DEEPSEEK_MODEL=deepseek-v4-flash"

echo Starting x-admin in development mode...
echo.
echo Website:
echo   http://localhost:9999/
echo.
call ".\mvnw.cmd" -Dmaven.repo.local=S:\lunwen\.m2-wrapper\repository -Dmaven.compiler.fork=true spring-boot:run

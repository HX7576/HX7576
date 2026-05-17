@echo off
cd /d "%~dp0"
if not exist "logs" mkdir "logs"
if exist "%~dp0config-private.cmd" call "%~dp0config-private.cmd"
if "%JAVA_HOME%"=="" set "JAVA_HOME=D:\Java\jdk-17"
set "PATH=%JAVA_HOME%\bin;%PATH%"
set "MAVEN_USER_HOME=S:\lunwen\.m2-wrapper"

echo Building x-admin...
echo.
call ".\mvnw.cmd" -Dmaven.repo.local=S:\lunwen\.m2-wrapper\repository -Dmaven.compiler.fork=true -DskipTests package

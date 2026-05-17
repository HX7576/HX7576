@echo off
cd /d "%~dp0"
set "JAVA_HOME=D:\Java\jdk-17"
set "PATH=%JAVA_HOME%\bin;D:\Maven\apache-maven-3.9.6\bin;%PATH%"
if exist "%~dp0start-health-system.private.cmd" call "%~dp0start-health-system.private.cmd"
if "%DEEPSEEK_MODEL%"=="" set "DEEPSEEK_MODEL=deepseek-v4-flash"

mvn -Dmaven.compiler.fork=true spring-boot:run > S:\lunwen\x-admin-run.out.log 2> S:\lunwen\x-admin-run.err.log

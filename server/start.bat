@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"
title 蝎子编程服务管理工具

set "ADMIN_JAR=scorpioncode-admin.jar"
set "CLIENT_JAR=scorpioncode-client.jar"
set "ADMIN_PORT=8800"
set "CLIENT_PORT=8900"

:menu
cls
echo.
echo ============================================
echo       蝎子编程服务管理工具
echo ============================================
echo.
echo   [1] 启动用户端 (端口 %CLIENT_PORT%)
echo   [2] 启动管理端 (端口 %ADMIN_PORT%)
echo   [3] 启动全部服务
echo   [4] 强制重启用户端 (先杀再启)
echo   [5] 强制重启管理端 (先杀再启)
echo   [6] 停止全部服务
echo   [7] 查看服务状态
echo   [0] 退出
echo.
echo ============================================
set /p choice=请选择操作（输入数字）:

if "%choice%"=="1" goto start_client
if "%choice%"=="2" goto start_admin
if "%choice%"=="3" goto start_all
if "%choice%"=="4" goto restart_client
if "%choice%"=="5" goto restart_admin
if "%choice%"=="6" goto stop_all
if "%choice%"=="7" goto check_status
if "%choice%"=="0" goto quit
echo [错误] 无效选项
timeout /t 2 /nobreak >nul
goto menu

:quit
echo 已退出
exit /b 0

:restart_client
call :force_stop_port %CLIENT_PORT% "用户端"
call :start_service "用户端" "%CLIENT_JAR%" %CLIENT_PORT%
goto menu

:restart_admin
call :force_stop_port %ADMIN_PORT% "管理端"
call :start_service "管理端" "%ADMIN_JAR%" %ADMIN_PORT%
goto menu

:start_client
call :start_service "用户端" "%CLIENT_JAR%" %CLIENT_PORT%
goto menu

:start_admin
call :start_service "管理端" "%ADMIN_JAR%" %ADMIN_PORT%
goto menu

:start_all
call :start_service "用户端" "%CLIENT_JAR%" %CLIENT_PORT%
call :start_service "管理端" "%ADMIN_JAR%" %ADMIN_PORT%
goto menu

:stop_all
call :force_stop_port %CLIENT_PORT% "用户端"
call :force_stop_port %ADMIN_PORT% "管理端"
goto menu

:check_status
cls
echo.
echo ============================================
echo           服务运行状态
echo ============================================
echo.
call :check_port %CLIENT_PORT% "用户端 (端口 %CLIENT_PORT%)"
call :check_port %ADMIN_PORT% "管理端 (端口 %ADMIN_PORT%)"
echo.
echo ============================================
pause
goto menu

:start_service
set "service_name=%~1"
set "jar_file=%~2"
set "port=%~3"

if not exist "%jar_file%" (
    echo [错误] 找不到 %jar_file%
    timeout /t 3 /nobreak >nul
    goto :eof
)

echo [启动] 正在启动 %service_name% (端口 %port%)...
start "%service_name% - 端口 %port%" cmd /k "java -jar %jar_file%"

timeout /t 3 /nobreak >nul
call :check_port %port% "%service_name%"
if errorlevel 1 (
    echo [成功] %service_name% 启动成功！
) else (
    echo [失败] %service_name% 启动失败，请查看新窗口的错误信息
)
timeout /t 2 /nobreak >nul
goto :eof

:force_stop_port
set "port=%~1"
set "name=%~2"
set "found=0"

echo [停止] 正在停止 %name% (端口 %port%)...

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":%port% " ^| findstr "LISTENING"') do (
    echo [停止] 找到进程 PID: %%a
    taskkill /F /PID %%a >nul 2>&1
    if !errorlevel!==0 (
        echo [成功] 已停止 %name% (PID %%a)
        set "found=1"
    )
)

if "!found!"=="0" (
    echo [提示] %name% 未在运行
)
timeout /t 2 /nobreak >nul
goto :eof

:check_port
set "port=%~1"
set "name=%~2"

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":%port% " ^| findstr "LISTENING"') do (
    echo [运行中] %name% 正在运行 (PID: %%a)
    exit /b 1
)
echo [未运行] %name% 未启动
exit /b 0
#!/bin/bash

# 蝎子编程服务管理工具 - Linux/macOS版本

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

ADMIN_JAR="scorpioncode-admin.jar"
CLIENT_JAR="scorpioncode-client.jar"
ADMIN_PORT=8800
CLIENT_PORT=8900

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查端口是否被占用（通用方法）
check_port() {
    local port=$1
    local name=$2
    local pid=""
    
    # 尝试多种方法查找占用端口的进程
    if command -v lsof >/dev/null 2>&1; then
        pid=$(lsof -ti ":$port" 2>/dev/null | head -1)
    elif command -v netstat >/dev/null 2>&1; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            pid=$(netstat -anv -p tcp | grep -E "[.:]$port " | grep LISTEN | awk '{print $9}' | head -1)
        else
            # Linux
            pid=$(netstat -tlnp 2>/dev/null | grep ":$port " | awk '{print $7}' | cut -d'/' -f1 | head -1)
        fi
    elif command -v ss >/dev/null 2>&1; then
        pid=$(ss -tlnp 2>/dev/null | grep ":$port " | grep -oP 'pid=\K[0-9]+' | head -1)
    fi
    
    if [[ -n "$pid" ]] && [[ "$pid" =~ ^[0-9]+$ ]]; then
        echo -e "${GREEN}[运行中]${NC} $name 正在运行 (PID: $pid)"
        return 1
    else
        echo -e "${YELLOW}[未运行]${NC} $name 未启动"
        return 0
    fi
}

# 强制停止占用端口的进程
force_stop_port() {
    local port=$1
    local name=$2
    local found=0
    
    echo -e "${BLUE}[停止]${NC} 正在停止 $name (端口 $port)..."
    
    local pid=""
    if command -v lsof >/dev/null 2>&1; then
        pid=$(lsof -ti ":$port" 2>/dev/null | head -1)
    elif command -v netstat >/dev/null 2>&1; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            pid=$(netstat -anv -p tcp | grep -E "[.:]$port " | grep LISTEN | awk '{print $9}' | head -1)
        else
            pid=$(netstat -tlnp 2>/dev/null | grep ":$port " | awk '{print $7}' | cut -d'/' -f1 | head -1)
        fi
    elif command -v ss >/dev/null 2>&1; then
        pid=$(ss -tlnp 2>/dev/null | grep ":$port " | grep -oP 'pid=\K[0-9]+' | head -1)
    fi
    
    if [[ -n "$pid" ]] && [[ "$pid" =~ ^[0-9]+$ ]]; then
        echo -e "[停止] 找到进程 PID: $pid"
        if kill -9 "$pid" 2>/dev/null; then
            echo -e "${GREEN}[成功]${NC} 已停止 $name (PID $pid)"
            found=1
        else
            echo -e "${RED}[错误]${NC} 无法停止进程 PID: $pid"
        fi
    fi
    
    if [[ $found -eq 0 ]]; then
        echo -e "${YELLOW}[提示]${NC} $name 未在运行"
    fi
    sleep 2
}

# 启动服务
start_service() {
    local service_name=$1
    local jar_file=$2
    local port=$3
    
    if [[ ! -f "$jar_file" ]]; then
        echo -e "${RED}[错误]${NC} 找不到 $jar_file"
        sleep 3
        return 1
    fi
    
    echo -e "${BLUE}[启动]${NC} 正在启动 $service_name (端口 $port)..."
    
    # 检查端口是否已被占用
    if check_port "$port" "$service_name" >/dev/null 2>&1; then
        echo -e "${YELLOW}[警告]${NC} 端口 $port 已被占用，请先停止服务"
        return 1
    fi
    
    # 后台启动Java服务
    nohup java -jar "$jar_file" > "${service_name}.log" 2>&1 &
    
    sleep 3
    
    # 检查服务是否启动成功
    if check_port "$port" "$service_name" >/dev/null 2>&1; then
        echo -e "${GREEN}[成功]${NC} $service_name 启动成功！"
        echo -e "[日志] 输出保存到 ${service_name}.log"
    else
        echo -e "${RED}[失败]${NC} $service_name 启动失败，请查看 ${service_name}.log"
    fi
    sleep 2
}

# 显示菜单
show_menu() {
    clear
    echo ""
    echo "============================================"
    echo "       蝎子编程服务管理工具"
    echo "============================================"
    echo ""
    echo "  [1] 启动用户端 (端口 $CLIENT_PORT)"
    echo "  [2] 启动管理端 (端口 $ADMIN_PORT)"
    echo "  [3] 启动全部服务"
    echo "  [4] 强制重启用户端 (先杀再启)"
    echo "  [5] 强制重启管理端 (先杀再启)"
    echo "  [6] 停止全部服务"
    echo "  [7] 查看服务状态"
    echo "  [0] 退出"
    echo ""
    echo "============================================"
    read -p "请选择操作（输入数字）: " choice
}

# 主循环
while true; do
    show_menu
    
    case $choice in
        1)
            start_service "用户端" "$CLIENT_JAR" $CLIENT_PORT
            ;;
        2)
            start_service "管理端" "$ADMIN_JAR" $ADMIN_PORT
            ;;
        3)
            start_service "用户端" "$CLIENT_JAR" $CLIENT_PORT
            start_service "管理端" "$ADMIN_JAR" $ADMIN_PORT
            ;;
        4)
            force_stop_port $CLIENT_PORT "用户端"
            start_service "用户端" "$CLIENT_JAR" $CLIENT_PORT
            ;;
        5)
            force_stop_port $ADMIN_PORT "管理端"
            start_service "管理端" "$ADMIN_JAR" $ADMIN_PORT
            ;;
        6)
            force_stop_port $CLIENT_PORT "用户端"
            force_stop_port $ADMIN_PORT "管理端"
            ;;
        7)
            clear
            echo ""
            echo "============================================"
            echo "           服务运行状态"
            echo "============================================"
            echo ""
            check_port $CLIENT_PORT "用户端 (端口 $CLIENT_PORT)"
            check_port $ADMIN_PORT "管理端 (端口 $ADMIN_PORT)"
            echo ""
            echo "============================================"
            read -p "按回车键继续..."
            ;;
        0)
            echo "已退出"
            exit 0
            ;;
        *)
            echo -e "${RED}[错误]${NC} 无效选项"
            sleep 2
            ;;
    esac
done
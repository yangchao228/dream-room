#!/bin/bash

# setup_ollama_mac.sh
# 帮助用户在 macOS 上快速配置 Dream Room 所需的本地 Ollama 环境

set -e

# 定义默认使用的模型
MODEL="qwen3:8b"

echo "🚀 正在为 Dream Room 配置 Ollama 环境..."

# 1. 检查是否安装了 Ollama
if ! command -v ollama &> /dev/null; then
    echo "📦 未检测到 Ollama。正在通过官方脚本安装..."
    echo "   (可能需要输入密码以获取管理员权限)"
    curl -fsSL https://ollama.com/install.sh | sh
else
    echo "✅ Ollama 已安装。"
fi

# 2. 检查 Ollama 是否正在运行
if pgrep -x "ollama" > /dev/null || pgrep -x "Ollama" > /dev/null; then
    echo "⚠️  检测到 Ollama 正在运行。"
    echo "❗ 重要提示：Dream Room 需要配置 OLLAMA_ORIGINS=\"*\" 以允许浏览器跨域访问。"
    echo "   如果您是通过 Mac 菜单栏应用启动的，它可能未配置此环境变量。"
    echo "   建议让本脚本重启服务以确保配置正确。"
    
    read -p "   是否终止当前 Ollama 进程并由本脚本重新启动？(y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        pkill -x ollama || true
        pkill -x Ollama || true
        sleep 1
        echo "   已停止现有 Ollama 进程。"
    else
        echo "   将继续使用现有进程（请确保您已手动配置了 CORS，否则聊天可能会失败）。"
    fi
fi

# 3. 启动服务（如果未运行）
# 再次检查，因为上面可能刚刚杀死了进程
if ! pgrep -x "ollama" > /dev/null && ! pgrep -x "Ollama" > /dev/null; then
    echo "🔌 正在启动 Ollama 服务 (CORS 已开启)..."
    
    # 设置环境变量允许跨域
    export OLLAMA_ORIGINS="*"
    
    # 后台启动
    ollama serve &
    SERVER_PID=$!
    
    # 等待服务就绪
    echo "   等待服务启动..."
    count=0
    while ! curl -s http://localhost:11434/api/tags > /dev/null; do
        sleep 1
        count=$((count+1))
        if [ $count -ge 15 ]; then
            echo "❌ 等待 Ollama 服务启动超时。"
            # 尝试显示日志
            exit 1
        fi
        echo -n "."
    done
    echo ""
    echo "✅ Ollama 服务已就绪。"
fi

# 4. 拉取模型
echo "📥 正在检查模型 '$MODEL'..."
# 简单的检查方式，如果 list 输出包含模型名
if ! ollama list | grep -q "$MODEL"; then
    echo "   未找到模型 '$MODEL'。正在拉取 (文件较大，请耐心等待)..."
    ollama pull $MODEL
    echo "✅ 模型拉取完成。"
else
    echo "✅ 模型 '$MODEL' 已存在。"
fi

echo ""
echo "🎉 配置完成！"
echo "   - Ollama 服务运行中"
echo "   - CORS 跨域已配置"
echo "   - 模型 '$MODEL' 准备就绪"
echo ""
echo "👉 您现在可以在 Dream Room 中使用本地 AI 角色了。"
echo "⚠️  请保持此终端窗口开启，关闭窗口将停止 Ollama 服务。"

# 如果是我们启动的后台进程，则在此等待，防止脚本退出导致子进程被杀（取决于 shell 配置，但这样更稳妥）
if [ ! -z "$SERVER_PID" ]; then
    wait $SERVER_PID
fi

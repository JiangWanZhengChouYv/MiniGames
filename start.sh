#!/bin/bash

# 迷你游戏合集 - 启动脚本
# 使用方法: 在终端运行此脚本或在Finder中双击

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INDEX_FILE="$SCRIPT_DIR/index.html"

# 检查HTML文件是否存在
if [ ! -f "$INDEX_FILE" ]; then
    echo "❌ 错误: 未找到游戏主文件 index.html"
    exit 1
fi

# 尝试在默认浏览器中打开
echo "🎮 正在启动迷你游戏合集..."

# 根据操作系统选择打开方式
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open "$INDEX_FILE"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    xdg-open "$INDEX_FILE" 2>/dev/null || echo "请手动在浏览器中打开: file://$INDEX_FILE"
elif [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "msys" ]]; then
    # Windows
    start "$INDEX_FILE" 2>/dev/null || echo "请手动在浏览器中打开: file://$INDEX_FILE"
else
    echo "⚠️  无法自动打开，请手动在浏览器中打开: file://$INDEX_FILE"
fi

echo "✅ 游戏合集已启动！"
echo "🎮 选择您想玩的游戏"
echo ""
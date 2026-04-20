# WebWindow 🌐
一个轻量级的Web虚拟桌面系统，同时支持桌面端Ubuntu风格多窗口体验和移动端原生安卓全屏体验。

## ✨ 功能特性
### 桌面端功能
- 🪟 完整窗口管理系统：拖拽移动、边缘缩放、最大化/最小化/关闭
- 📂 安全文件资源管理器：路径校验防遍历，面包屑导航，双击进入目录/打开文件
- ✍️ 专业代码编辑器：Monaco Editor集成，支持20+编程语言高亮，Markdown编辑/预览/分屏三模式切换
- 📁 VS Code式工作区：左侧可折叠文件树，支持打开文件夹作为工程空间，点击文件直接编辑
- 🖥️ 网页终端模拟器：WebSocket实时连接bash，完整命令支持，颜色高亮，tab补全
- 🎨 Ubuntu风格UI主题，原生桌面交互体验

### 移动端功能
- 📱 原生安卓体验：全屏显示，顶部状态栏，底部三键导航（返回/主页/概览）
- 🔄 自动横竖屏适配：资源管理器竖屏列表布局/横屏网格布局
- 🖱️ 触控友好：大尺寸图标和按钮，流畅滑动体验
- 🔧 编辑器自适应：自动换行，触摸滚动，可折叠浮动文件树，内容双指缩放
- 🤳 长按上下文菜单：和桌面端右键功能一致

### 通用特性
- 🔀 自动模式切换：根据设备自动识别桌面/移动端模式，支持手动切换
- 🌐 完全离线运行：所有外部依赖已本地化，无需外部网络即可使用
- 🔒 安全机制：文件访问限制在用户目录内，防止路径遍历攻击

## 🛠️ 技术栈
| 层级 | 技术选型 |
|------|----------|
| 后端 | FastAPI + Uvicorn |
| 前端 | 原生JavaScript + Tailwind CSS + Font Awesome |
| 编辑器 | Monaco Editor |
| 终端 | xterm.js + pyte |
| 部署 | Python虚拟环境 |

## 🚀 部署教程
### 环境要求
- Python 3.8+
- Linux/macOS系统

### 安装步骤
1. 克隆仓库
```bash
git clone https://github.com/Autotos/WebWindow.git
cd WebWindow
```

2. 创建虚拟环境并安装依赖
```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

3. 运行服务
```bash
python main.py
```

4. 访问系统
打开浏览器访问 http://localhost:5555
局域网内其他设备访问 http://你的服务器IP:5555

### 防火墙配置
如果需要外部访问，开放5555端口：
```bash
# ufw防火墙
sudo ufw allow 5555/tcp
# firewalld防火墙
sudo firewall-cmd --add-port=5555/tcp --permanent
sudo firewall-cmd --reload
```

## 📖 使用说明
### 基础操作
- 桌面双击「主目录」图标打开文件资源管理器
- 文件管理器双击目录进入，双击文件打开编辑器
- 右键/长按文件/文件夹弹出上下文菜单
- 编辑器顶部「File」菜单支持打开文件、打开文件夹作为工作区、保存文件
- 编辑器顶部「View」菜单支持Markdown编辑/预览切换、行号显示/隐藏、自动换行开关

### 移动端操作
- 底部返回键：关闭当前活动窗口
- 底部主页键：最小化所有窗口返回桌面
- 编辑器左上角☰按钮切换显示/隐藏文件树
- 编辑器内容支持双指缩放

## 🏗️ 项目架构
```
WebWindow/
├── main.py                 # FastAPI后端入口
├── requirements.txt        # Python依赖
├── templates/
│   └── index.html          # 主页面
├── static/
│   ├── js/
│   │   └── desktop.js      # 前端核心逻辑
│   ├── css/
│   ├── img/
│   └── lib/                # 本地化第三方依赖
│       ├── tailwind/
│       ├── font-awesome/
│       ├── monaco/
│       └── xterm/
└── venv/                   # Python虚拟环境
```

### 核心模块说明
1. **窗口管理模块**：负责窗口创建、拖拽、缩放、z-index管理、移动端全屏适配
2. **文件资源管理器模块**：和后端API交互，实现目录浏览、文件操作、上下文菜单
3. **编辑器模块**：Monaco Editor集成、工作区文件树、Markdown预览、文件保存
4. **终端模块**：WebSocket连接管理、xterm.js渲染、命令交互
5. **移动端适配模块**：设备检测、安卓UI渲染、触控事件处理、横竖屏适配

## 📝 开发说明
本项目没有使用任何重型前端框架，全部采用原生JavaScript实现，代码结构清晰，容易二次开发。所有功能都已经做了移动端适配，遵循原生系统交互逻辑。

## 📄 开源协议
MIT License

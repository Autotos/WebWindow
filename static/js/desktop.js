// 全局状态
let windows = [];
let activeWindowId = null;
let zIndexCounter = 100;
let isMobileMode = false;
// Monaco Editor 实例
let monacoEditorInstances = new Map();

// 初始化Monaco Editor
require.config({ paths: { 'vs': '/static/lib/monaco/vs' }});
window.MonacoEnvironment = {
    getWorkerUrl: function (workerId, label) {
        return `data:text/javascript;charset=utf-8,${encodeURIComponent(`
            self.MonacoEnvironment = { baseUrl: '/static/lib/monaco/' };
            importScripts('/static/lib/monaco/vs/base/worker/workerMain.js');
        `)}`;
    }
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    // 彻底清除所有残留的应用列表/概览卡片，确保不会挡住导航栏
    const residualElements = document.querySelectorAll('#android-overview-container, #app-drawer');
    residualElements.forEach(el => el.remove());

    // 检测设备，自动切换模式
    checkDeviceMode();
    // 监听窗口大小变化
    window.addEventListener('resize', checkDeviceMode);
    // 绑定模式切换按钮
    document.getElementById('mode-toggle').addEventListener('click', toggleMode);
    
    updateClock();
    setInterval(updateClock, 1000);
    initDesktopIcons();
    initStartMenu();
});

// 检测设备模式
function checkDeviceMode() {
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
    if (isMobileDevice && !isMobileMode) {
        switchToMobileMode();
    } else if (!isMobileDevice && isMobileMode) {
        switchToDesktopMode();
    }
}

// 切换到手机模式（安卓风格）
function switchToMobileMode() {
    isMobileMode = true;
    const body = document.getElementById('webwindow-body');
    const desktopContainer = document.getElementById('desktop-container');
    const desktopSwipe = document.getElementById('desktop-swipe');
    const desktopPage = document.getElementById('desktop-page-1');
    const taskbar = document.getElementById('taskbar');
    const toggleBtn = document.getElementById('mode-toggle');
    const androidStatusBar = document.getElementById('android-status-bar');
    const androidNavButtons = document.getElementById('android-nav-buttons');
    const startBtn = document.getElementById('start-btn');
    const desktopOpenApps = document.getElementById('desktop-open-apps');
    
    // 显示安卓状态栏和导航按钮
    androidStatusBar.classList.remove('hidden');
    androidStatusBar.classList.add('flex');
    androidNavButtons.classList.remove('hidden');
    androidNavButtons.classList.add('flex');
    
    // 隐藏桌面模式元素
    startBtn.classList.add('hidden');
    desktopOpenApps.classList.add('hidden');
    
    // 切换为安卓风格
    body.classList.remove('bg-gradient-to-br', 'from-ubuntu-dark', 'to-ubuntu-purple');
    body.classList.add('bg-android-dark');
    
    // 调整桌面为滑动布局
    desktopPage.classList.remove('desktop-grid', 'p-4');
    desktopPage.classList.add('mobile-grid', 'grid-cols-4');
    
    // 调整桌面容器高度，减去状态栏和导航栏高度
    const totalHeight = window.innerHeight - androidStatusBar.offsetHeight - taskbar.offsetHeight;
    desktopContainer.style.height = `${totalHeight}px`;
    
    // 调整任务栏样式为安卓底部导航
    taskbar.classList.remove('bg-ubuntu-dark/90', 'border-t', 'border-white/10', 'h-12');
    taskbar.classList.add('bg-android-gray/95', 'border-t', 'border-gray-700', 'h-16');
    
    // 调整桌面图标大小
    document.querySelectorAll('.desktop-icon').forEach(icon => {
        icon.classList.remove('w-20');
        icon.classList.add('w-[70px]');
        icon.querySelector('i').classList.remove('text-3xl');
        icon.querySelector('i').classList.add('text-4xl');
    });
    
    // 切换按钮图标
    toggleBtn.querySelector('i').classList.remove('fa-mobile');
    toggleBtn.querySelector('i').classList.add('fa-desktop');
    toggleBtn.title = "切换到桌面模式";
    
    // 所有已打开的窗口最大化
    windows.forEach(win => {
        if (!win.isMaximized) {
            toggleMaximizeWindow(win.id);
        }
        // 调整窗口为安卓全屏样式
        win.el.classList.remove('rounded-lg', 'shadow-2xl');
        win.el.style.borderRadius = '0px';
        win.el.style.left = '0px';
        win.el.style.top = `${androidStatusBar.offsetHeight}px`;
        win.el.style.width = `${window.innerWidth}px`;
        win.el.style.height = `${window.innerHeight - androidStatusBar.offsetHeight - taskbar.offsetHeight}px`;
    });
    
    // 禁用窗口拖拽和调整大小的触发区域
    document.querySelectorAll('.window-header').forEach(header => {
        header.classList.remove('window-drag', 'cursor-move');
    });
    
    // 安卓导航按钮功能已取消，移除绑定避免报错
}

// 切换到桌面模式
function switchToDesktopMode() {
    isMobileMode = false;
    const body = document.getElementById('webwindow-body');
    const desktopContainer = document.getElementById('desktop-container');
    const desktopPage = document.getElementById('desktop-page-1');
    const taskbar = document.getElementById('taskbar');
    const toggleBtn = document.getElementById('mode-toggle');
    const androidStatusBar = document.getElementById('android-status-bar');
    const androidNavButtons = document.getElementById('android-nav-buttons');
    const startBtn = document.getElementById('start-btn');
    const desktopOpenApps = document.getElementById('desktop-open-apps');
    
    // 隐藏安卓状态栏和导航按钮
    androidStatusBar.classList.remove('flex');
    androidStatusBar.classList.add('hidden');
    androidNavButtons.classList.remove('flex');
    androidNavButtons.classList.add('hidden');
    
    // 显示桌面模式元素
    startBtn.classList.remove('hidden');
    desktopOpenApps.classList.remove('hidden');
    
    // 恢复Ubuntu风格
    body.classList.remove('bg-android-dark');
    body.classList.add('bg-gradient-to-br', 'from-ubuntu-dark', 'to-ubuntu-purple');
    
    // 恢复桌面布局
    desktopPage.classList.remove('mobile-grid', 'grid-cols-4');
    desktopPage.classList.add('desktop-grid', 'p-4');
    desktopContainer.style.height = 'calc(100% - 48px)';
    
    // 恢复任务栏样式
    taskbar.classList.remove('bg-android-gray/95', 'border-gray-700', 'h-16');
    taskbar.classList.add('bg-ubuntu-dark/90', 'border-t', 'border-white/10', 'h-12');
    
    // 恢复桌面图标大小
    document.querySelectorAll('.desktop-icon').forEach(icon => {
        icon.classList.remove('w-[70px]');
        icon.classList.add('w-20');
        icon.querySelector('i').classList.remove('text-4xl');
        icon.querySelector('i').classList.add('text-3xl');
    });
    
    // 切换按钮图标
    toggleBtn.querySelector('i').classList.remove('fa-desktop');
    toggleBtn.querySelector('i').classList.add('fa-mobile');
    toggleBtn.title = "切换到手机模式";
    
    // 恢复窗口样式
    windows.forEach(win => {
        win.el.classList.add('rounded-lg', 'shadow-2xl');
        win.el.style.borderRadius = '8px';
        if (!win.isMaximized) {
            // 恢复窗口原有位置和大小
            win.el.style.left = `${win.savedRect?.left || 50}px`;
            win.el.style.top = `${win.savedRect?.top || 50}px`;
            win.el.style.width = `${win.savedRect?.width || 800}px`;
            win.el.style.height = `${win.savedRect?.height || 600}px`;
        }
    });
    
    // 恢复窗口拖拽
    document.querySelectorAll('.window-header').forEach(header => {
        header.classList.add('window-drag', 'cursor-move');
    });
}

// 安卓返回按钮动作
function androidBackAction() {
    // 如果有打开的窗口，关闭最上层的
    if (windows.length > 0) {
        const topWindow = windows.reduce((prev, current) => 
            parseInt(prev.el.style.zIndex) > parseInt(current.el.style.zIndex) ? prev : current
        );
        closeWindow(topWindow.id);
    }
}

// 安卓主页按钮动作
function androidHomeAction() {
    // 最小化所有窗口，回到桌面
    windows.forEach(win => {
        if (!win.isMinimized) {
            minimizeWindow(win.id);
        }
    });
}

// 安卓概览按钮动作
function androidOverviewAction() {
    // 显示所有打开的应用（待实现）
    alert('应用列表功能开发中');
}

// 手动切换模式
function toggleMode() {
    if (isMobileMode) {
        switchToDesktopMode();
    } else {
        switchToMobileMode();
    }
}

// 更新时间
function updateClock() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('time').textContent = timeStr;
    // 同时更新安卓状态栏时间
    if (document.getElementById('android-time')) {
        document.getElementById('android-time').textContent = timeStr;
    }
}

// 初始化桌面图标点击事件
function initDesktopIcons() {
    const icons = document.querySelectorAll('.desktop-icon');
    icons.forEach(icon => {
        icon.addEventListener('dblclick', () => {
            const name = icon.querySelector('span').textContent;
            if (name === '终端') {
                createTerminalWindow();
            } else if (name === '代码编辑器') {
                createEditorWindow();
            } else if (name === '主目录') {
                createFileManagerWindow();
            }
        });
    });
}

// 初始化开始菜单
function initStartMenu() {
    const startBtn = document.getElementById('start-btn');
    // 只有存在开始按钮（移动端安卓模式）的时候才绑定事件，避免桌面模式下元素不存在报错
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            alert('开始菜单开发中...');
        });
    }
}

// ========== 终端模拟器 ==========
function createTerminalWindow() {
    const windowId = `window-${Date.now()}`;
    zIndexCounter++;
    
    const windowEl = document.createElement('div');
    windowEl.id = windowId;
    windowEl.className = 'absolute bg-black rounded-lg shadow-2xl pointer-events-auto overflow-hidden flex flex-col';
    
    // 手机模式下默认最大化
    if (isMobileMode) {
        windowEl.style.left = '0px';
        windowEl.style.top = `${document.getElementById('android-status-bar')?.offsetHeight || 0}px`;
        windowEl.style.width = `${window.innerWidth}px`;
        windowEl.style.height = `${window.innerHeight - (document.getElementById('android-status-bar')?.offsetHeight || 0) - (document.getElementById('taskbar')?.offsetHeight || 48)}px`;
    } else {
        windowEl.style.width = `800px`;
        windowEl.style.height = `500px`;
        windowEl.style.left = `${Math.max(0, (window.innerWidth - 800) / 2)}px`;
        windowEl.style.top = `${Math.max(0, (window.innerHeight - 500) / 2)}px`;
    }
    
    windowEl.style.zIndex = zIndexCounter;

    // 窗口标题栏
    windowEl.innerHTML = `
        <div class="window-header h-10 bg-gray-900 flex items-center px-3 justify-between ${isMobileMode ? '' : 'window-drag cursor-move'}">
            <div class="flex items-center gap-2">
                <i class="fa fa-terminal text-green-400"></i>
                <span class="font-medium text-white">终端</span>
            </div>
            <div class="flex gap-2 window-no-drag">
                <button class="minimize-btn w-4 h-4 rounded-full bg-yellow-400 hover:bg-yellow-500 transition-all"></button>
                <button class="maximize-btn w-4 h-4 rounded-full bg-green-400 hover:bg-green-500 transition-all"></button>
                <button class="close-btn w-4 h-4 rounded-full bg-red-400 hover:bg-red-500 transition-all"></button>
            </div>
        </div>
        <div class="window-content flex-1 overflow-hidden">
            <div id="terminal-${windowId}" class="w-full h-full p-2"></div>
        </div>
    `;

    document.getElementById('desktop-container').appendChild(windowEl);
    bringWindowToFront(windowId);

    // 初始化xterm
    const term = new Terminal({
        cursorBlink: true,
        fontSize: isMobileMode ? 14 : 13,
        lineHeight: 1.2,
        theme: {
            background: '#000000',
            foreground: '#f0f0f0',
            cursor: '#ffffff',
            selection: 'rgba(255, 255, 255, 0.3)',
            black: '#000000',
            red: '#ff5555',
            green: '#50fa7b',
            yellow: '#f1fa8c',
            blue: '#bd93f9',
            magenta: '#ff79c6',
            cyan: '#8be9fd',
            white: '#bbbbbb',
            brightBlack: '#555555',
            brightRed: '#ff5555',
            brightGreen: '#50fa7b',
            brightYellow: '#f1fa8c',
            brightBlue: '#bd93f9',
            brightMagenta: '#ff79c6',
            brightCyan: '#8be9fd',
            brightWhite: '#ffffff'
        }
    });
    const fitAddon = new FitAddon.FitAddon();
    term.loadAddon(fitAddon);
    term.open(document.getElementById(`terminal-${windowId}`));
    fitAddon.fit();

    // 连接WebSocket
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${wsProtocol}//${window.location.host}/ws/terminal`);

    // 接收后端输出
    ws.onmessage = (event) => {
        term.write(event.data);
    };

    // 发送输入到后端
    term.onData((data) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(data);
        }
    });

    // 窗口大小变化时适配终端
    const resizeObserver = new ResizeObserver(() => {
        fitAddon.fit();
    });
    resizeObserver.observe(windowEl.querySelector('.window-content'));

    // 绑定窗口控制按钮
    windowEl.querySelector('.close-btn').addEventListener('click', () => {
        // 清理资源
        if (ws.readyState === WebSocket.OPEN) {
            ws.close();
        }
        term.dispose();
        resizeObserver.disconnect();
        closeWindow(windowId);
    });

    windowEl.querySelector('.minimize-btn').addEventListener('click', () => {
        toggleMinimizeWindow(windowId);
    });

    windowEl.querySelector('.maximize-btn').addEventListener('click', () => {
        toggleMaximizeWindow(windowId);
        setTimeout(() => fitAddon.fit(), 100);
    });

    // 加入窗口列表
    windows.push({ id: windowId, el: windowEl, isMinimized: false, isMaximized: isMobileMode, type: 'terminal' });
    return windowId;
}

// 创建通用窗口
function createWindow(title, icon, content, width = 800, height = 600) {
    const windowId = `window-${Date.now()}`;
    zIndexCounter++;
    
    const windowEl = document.createElement('div');
    windowEl.id = windowId;
    windowEl.className = 'absolute bg-white rounded-lg shadow-2xl pointer-events-auto overflow-hidden flex flex-col';
    
    // 全局窗口大小限制，不管什么模式都不会超过屏幕
    const maxAllowedWidth = window.innerWidth - 40;
    const maxAllowedHeight = window.innerHeight - 100;
    const minAllowedWidth = 300;
    const minAllowedHeight = 400;

    // 手机模式下默认最大化
    if (isMobileMode) {
        windowEl.style.left = '0px';
        windowEl.style.top = '0px';
        // 强制宽度适配屏幕，不会超出
        const finalWidth = Math.min(maxAllowedWidth, window.innerWidth);
        windowEl.style.width = `${finalWidth}px`;
        windowEl.style.maxWidth = `${finalWidth}px`;
        windowEl.style.minWidth = `${minAllowedWidth}px`;
        windowEl.style.boxSizing = 'border-box';
        windowEl.style.height = `${Math.min(maxAllowedHeight, window.innerHeight - (taskbar.offsetHeight || 48))}px`;
        // 移动端强制窗口内容不横向溢出
        windowEl.style.overflowX = 'hidden';
    } else {
        // 桌面端限制最大宽高不超过屏幕大小，小屏自动缩小
        const finalWidth = Math.min(width, maxAllowedWidth);
        const finalHeight = Math.min(height, maxAllowedHeight);
        windowEl.style.width = `${finalWidth}px`;
        windowEl.style.height = `${finalHeight}px`;
        windowEl.style.minWidth = `${minAllowedWidth}px`;
        windowEl.style.left = `${Math.max(0, (window.innerWidth - finalWidth) / 2)}px`;
        windowEl.style.top = `${Math.max(0, (window.innerHeight - finalHeight) / 2)}px`;
    }
    
    windowEl.style.zIndex = zIndexCounter;

    // 窗口标题栏
    windowEl.innerHTML = `
        <div class="window-header h-10 bg-gray-100 flex items-center px-3 justify-between ${isMobileMode ? '' : 'window-drag cursor-move'}">
            <div class="flex items-center gap-2">
                <i class="${icon}"></i>
                <span class="font-medium">${title}</span>
            </div>
            <div class="flex gap-2 window-no-drag">
                <button class="minimize-btn w-4 h-4 rounded-full bg-yellow-400 hover:bg-yellow-500 transition-colors"></button>
                <button class="maximize-btn w-4 h-4 rounded-full bg-green-400 hover:bg-green-500 transition-colors"></button>
                <button class="close-btn w-4 h-4 rounded-full bg-red-400 hover:bg-red-500 transition-colors"></button>
            </div>
        </div>
        <div class="window-content flex-1 overflow-auto">
            ${content}
        </div>
    `;

    document.getElementById('window-container').appendChild(windowEl);
    activeWindowId = windowId;

    // 绑定窗口控制事件
    bindWindowControls(windowEl, windowId);
    
    // 桌面模式下才启用拖拽和调整大小
    if (!isMobileMode) {
        makeDraggable(windowEl);
        makeResizable(windowEl);
    }

    // 点击窗口激活
    windowEl.addEventListener('mousedown', () => {
        activateWindow(windowId);
    });

    windows.push({ id: windowId, el: windowEl, isMinimized: false, isMaximized: isMobileMode });
    return windowId;
}

// 绑定窗口控制按钮
function bindWindowControls(windowEl, windowId) {
    const closeBtn = windowEl.querySelector('.close-btn');
    const minimizeBtn = windowEl.querySelector('.minimize-btn');
    const maximizeBtn = windowEl.querySelector('.maximize-btn');

    closeBtn.addEventListener('click', () => {
        closeWindow(windowId);
    });

    minimizeBtn.addEventListener('click', () => {
        minimizeWindow(windowId);
    });

    maximizeBtn.addEventListener('click', () => {
        toggleMaximizeWindow(windowId);
    });
}

// 窗口拖拽
function makeDraggable(el) {
    const header = el.querySelector('.window-header');
    let isDragging = false;
    let offsetX, offsetY;

    header.addEventListener('mousedown', (e) => {
        if (e.target.closest('button')) return;
        isDragging = true;
        const rect = el.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        activateWindow(el.id);
        document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const win = windows.find(w => w.id === el.id);
        if (win?.isMaximized) return;
        
        let x = e.clientX - offsetX;
        let y = e.clientY - offsetY;
        
        // 限制在视口内
        x = Math.max(0, Math.min(x, window.innerWidth - el.offsetWidth));
        y = Math.max(0, Math.min(y, window.innerHeight - el.offsetHeight - 48));
        
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        document.body.style.userSelect = '';
    });
}

// 窗口调整大小
function makeResizable(el) {
    const resizers = ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'left', 'right', 'top', 'bottom'];
    resizers.forEach(pos => {
        const resizer = document.createElement('div');
        resizer.className = `absolute ${pos} w-2 h-2 bg-transparent`;
        if (pos.includes('left')) resizer.style.left = '-2px';
        if (pos.includes('right')) resizer.style.right = '-2px';
        if (pos.includes('top')) resizer.style.top = '-2px';
        if (pos.includes('bottom')) resizer.style.bottom = '-2px';
        if (pos === 'left' || pos === 'right') {
            resizer.style.height = '100%';
            resizer.style.cursor = 'ew-resize';
        } else if (pos === 'top' || pos === 'bottom') {
            resizer.style.width = '100%';
            resizer.style.cursor = 'ns-resize';
        } else if (pos.includes('left') && pos.includes('top') || pos.includes('right') && pos.includes('bottom')) {
            resizer.style.cursor = 'nwse-resize';
        } else {
            resizer.style.cursor = 'nesw-resize';
        }

        let isResizing = false;
        let startX, startY, startWidth, startHeight, startLeft, startTop;

        resizer.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            isResizing = true;
            const rect = el.getBoundingClientRect();
            startX = e.clientX;
            startY = e.clientY;
            startWidth = rect.width;
            startHeight = rect.height;
            startLeft = rect.left;
            startTop = rect.top;
            activateWindow(el.id);
            document.body.style.userSelect = 'none';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            const win = windows.find(w => w.id === el.id);
            if (win?.isMaximized) return;

            let newWidth = startWidth;
            let newHeight = startHeight;
            let newLeft = startLeft;
            let newTop = startTop;

            if (pos.includes('right')) newWidth = Math.max(400, startWidth + (e.clientX - startX));
            if (pos.includes('left')) {
                const deltaX = e.clientX - startX;
                newWidth = Math.max(400, startWidth - deltaX);
                newLeft = startLeft + deltaX;
            }
            if (pos.includes('bottom')) newHeight = Math.max(300, startHeight + (e.clientY - startY));
            if (pos.includes('top')) {
                const deltaY = e.clientY - startY;
                newHeight = Math.max(300, startHeight - deltaY);
                newTop = startTop + deltaY;
            }

            el.style.width = `${newWidth}px`;
            el.style.height = `${newHeight}px`;
            el.style.left = `${newLeft}px`;
            el.style.top = `${newTop}px`;
        });

        document.addEventListener('mouseup', () => {
            isResizing = false;
            document.body.style.userSelect = '';
        });

        el.appendChild(resizer);
    });
}

// 激活窗口
function activateWindow(windowId) {
    zIndexCounter++;
    const win = windows.find(w => w.id === windowId);
    if (win) {
        win.el.style.zIndex = zIndexCounter;
        activeWindowId = windowId;
        // 移除其他窗口的激活状态
        windows.forEach(w => {
            w.el.querySelector('.window-header')?.classList.remove('bg-blue-100');
        });
        win.el.querySelector('.window-header')?.classList.add('bg-blue-100');
    }
}

// 关闭窗口
function closeWindow(windowId) {
    const win = windows.find(w => w.id === windowId);
    if (win) {
        win.el.remove();
        windows = windows.filter(w => w.id !== windowId);
        if (activeWindowId === windowId) {
            activeWindowId = windows.length > 0 ? windows[windows.length - 1].id : null;
        }
    }
}

// 最小化窗口
function minimizeWindow(windowId) {
    const win = windows.find(w => w.id === windowId);
    if (win) {
        win.isMinimized = !win.isMinimized;
        win.el.style.display = win.isMinimized ? 'none' : 'flex';
    }
}

// 最大化/还原窗口
function toggleMaximizeWindow(windowId) {
    const win = windows.find(w => w.id === windowId);
    if (win) {
        win.isMaximized = !win.isMaximized;
        if (win.isMaximized) {
            win.savedRect = win.el.getBoundingClientRect();
            win.el.style.left = '0px';
            win.el.style.top = '0px';
            win.el.style.width = `${window.innerWidth}px`;
            win.el.style.height = `${window.innerHeight - 48}px`;
        } else {
            win.el.style.left = `${win.savedRect.left}px`;
            win.el.style.top = `${win.savedRect.top}px`;
            win.el.style.width = `${win.savedRect.width}px`;
            win.el.style.height = `${win.savedRect.height}px`;
        }
    }
}

// 创建终端窗口
function createTerminalWindow() {
    createWindow(
        '终端',
        'fa fa-terminal text-green-600',
        '<div id="terminal" class="bg-black text-green-400 p-2 font-mono h-full overflow-auto scrollbar-hidden">root@webwindow:~# <span class="cursor-blink">_</span></div>',
        700,
        400
    );
}

// 创建编辑器窗口
function createEditorWindow() {
    createWindow(
        '代码编辑器',
        'fa fa-code text-blue-600',
        '<div class="h-full flex"><div class="w-48 bg-gray-800 text-white p-3">文件树</div><div class="flex-1 bg-gray-900 text-white p-4">编辑器区域</div></div>',
        900,
        600
    );
}

function createFileManagerWindow(initialPath = "") {
    const windowId = `window-${Date.now()}`;
    zIndexCounter++;

    // 动态计算窗口大小，完全自适应屏幕，绝对不会超出
    let winWidth = Math.min(window.innerWidth * 0.95, 700); // 最大700px，最小占屏幕95%但不超过屏幕宽度
    let winHeight = Math.min(window.innerHeight * 0.85, 600); // 最大600px，占屏幕高度85%
    winWidth = Math.min(winWidth, window.innerWidth - 20); // 左右各留至少10px边距，确保不超出
    winHeight = Math.min(winHeight, window.innerHeight - 60); // 上下留边距避免挡住任务栏

    // 移动端强制100%宽度适配，不会超出
    if (isMobileMode) {
        winWidth = window.innerWidth - 10;
        winHeight = window.innerHeight - 60;
    }

    const content = `
        <div class="flex flex-col h-full w-full" style="box-sizing: border-box; overflow-x: hidden;">
            <div class="flex items-center gap-2 p-2 border-b bg-gray-50 shrink-0">
                <button id="back-btn-${windowId}" class="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 flex items-center gap-1">
                    <i class="fa fa-arrow-left"></i>
                    <span>返回</span>
                </button>
                <div class="flex-1 flex items-center gap-2 px-2 py-1 bg-white border rounded">
                    <i class="fa fa-folder-open text-gray-500"></i>
                    <span id="path-${windowId}" class="text-sm truncate">主目录</span>
                </div>
            </div>
            <div class="flex flex-1 w-full overflow-hidden" style="box-sizing: border-box;">
                <!-- 侧边栏 移动端完全隐藏节省空间 -->
                <div class="hidden sm:block w-24 md:w-32 border-r bg-gray-50 p-2 overflow-y-auto scrollbar-hidden shrink-0">
                    <div class="text-xs font-medium text-gray-600 mb-2 hidden md:block">常用位置</div>
                    <div class="flex items-center gap-2 p-1.5 rounded hover:bg-gray-200 cursor-pointer mb-1 sidebar-item" data-path="">
                        <i class="fa fa-home text-blue-500 text-lg"></i>
                        <span class="text-xs hidden md:block">主目录</span>
                    </div>
                    <div class="flex items-center gap-2 p-1.5 rounded hover:bg-gray-200 cursor-pointer mb-1 sidebar-item" data-path="Desktop">
                        <i class="fa fa-desktop text-purple-500 text-lg"></i>
                        <span class="text-xs hidden md:block">桌面</span>
                    </div>
                    <div class="flex items-center gap-2 p-1.5 rounded hover:bg-gray-200 cursor-pointer mb-1 sidebar-item" data-path="Documents">
                        <i class="fa fa-file-text-o text-green-500 text-lg"></i>
                        <span class="text-xs hidden md:block">文档</span>
                    </div>
                    <div class="flex items-center gap-2 p-1.5 rounded hover:bg-gray-200 cursor-pointer mb-1 sidebar-item" data-path="Downloads">
                        <i class="fa fa-download text-orange-500 text-lg"></i>
                        <span class="text-xs hidden md:block">下载</span>
                    </div>
                </div>
                <div class="flex-1 flex flex-col overflow-hidden w-full" style="box-sizing: border-box;">
                    <div id="file-list-${windowId}" class="flex-1 p-2 overflow-y-auto scrollbar-hidden" style="touch-action: pan-y; -webkit-overflow-scrolling: touch;"></div>
                </div>
            </div>
        </div>
    `;

    const win = createWindow('文件管理器', 'fa fa-folder text-yellow-500', content, winWidth, winHeight);
    loadFileList(win, initialPath);
    return win;
}    windowEl.className = 'absolute bg-white rounded-lg shadow-2xl pointer-events-auto overflow-hidden flex flex-col';
    windowEl.style.width = '800px';
    windowEl.style.height = '500px';
    windowEl.style.left = `${(window.innerWidth - 800) / 2}px`;
    windowEl.style.top = `${(window.innerHeight - 500) / 2}px`;
    windowEl.style.zIndex = zIndexCounter;

    // 窗口标题栏
    windowEl.innerHTML = `
        <div class="window-header h-10 bg-gray-100 flex items-center px-3 justify-between window-drag cursor-move">
            <div class="flex items-center gap-2">
                <i class="fa fa-folder text-yellow-600"></i>
                <span class="font-medium">文件管理器</span>
            </div>
            <div class="flex gap-2 window-no-drag">
                <button class="minimize-btn w-4 h-4 rounded-full bg-yellow-400 hover:bg-yellow-500 transition-colors"></button>
                <button class="maximize-btn w-4 h-4 rounded-full bg-green-400 hover:bg-green-500 transition-colors"></button>
                <button class="close-btn w-4 h-4 rounded-full bg-red-400 hover:bg-red-500 transition-colors"></button>
            </div>
        </div>
        <div class="window-content flex-1 flex flex-col overflow-hidden">
            <!-- 面包屑导航 -->
            <div class="min-h-12 border-b flex items-center px-4 gap-2 bg-gray-50">
                <button id="back-btn-${windowId}" class="p-1.5 hover:bg-gray-200 rounded">
                    <i class="fa fa-arrow-left text-gray-600"></i>
                </button>
                <div id="breadcrumb-${windowId}" class="flex items-center gap-1 flex-1 overflow-x-auto scrollbar-hidden">
                    <span class="cursor-pointer hover:text-blue-600 shrink-0">主目录</span>
                </div>
            </div>
            <div class="flex flex-1 overflow-hidden">
                <!-- 侧边栏 响应式宽度，移动端进一步缩小节省空间 -->
                <div class="w-20 sm:w-32 md:w-48 border-r bg-gray-50 p-3 overflow-y-auto scrollbar-hidden shrink-0">
                    <div class="text-sm font-medium text-gray-600 mb-2 hidden sm:block">常用位置</div>
                    <div class="flex items-center gap-2 p-2 rounded hover:bg-gray-200 cursor-pointer mb-1 sidebar-item" data-path="">
                        <i class="fa fa-home text-blue-500 text-lg"></i>
                        <span class="text-sm hidden sm:block">主目录</span>
                    </div>
                    <div class="flex items-center gap-2 p-2 rounded hover:bg-gray-200 cursor-pointer mb-1 sidebar-item" data-path="Desktop">
                        <i class="fa fa-desktop text-purple-500 text-lg"></i>
                        <span class="text-sm hidden sm:block">桌面</span>
                    </div>
                    <div class="flex items-center gap-2 p-2 rounded hover:bg-gray-200 cursor-pointer mb-1 sidebar-item" data-path="Documents">
                        <i class="fa fa-file-text-o text-green-500 text-lg"></i>
                        <span class="text-sm hidden sm:block">文档</span>
                    </div>
                    <div class="flex items-center gap-2 p-2 rounded hover:bg-gray-200 cursor-pointer mb-1 sidebar-item" data-path="Downloads">
                        <i class="fa fa-download text-orange-500 text-lg"></i>
                        <span class="text-sm hidden sm:block">下载</span>
                    </div>
                </div>
                <!-- 文件列表 强制启用滚动 -->
                <div id="file-list-${windowId}" class="flex-1 p-4 overflow-y-auto scrollbar-hidden grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6" style="touch-action: pan-y; -webkit-overflow-scrolling: touch;">
                    <div class="text-center text-gray-500 col-span-4 py-8">加载中...</div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('window-container').appendChild(windowEl);
    activeWindowId = windowId;

    // 绑定窗口控制事件
    bindWindowControls(windowEl, windowId);
    makeDraggable(windowEl);
    makeResizable(windowEl);

    // 点击窗口激活
    windowEl.addEventListener('mousedown', () => {
        activateWindow(windowId);
    });

    windows.push({ 
        id: windowId, 
        el: windowEl, 
        isMinimized: false, 
        isMaximized: false,
        currentPath: initialPath,
        history: [initialPath],
        historyIndex: 0
    });

    // 加载文件列表
    loadFileList(windowId, initialPath);

    // 绑定返回按钮：只有存在按钮才绑定，避免报错
    const backBtn = windowEl.querySelector('#back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            const win = windows.find(w => w.id === windowId);
            if (win && win.historyIndex > 0) {
                win.historyIndex--;
                const prevPath = win.history[win.historyIndex];
                loadFileList(windowId, prevPath);
            }
        });
    }

    // 绑定侧边栏点击
    windowEl.querySelectorAll('.sidebar-item').forEach(item => {
        item.addEventListener('click', () => {
            const path = item.dataset.path;
            loadFileList(windowId, path);
        });
    });

    return windowId;
}

// 加载文件列表
async function loadFileList(windowId, path) {
    const win = windows.find(w => w.id === windowId);
    if (!win) return;

    const fileListEl = document.getElementById(`file-list-${windowId}`);
    const breadcrumbEl = document.getElementById(`breadcrumb-${windowId}`);
    if (!fileListEl) return;
    
    fileListEl.innerHTML = '<div class="text-center text-gray-500 col-span-4 py-8">加载中...</div>';

    try {
        const response = await fetch(`/api/files/list?path=${encodeURIComponent(path)}`);
        if (!response.ok) throw new Error("加载失败");
        const files = await response.json();

        // 更新当前路径和历史
        win.currentPath = path;
        if (win.history[win.historyIndex] !== path) {
            win.history = win.history.slice(0, win.historyIndex + 1);
            win.history.push(path);
            win.historyIndex++;
        }

        // 更新面包屑
        const pathParts = path ? path.split('/') : [];
        let breadcrumbHtml = '<span class="cursor-pointer hover:text-blue-600 shrink-0" data-path="">主目录</span>';
        let currentFullPath = '';
        pathParts.forEach((part, index) => {
            currentFullPath += (index > 0 ? '/' : '') + part;
            breadcrumbHtml += ` <span class="text-gray-400 shrink-0">/</span> <span class="cursor-pointer hover:text-blue-600 shrink-0" data-path="${currentFullPath}">${part}</span>`;
        });
        breadcrumbEl.innerHTML = breadcrumbHtml;

        // 绑定面包屑点击
        breadcrumbEl.querySelectorAll('[data-path]').forEach(item => {
            item.addEventListener('click', () => {
                loadFileList(windowId, item.dataset.path);
            });
        });

        const fileListEl = document.getElementById(`file-list-${windowId}`);
        if (!fileListEl) return;

        if (files.length === 0) {
            fileListEl.innerHTML = '<div class="text-center text-gray-500 py-8">目录为空</div>';
            return;
        }

        // 手机竖屏模式下切换成列表布局，横屏保持网格布局
        const isPortrait = window.innerWidth < window.innerHeight;
        if (isMobileMode && isPortrait) {
            // 竖屏列表模式
            fileListEl.classList.remove('grid', 'grid-cols-2', 'grid-cols-3', 'gap-2', 'gap-4');
            fileListEl.classList.add('flex', 'flex-col', 'gap-1');
        } else {
            // 横屏/桌面网格模式
            fileListEl.classList.remove('flex', 'flex-col', 'gap-1');
            fileListEl.classList.add('grid', 'gap-2');
        }

        let filesHtml = '';
        files.forEach(file => {
            let icon = 'fa-file-o text-gray-500';
            if (file.is_dir) {
                icon = 'fa-folder text-yellow-400';
            } else if (file.file_type === 'text') {
                icon = 'fa-file-text-o text-blue-400';
            } else if (file.file_type === 'image') {
                icon = 'fa-file-image-o text-purple-400';
            } else if (file.file_type === 'video') {
                icon = 'fa-file-video-o text-red-400';
            }

            // 手机竖屏用列表项布局，横屏/桌面用网格项布局
            if (isMobileMode && isPortrait) {
                filesHtml += `
                    <div class="file-item flex items-center cursor-pointer p-3 rounded hover:bg-gray-100 transition-all" 
                         data-path="${file.path}" 
                         data-is-dir="${file.is_dir}"
                         data-name="${file.name}">
                        <i class="fa ${icon} text-2xl mr-3"></i>
                        <span class="text-base truncate">${file.name}</span>
                    </div>
                `;
            } else {
                filesHtml += `
                    <div class="file-item flex flex-col items-center cursor-pointer p-2 rounded hover:bg-gray-100 transition-all" 
                         data-path="${file.path}" 
                         data-is-dir="${file.is_dir}"
                         data-name="${file.name}">
                        <i class="fa ${icon} ${isMobileMode ? 'text-4xl' : 'text-3xl'} mb-1"></i>
                        <span class="text-sm text-center line-clamp-2">${file.name}</span>
                    </div>
                `;
            }
        });
        fileListEl.innerHTML = filesHtml;

        // 绑定文件点击事件
        fileListEl.querySelectorAll('.file-item').forEach(item => {
            item.classList.add('select-none'); // 禁止选中文本，优化长按体验
            // 双击事件（原逻辑保留）
            item.addEventListener('dblclick', async () => {
                const filePath = item.dataset.path;
                const isDir = item.dataset.isDir === 'true';
                const fileName = item.dataset.name;

                if (isDir) {
                    // 进入子目录
                    loadFileList(windowId, filePath);
                } else {
                    // 打开文件
                    try {
                        const response = await fetch(`/api/files/read?path=${encodeURIComponent(filePath)}`);
                        if (!response.ok) {
                            throw new Error('无法打开此文件');
                        }
                        const fileData = await response.json();
                        createEditorWindow(fileData.name, fileData.path, fileData.content);
                    } catch (e) {
                        alert(e.message);
                    }
                }
            });

            // ========== 长按/右键菜单功能 ==========
            let longPressTimer = null;
            const LONG_PRESS_DELAY = 500; // 长按500ms触发

            // 移动端触摸开始
            item.addEventListener('touchstart', (e) => {
                longPressTimer = setTimeout(() => {
                    // 触发长按菜单
                    e.preventDefault();
                    const file = {
                        path: item.dataset.path,
                        is_dir: item.dataset.isDir === 'true',
                        name: item.dataset.name
                    };
                    showContextMenu(e.touches[0].clientX, e.touches[0].clientY, file);
                }, LONG_PRESS_DELAY);
            });

            // 触摸移动/结束/取消，清除计时器
            ['touchmove', 'touchend', 'touchcancel'].forEach(event => {
                item.addEventListener(event, () => {
                    if (longPressTimer) {
                        clearTimeout(longPressTimer);
                        longPressTimer = null;
                    }
                });
            });

            // 桌面端右键菜单
            item.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                const file = {
                    path: item.dataset.path,
                    is_dir: item.dataset.isDir === 'true',
                    name: item.dataset.name
                };
                showContextMenu(e.clientX, e.clientY, file);
            });
        });

    } catch (e) {
        fileListEl.innerHTML = `<div class="text-center text-red-500 col-span-4 py-8">加载失败: ${e.message}</div>`;
    }
}

// ========== 全局上下文菜单功能 ==========
function showContextMenu(x, y, file) {
    // 先关闭已存在的菜单
    closeContextMenu();

    // 创建菜单容器
    const menu = document.createElement('div');
    menu.id = 'file-context-menu';
    menu.className = 'fixed bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[160px] z-[99999]';
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;

    // 菜单项：使用编辑器打开
    const openEditorItem = document.createElement('div');
    openEditorItem.className = 'px-4 py-3 hover:bg-gray-100 cursor-pointer flex items-center gap-3 text-base';
    openEditorItem.innerHTML = '<i class="fa fa-edit text-blue-500 w-5 text-center"></i> 使用编辑器打开';
    openEditorItem.addEventListener('click', async () => {
        if (file.is_dir) {
            alert('文件夹请选择「打开为工作区」选项');
        } else {
            try {
                const response = await fetch(`/api/files/read?path=${encodeURIComponent(file.path)}`);
                if (!response.ok) throw new Error('无法打开文件');
                const fileData = await response.json();
                createEditorWindow(fileData.name, fileData.path, fileData.content);
            } catch (err) {
                alert(err.message);
            }
        }
        closeContextMenu();
    });
    menu.appendChild(openEditorItem);

    // 菜单项：打开文件夹为工作区（仅文件夹显示）
    if (file.is_dir) {
        const openWorkspaceItem = document.createElement('div');
        openWorkspaceItem.className = 'px-4 py-3 hover:bg-gray-100 cursor-pointer flex items-center gap-3 text-base';
        openWorkspaceItem.innerHTML = '<i class="fa fa-folder-open text-green-500 w-5 text-center"></i> 打开为工作区';
        openWorkspaceItem.addEventListener('click', async () => {
            // 新建编辑器窗口并加载工作区
            const editorWindowId = createEditorWindow('工作区', '', '');
            setTimeout(async () => {
                await loadFileTree(editorWindowId, file.path, file.name);
            }, 300);
            closeContextMenu();
        });
        menu.appendChild(openWorkspaceItem);
    }

    // 点击其他地方关闭菜单
    setTimeout(() => {
        document.addEventListener('click', closeContextMenu, { once: true });
        document.addEventListener('touchstart', closeContextMenu, { once: true });
    }, 0);

    // 防止点击菜单本身关闭
    menu.addEventListener('click', (e) => {
        e.stopPropagation();
    });
    menu.addEventListener('touchstart', (e) => {
        e.stopPropagation();
    });

    // 防止菜单超出屏幕边界
    document.body.appendChild(menu);
    const rect = menu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
        menu.style.left = `${Math.max(0, x - rect.width)}px`;
    }
    if (rect.bottom > window.innerHeight) {
        menu.style.top = `${Math.max(0, y - rect.height)}px`;
    }
}

// 关闭上下文菜单
function closeContextMenu() {
    const existingMenu = document.getElementById('file-context-menu');
    if (existingMenu) {
        existingMenu.remove();
    }
}

// 创建编辑器窗口
function createEditorWindow(fileName = "未命名文件", filePath = "", content = "") {
    const windowId = `window-${Date.now()}`;
    zIndexCounter++;
    
    const windowEl = document.createElement('div');
    windowEl.id = windowId;
    windowEl.className = 'absolute bg-white rounded-lg shadow-2xl pointer-events-auto overflow-hidden flex flex-col';
    
    // 手机模式下默认最大化
    if (isMobileMode) {
        windowEl.style.left = '0px';
        windowEl.style.top = `${document.getElementById('android-status-bar')?.offsetHeight || 0}px`;
        windowEl.style.width = `${window.innerWidth}px`;
        windowEl.style.height = `${window.innerHeight - (document.getElementById('android-status-bar')?.offsetHeight || 0) - document.getElementById('taskbar').offsetHeight}px`;
    } else {
        windowEl.style.width = `1000px`;
        windowEl.style.height = `700px`;
        windowEl.style.left = `${Math.max(0, (window.innerWidth - 1000) / 2)}px`;
        windowEl.style.top = `${Math.max(0, (window.innerHeight - 700) / 2)}px`;
    }
    
    windowEl.style.zIndex = zIndexCounter;

    // 识别文件语言
    const ext = fileName.split('.').pop().toLowerCase();
    const languageMap = {
        'js': 'javascript', 'ts': 'typescript', 'py': 'python', 'java': 'java', 'cpp': 'cpp',
        'c': 'c', 'html': 'html', 'css': 'css', 'json': 'json', 'md': 'markdown',
        'txt': 'plaintext', 'xml': 'xml', 'sql': 'sql', 'sh': 'shell', 'go': 'go',
        'php': 'php', 'rb': 'ruby', 'rs': 'rust'
    };
    const language = languageMap[ext] || 'plaintext';
    // 只根据文件后缀判断markdown文件，完全不依赖语言参数，确保工作区打开的文件也能识别
    const isMarkdown = /\.(md|markdown)$/i.test(filePath.trim());

    // 窗口标题栏
    windowEl.innerHTML = `
        <div class="window-header h-10 bg-gray-100 flex items-center px-3 justify-between ${isMobileMode ? '' : 'window-drag cursor-move'}">
            <div class="flex items-center gap-2">
                <i class="fa fa-code text-blue-600"></i>
                <span class="font-medium">${fileName}</span>
            </div>
            <div class="flex gap-2 window-no-drag">
                <button class="minimize-btn w-4 h-4 rounded-full bg-yellow-400 hover:bg-yellow-500 transition-colors"></button>
                <button class="maximize-btn w-4 h-4 rounded-full bg-green-400 hover:bg-green-500 transition-colors"></button>
                <button class="close-btn w-4 h-4 rounded-full bg-red-400 hover:bg-red-500 transition-colors"></button>
            </div>
        </div>
        <div class="window-content flex-1 flex flex-col">
            <!-- 工具栏 -->
            <div class="h-12 border-b flex items-center px-4 gap-4 bg-gray-50 shrink-0">
                <!-- 文件菜单 -->
                <div class="relative group">
                    <button class="px-3 py-1.5 flex items-center gap-1 text-gray-700 hover:bg-gray-200 rounded">
                        <i class="fa fa-file-o"></i> 文件 <i class="fa fa-caret-down ml-1 text-xs"></i>
                    </button>
                    <div class="absolute left-0 top-full mt-1 w-48 bg-white rounded shadow-lg border border-gray-200 z-50 hidden group-hover:block">
                        <button id="open-file-btn-${windowId}" class="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm">
                            <i class="fa fa-folder-open text-blue-500"></i> 打开文件
                        </button>
                        <button id="open-folder-btn-${windowId}" class="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm">
                            <i class="fa fa-folder text-yellow-500"></i> 打开文件夹作为工作区
                        </button>
                        <div class="border-t border-gray-200 my-1"></div>
                        <button id="save-btn-${windowId}" class="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm">
                            <i class="fa fa-save text-green-500"></i> 保存
                        </button>
                    </div>
                </div>
                <!-- markdown快速切换按钮移到文件菜单和视图菜单之间，不会挡住右上角窗口控制按钮 -->
                <button id="quick-md-toggle-${windowId}" class="px-2 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 flex items-center gap-1 ml-2 ${isMarkdown ? '' : 'hidden'}">
                    <i class="fa fa-eye"></i> 预览
                </button>
                <!-- 视图菜单 -->
                <div class="relative group">
                    <button class="px-3 py-1.5 flex items-center gap-1 text-gray-700 hover:bg-gray-200 rounded">
                        <i class="fa fa-eye"></i> 视图 <i class="fa fa-caret-down ml-1 text-xs"></i>
                    </button>
                    <div class="absolute left-0 top-full mt-1 w-48 bg-white rounded shadow-lg border border-gray-200 z-50 hidden group-hover:block">
                        <!-- 强制显示markdown切换选项，只要是md文件就可见 -->
                        <button id="view-md-toggle-${windowId}" class="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm ${isMarkdown ? '' : 'hidden'}">
                            <i class="fa fa-eye text-blue-500"></i> 切换到预览模式
                        </button>
                        <div class="border-t border-gray-200 my-1 ${isMarkdown ? '' : 'hidden'}"></div>
                        <button id="view-line-number-toggle-${windowId}" class="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm">
                            <i class="fa fa-list-ol text-purple-500"></i> 隐藏行号
                        </button>
                        <button id="view-word-wrap-toggle-${windowId}" class="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm">
                            <i class="fa fa-arrows-h text-orange-500"></i> 关闭自动换行
                        </button>
                    </div>
                </div>
                <div class="text-sm text-gray-500 ml-auto">${filePath}</div>
            </div>
            <!-- 工作区布局 -->
            <div class="flex flex-1 overflow-hidden">
                <!-- 文件树浮动面板（默认隐藏，带滑入滑出动画） -->
                <div id="file-tree-panel-${windowId}" class="fixed z-50 w-[80%] md:w-[300px] h-full shadow-2xl bg-white left-0 top-0 md:static md:w-64 h-full transition-all duration-300 transform" style="width: 80%; display: none; transform: translateX(0) scale(1);">
                    <div class="h-full border-r bg-gray-100 overflow-hidden">
                        <div class="p-2 border-b bg-gray-100 flex items-center justify-between sticky top-0 h-10">
                            <span class="text-sm font-medium text-gray-600" id="workspace-name-${windowId}">工作区</span>
                            <!-- 关闭按钮：直接内联onclick，带动画缩小到左上角菜单按钮，100%生效 -->
                            <button id="close-file-tree-btn-${windowId}" class="text-gray-500 hover:text-gray-700 p-2" onclick="const panel = this.closest('#file-tree-panel-${windowId}'); panel.style.transform='translateX(-100%) translateY(-50%) scale(0)'; setTimeout(()=>panel.style.display='none', 280);">
                                <i class="fa fa-times"></i>
                            </button>
                        </div>
                        <!-- 调整文件树高度：减去头部的40px，确保能滚动到底部，加移动端流畅滚动支持 -->
                        <div id="file-tree-${windowId}" class="p-2 overflow-y-auto bg-gray-50" style="height: calc(100% - 40px); -webkit-overflow-scrolling: touch; touch-action: pan-y;"></div>
                    </div>
                </div>
                <!-- 编辑器区域：加relative定位，确保预览容器只覆盖编辑器部分，不会挡住标题栏 -->
                <div class="flex-1 overflow-hidden relative" id="editor-container-${windowId}">
                    <div class="relative w-full h-full" id="monaco-editor-${windowId}">
                        <div id="editor-${windowId}" class="w-full h-full"></div>
                    </div>
                    <!-- 预览容器和编辑器同级，不再放在编辑器里面 -->
                    ${isMarkdown ? `<div id="preview-${windowId}" class="w-full h-full p-4 overflow-auto bg-white hidden absolute top-0 left-0 z-10"></div>` : ''}
                </div>
                <!-- 文件树切换按钮：直接内联onclick，100%生效，超高z-index确保不会被遮挡 -->
                <button id="toggle-file-tree-btn-${windowId}" class="absolute top-2 left-2 z-[9999] p-2 bg-white rounded shadow-lg hover:bg-gray-100 md:hidden" onclick="const panel = document.getElementById('file-tree-panel-${windowId}'); if(panel.style.display === 'none' || panel.style.display === '') { panel.style.display='block'; panel.style.transform='translateX(0) scale(1)'; } else { panel.style.transform='translateX(-100%) translateY(-50%) scale(0)'; setTimeout(()=>panel.style.display='none', 280); }">
                    <i class="fa fa-bars text-gray-700"></i>
                </button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('window-container').appendChild(windowEl);
    activeWindowId = windowId;

    // 绑定窗口控制事件
    bindWindowControls(windowEl, windowId);
    
    // 桌面模式下才启用拖拽和调整大小
    if (!isMobileMode) {
        makeDraggable(windowEl);
        makeResizable(windowEl);
    }

    // 点击窗口激活
    windowEl.addEventListener('mousedown', () => {
        activateWindow(windowId);
    });

    // 初始化Monaco Editor
    require(['vs/editor/editor.main'], function() {
        const editor = monaco.editor.create(document.getElementById(`editor-${windowId}`), {
            value: content,
            language: language,
            theme: 'vs-dark',
            fontSize: isMobileMode ? 16 : 14,
            lineNumbers: 'on',
            minimap: { enabled: !isMobileMode }, // 手机模式下隐藏小地图，节省空间
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            insertSpaces: true,
            // 移动端触摸适配
            touchSupport: 'on',
            scrollPredominantAxis: true,
            mouseWheelScrollSensitivity: 1.5,
            fastScrollSensitivity: 5,
            smoothScrolling: true,
            wordWrap: isMobileMode ? 'on' : 'off', // 手机模式默认自动换行，可切换
            wordWrapColumn: 80,
            // 支持缩放
            fontLigatures: true,
            mouseWheelZoom: true,
            // 支持横向滚动
            overflowWidgetsDomNode: document.body,
            scrollbar: {
                horizontal: 'visible',
                vertical: 'visible',
                useShadows: false,
                verticalScrollbarSize: 10,
                horizontalScrollbarSize: 10
            }
        });
        monacoEditorInstances.set(windowId, editor);

        // ========== 视图菜单功能逻辑 ==========
        // 行号切换
        let lineNumbersVisible = true;
        const lineNumberToggleBtn = document.getElementById(`view-line-number-toggle-${windowId}`);
        lineNumberToggleBtn.addEventListener('click', () => {
            if (lineNumbersVisible) {
                editor.updateOptions({ lineNumbers: 'off' });
                lineNumberToggleBtn.innerHTML = '<i class="fa fa-list-ol text-purple-500"></i> 显示行号';
                lineNumbersVisible = false;
            } else {
                editor.updateOptions({ lineNumbers: 'on' });
                lineNumberToggleBtn.innerHTML = '<i class="fa fa-list-ol text-purple-500"></i> 隐藏行号';
                lineNumbersVisible = true;
            }
        });

        // 自动换行切换
        let wordWrapEnabled = isMobileMode;
        const wordWrapToggleBtn = document.getElementById(`view-word-wrap-toggle-${windowId}`);
        wordWrapToggleBtn.innerHTML = wordWrapEnabled 
            ? '<i class="fa fa-arrows-h text-orange-500"></i> 关闭自动换行' 
            : '<i class="fa fa-arrows-h text-orange-500"></i> 开启自动换行';
        wordWrapToggleBtn.addEventListener('click', () => {
            if (wordWrapEnabled) {
                editor.updateOptions({ wordWrap: 'off' });
                wordWrapToggleBtn.innerHTML = '<i class="fa fa-arrows-h text-orange-500"></i> 开启自动换行';
                wordWrapEnabled = false;
            } else {
                editor.updateOptions({ wordWrap: 'on' });
                wordWrapToggleBtn.innerHTML = '<i class="fa fa-arrows-h text-orange-500"></i> 关闭自动换行';
                wordWrapEnabled = true;
            }
        });

        // Markdown编辑/预览切换
        let isPreviewMode = false;
        if (isMarkdown) {
            const mdToggleBtn = document.getElementById(`view-md-toggle-${windowId}`);
            const quickToggleBtn = document.getElementById(`quick-md-toggle-${windowId}`);
            const previewContainer = document.getElementById(`preview-${windowId}`);

            // 同步两个按钮的文本
            function updateToggleButtonsText() {
                if (isPreviewMode) {
                    mdToggleBtn.innerHTML = '<i class="fa fa-edit text-blue-500"></i> 切换到编辑模式';
                    quickToggleBtn.innerHTML = '<i class="fa fa-edit"></i> 编辑';
                } else {
                    mdToggleBtn.innerHTML = '<i class="fa fa-eye text-blue-500"></i> 切换到预览模式';
                    quickToggleBtn.innerHTML = '<i class="fa fa-eye"></i> 预览';
                }
            }

            // 切换逻辑函数
            function toggleMdMode() {
                if (isPreviewMode) {
                    // 切换到编辑模式：隐藏预览
                    previewContainer.classList.add('hidden');
                    isPreviewMode = false;
                } else {
                    // 切换到预览模式，获取最新编辑内容渲染
                    const content = editor.getValue();
                    // 完整markdown渲染支持
                    let rendered = content
                        .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold my-3">$1</h1>')
                        .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold my-2">$1</h2>')
                        .replace(/^### (.*$)/gm, '<h3 class="text-lg font-bold my-2">$1</h3>')
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em>$1</em>')
                        .replace(/^- (.*$)/gm, '<li class="ml-4 list-disc">$1</li>')
                        .replace(/(<li.*<\/li>)/g, '<ul class="my-2">$1</ul>')
                        .replace(/^[0-9]+\. (.*$)/gm, '<li class="ml-4 list-decimal">$1</li>')
                        .replace(/(!\[.*?\]\(.*?\))\n/g, '$1')
                        .replace(/!\[(.*?)\]\((.*?)\)/g, '<img alt="$1" src="$2" class="max-w-full rounded my-3 shadow">')
                        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" class="text-blue-500 underline hover:text-blue-600">$1</a>')
                        .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-red-500 font-mono text-sm">$1</code>')
                        .replace(/```([^`]+)```/g, '<pre class="bg-gray-100 p-3 rounded my-2 overflow-x-auto font-mono text-sm"><code>$1</code></pre>')
                        .replace(/\n/g, '<br>');
                    
                    previewContainer.innerHTML = rendered;
                    previewContainer.classList.remove('hidden');
                    isPreviewMode = true;
                }
                updateToggleButtonsText();
            }

            // 两个按钮都绑定切换事件
            mdToggleBtn.addEventListener('click', toggleMdMode);
            quickToggleBtn.addEventListener('click', toggleMdMode);
        }

        // 保存按钮事件
        document.getElementById(`save-btn-${windowId}`).addEventListener('click', async () => {
            const currentContent = editor.getValue();
            try {
                const response = await fetch('/api/files/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ path: filePath, content: currentContent })
                });
                const result = await response.json();
                if (response.ok) {
                    // 保存成功提示
                    const saveBtn = document.getElementById(`save-btn-${windowId}`);
                    const originalText = saveBtn.innerHTML;
                    saveBtn.innerHTML = '<i class="fa fa-check"></i> 已保存';
                    saveBtn.classList.remove('bg-blue-500', 'hover:bg-blue-600');
                    saveBtn.classList.add('bg-green-500');
                    setTimeout(() => {
                        saveBtn.innerHTML = originalText;
                        saveBtn.classList.remove('bg-green-500');
                        saveBtn.classList.add('bg-blue-500', 'hover:bg-blue-600');
                    }, 1500);
                } else {
                    alert(`保存失败: ${result.detail || result.message}`);
                }
            } catch (e) {
                alert(`保存失败: ${e.message}`);
            }
        });

        // 打开文件按钮事件
        document.getElementById(`open-file-btn-${windowId}`).addEventListener('click', () => {
            // 创建临时文件选择窗口
            const selectWindowId = createFileManagerWindow();
            const selectWin = windows.find(w => w.id === selectWindowId);
            // 修改窗口标题，提示是选择文件
            selectWin.el.querySelector('.window-header .font-medium').textContent = '选择要打开的文件';
            // 监听文件双击事件
            const observer = new MutationObserver(() => {
                const fileListEl = document.getElementById(`file-list-${selectWindowId}`);
                if (fileListEl) {
                    fileListEl.querySelectorAll('.file-item').forEach(item => {
                        item.addEventListener('dblclick', async (e) => {
                            const isDir = item.dataset.isDir === 'true';
                            if (!isDir) {
                                e.stopPropagation();
                                const filePath = item.dataset.path;
                                const fileName = item.dataset.name;
                                // 加载选中的文件到当前编辑器
                                try {
                                    const response = await fetch(`/api/files/read?path=${encodeURIComponent(filePath)}`);
                                    if (!response.ok) throw new Error('无法打开文件');
                                    const fileData = await response.json();
                                    // 更新编辑器内容
                                    editor.setValue(fileData.content);
                                    // 更新窗口标题
                                    windowEl.querySelector('.window-header .font-medium').textContent = fileData.name;
                                    // 更新路径显示
                                    windowEl.querySelector('.window-content .text-gray-500').textContent = fileData.path;
                                    // 更新当前文件路径
                                    filePath = fileData.path;
                                    fileName = fileData.name;
                                    // 重新识别文件语言
                                    const ext = fileName.split('.').pop().toLowerCase();
                                    const languageMap = {
                                        'js': 'javascript', 'ts': 'typescript', 'py': 'python', 'java': 'java', 'cpp': 'cpp',
                                        'c': 'c', 'html': 'html', 'css': 'css', 'json': 'json', 'md': 'markdown',
                                        'txt': 'plaintext', 'xml': 'xml', 'sql': 'sql', 'sh': 'shell', 'go': 'go',
                                        'php': 'php', 'rb': 'ruby', 'rs': 'rust'
                                    };
                                    const newLanguage = languageMap[ext] || 'plaintext';
                                    monaco.editor.setModelLanguage(editor.getModel(), newLanguage);
                                    // 关闭选择窗口
                                    closeWindow(selectWindowId);
                                    observer.disconnect();
                                } catch (err) {
                                    alert(err.message);
                                }
                            }
                        });
                    });
                }
            });
            observer.observe(selectWin.el, { childList: true, subtree: true });
        });

        // 打开文件夹按钮事件 - 选择作为工作区
        document.getElementById(`open-folder-btn-${windowId}`).addEventListener('click', () => {
            // 创建临时文件夹选择窗口
            const selectWindowId = createFileManagerWindow();
            const selectWin = windows.find(w => w.id === selectWindowId);
            selectWin.el.querySelector('.window-header .font-medium').textContent = '选择工作区文件夹';
            
            // 监听面包屑点击和文件项点击，增加确认选择按钮
            const observer = new MutationObserver(() => {
                const breadcrumbEl = document.getElementById(`breadcrumb-${selectWindowId}`);
                if (breadcrumbEl && !document.getElementById(`select-folder-btn-${selectWindowId}`)) {
                    // 适配不同端的按钮定位：移动端固定在屏幕最底部，永远可见；桌面端悬浮在窗口右下角
                    const selectBtn = document.createElement('button');
                    selectBtn.id = `select-folder-btn-${selectWindowId}`;
                    if (isMobileMode) {
                        // 移动端：固定在屏幕最底部，全屏宽度，适配安全区，绝对不会被遮挡
                        selectBtn.className = 'fixed bottom-0 left-0 right-0 px-6 py-4 bg-blue-500 text-white text-lg font-medium flex items-center justify-center gap-2 z-[9999] pb-[calc(1rem+env(safe-area-inset-bottom))]';
                        selectBtn.innerHTML = '<i class="fa fa-check"></i> 选择此文件夹';
                        // 直接添加到body，不受任何窗口元素限制
                        document.body.appendChild(selectBtn);
                    } else {
                        // 桌面端：悬浮在窗口右下角
                        selectBtn.className = 'absolute bottom-16 right-4 px-5 py-3 bg-blue-500 text-white rounded-lg shadow-2xl text-base hover:bg-blue-600 flex items-center gap-2 z-[1000]';
                        selectBtn.innerHTML = '<i class="fa fa-check"></i> 选择文件夹';
                        // 给选择窗口添加relative定位+visible溢出，防止按钮被裁剪
                        selectWin.el.classList.add('relative', 'overflow-visible');
                        selectWin.el.appendChild(selectBtn);
                    }
                    
                    // 确认选择按钮事件
                    selectBtn.addEventListener('click', async () => {
                        // 获取当前路径
                        const currentPath = selectWin.currentPath;
                        const folderName = currentPath.split('/').pop() || '主目录';
                        
                        // 加载文件树到编辑器左侧
                        await loadFileTree(windowId, currentPath, folderName);
                        
                        // 关闭选择窗口+移除按钮
                        closeWindow(selectWindowId);
                        observer.disconnect();
                        selectBtn.remove();
                    });
                }
            });
            observer.observe(selectWin.el, { childList: true, subtree: true });
        });

        // 关闭文件树按钮事件：只有存在按钮才绑定，避免报错
        const closeFileTreeBtn = document.getElementById(`close-file-tree-${windowId}`);
        if (closeFileTreeBtn) {
            closeFileTreeBtn.addEventListener('click', () => {
                const fileTreePanel = document.getElementById(`file-tree-panel-${windowId}`);
                if (fileTreePanel) {
                    fileTreePanel.style.width = '0';
                    fileTreePanel.style.borderRight = 'none';
                }
            });
        }

        // Markdown预览相关
        if (isMarkdown) {
            // 引入marked.js
            if (!window.marked) {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
                document.head.appendChild(script);
            }

            // 更新预览
            function updatePreview() {
                if (!window.marked) return;
                const markdown = editor.getValue();
                const html = marked.parse(markdown);
                document.getElementById(`preview-${windowId}`).innerHTML = `
                <style>
                    #preview-${windowId} { line-height: 1.6; }
                    #preview-${windowId} h1 { font-size: 2em; margin: 0.67em 0; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
                    #preview-${windowId} h2 { font-size: 1.5em; margin: 0.83em 0; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
                    #preview-${windowId} h3 { font-size: 1.17em; margin: 1em 0; }
                    #preview-${windowId} p { margin: 1em 0; }
                    #preview-${windowId} ul, #preview-${windowId} ol { margin: 1em 0; padding-left: 2em; }
                    #preview-${windowId} li { margin: 0.5em 0; }
                    #preview-${windowId} code { background: #f6f8fa; padding: 0.2em 0.4em; border-radius: 3px; }
                    #preview-${windowId} pre { background: #f6f8fa; padding: 1em; border-radius: 6px; overflow-x: auto; }
                    #preview-${windowId} pre code { padding: 0; }
                    #preview-${windowId} blockquote { border-left: 4px solid #ddd; padding-left: 1em; margin: 1em 0; color: #666; }
                    #preview-${windowId} table { border-collapse: collapse; width: 100%; margin: 1em 0; }
                    #preview-${windowId} th, #preview-${windowId} td { border: 1px solid #ddd; padding: 0.5em; text-align: left; }
                    #preview-${windowId} th { background: #f6f8fa; }
                </style>
                ${html}
                `;
            }

            // 初始更新预览
            updatePreview();
            // 内容变化时更新预览
            editor.onDidChangeModelContent(() => {
                updatePreview();
            });

            // 模式切换
            document.getElementById(`edit-mode-${windowId}`).addEventListener('click', () => {
                document.getElementById(`editor-${windowId}`).classList.remove('hidden');
                document.getElementById(`preview-${windowId}`).classList.add('hidden');
                document.getElementById(`editor-container-${windowId}`).classList.remove('flex');
                document.getElementById(`editor-${windowId}`).style.width = '100%';
                // 更新按钮样式
                document.querySelectorAll(`#editor-container-${windowId} ~ .flex button`).forEach(btn => {
                    btn.classList.remove('bg-blue-500', 'text-white');
                    btn.classList.add('bg-gray-200', 'text-gray-700');
                });
                document.getElementById(`edit-mode-${windowId}`).classList.remove('bg-gray-200', 'text-gray-700');
                document.getElementById(`edit-mode-${windowId}`).classList.add('bg-blue-500', 'text-white');
            });

            document.getElementById(`preview-mode-${windowId}`).addEventListener('click', () => {
                document.getElementById(`editor-${windowId}`).classList.add('hidden');
                document.getElementById(`preview-${windowId}`).classList.remove('hidden');
                document.getElementById(`editor-container-${windowId}`).classList.remove('flex');
                // 更新按钮样式
                document.querySelectorAll(`#editor-container-${windowId} ~ .flex button`).forEach(btn => {
                    btn.classList.remove('bg-blue-500', 'text-white');
                    btn.classList.add('bg-gray-200', 'text-gray-700');
                });
                document.getElementById(`preview-mode-${windowId}`).classList.remove('bg-gray-200', 'text-gray-700');
                document.getElementById(`preview-mode-${windowId}`).classList.add('bg-blue-500', 'text-white');
            });

            document.getElementById(`split-mode-${windowId}`).addEventListener('click', () => {
                document.getElementById(`editor-${windowId}`).classList.remove('hidden');
                document.getElementById(`preview-${windowId}`).classList.remove('hidden');
                document.getElementById(`editor-container-${windowId}`).classList.add('flex');
                document.getElementById(`editor-${windowId}`).style.width = '50%';
                document.getElementById(`preview-${windowId}`).style.width = '50%';
                // 更新按钮样式
                document.querySelectorAll(`#editor-container-${windowId} ~ .flex button`).forEach(btn => {
                    btn.classList.remove('bg-blue-500', 'text-white');
                    btn.classList.add('bg-gray-200', 'text-gray-700');
                });
                document.getElementById(`split-mode-${windowId}`).classList.remove('bg-gray-200', 'text-gray-700');
                document.getElementById(`split-mode-${windowId}`).classList.add('bg-blue-500', 'text-white');
            });
        }
    });
    windows.push({ id: windowId, el: windowEl, isMinimized: false, isMaximized: isMobileMode, type: 'editor' });
    
    // 窗口关闭时销毁编辑器实例
    windowEl.querySelector('.close-btn').addEventListener('click', () => {
        const editor = monacoEditorInstances.get(windowId);
        if (editor) {
            editor.dispose();
            monacoEditorInstances.delete(windowId);
        }
    });

    return windowId;
}

// 递归加载文件树
async function loadFileTree(windowId, rootPath, folderName) {
    const fileTreePanel = document.getElementById(`file-tree-panel-${windowId}`);
    const fileTreeEl = document.getElementById(`file-tree-${windowId}`);
    const workspaceNameEl = document.getElementById(`workspace-name-${windowId}`);
    
    // 显示文件树面板
    fileTreePanel.style.display = 'block';
    workspaceNameEl.textContent = folderName;

    // 递归加载目录结构
    async function loadDir(path, parentEl, level = 0) {
        try {
            const response = await fetch(`/api/files/list?path=${encodeURIComponent(path)}`);
            if (!response.ok) return;
            const files = await response.json();
            
            // 先排序：文件夹在前，文件在后，按名称排序
            const dirs = files.filter(f => f.is_dir).sort((a, b) => a.name.localeCompare(b.name));
            const regularFiles = files.filter(f => !f.is_dir).sort((a, b) => a.name.localeCompare(b.name));
            const sortedFiles = [...dirs, ...regularFiles];

            sortedFiles.forEach(file => {
                const itemEl = document.createElement('div');
                itemEl.className = 'flex items-center py-1 px-2 rounded hover:bg-gray-200 cursor-pointer text-sm';
                itemEl.style.paddingLeft = `${level * 12 + 8}px`;
                itemEl.dataset.path = file.path;
                itemEl.dataset.isDir = file.is_dir;

                if (file.is_dir) {
                    // 文件夹
                    itemEl.innerHTML = `
                        <i class="fa fa-caret-right text-gray-500 w-4 mr-1 transition-transform duration-200"></i>
                        <i class="fa fa-folder text-yellow-500 mr-2"></i>
                        <span class="truncate">${file.name}</span>
                    `;
                    let expanded = false;
                    let childrenLoaded = false;
                    const childrenEl = document.createElement('div');

                    itemEl.addEventListener('click', async () => {
                        if (!expanded) {
                            // 展开
                            itemEl.querySelector('.fa-caret-right').classList.add('rotate-90');
                            if (!childrenLoaded) {
                                // 加载子目录
                                await loadDir(file.path, childrenEl, level + 1);
                                childrenLoaded = true;
                            }
                            itemEl.parentNode.insertBefore(childrenEl, itemEl.nextSibling);
                            expanded = true;
                        } else {
                            // 收起
                            itemEl.querySelector('.fa-caret-right').classList.remove('rotate-90');
                            childrenEl.remove();
                            expanded = false;
                        }
                    });
                } else {
                    // 文件
                    let icon = 'fa-file-o text-gray-500';
                    const ext = file.name.split('.').pop().toLowerCase();
                    if (['js', 'ts', 'py', 'java', 'cpp', 'c', 'go', 'php', 'rb', 'rs'].includes(ext)) {
                        icon = 'fa-file-code-o text-blue-500';
                    } else if (['html', 'css', 'json', 'xml', 'sql', 'sh'].includes(ext)) {
                        icon = 'fa-file-code-o text-green-500';
                    } else if (['md', 'txt'].includes(ext)) {
                        icon = 'fa-file-text-o text-gray-600';
                    } else if (['jpg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
                        icon = 'fa-file-image-o text-purple-500';
                    } else if (['mp4', 'avi', 'mov'].includes(ext)) {
                        icon = 'fa-file-video-o text-red-500';
                    }

                    itemEl.innerHTML = `
                        <span class="w-4 mr-1"></span>
                        <i class="fa ${icon} mr-2"></i>
                        <span class="truncate">${file.name}</span>
                    `;

                    // 点击文件打开
                    itemEl.addEventListener('click', async () => {
                        try {
                            const response = await fetch(`/api/files/read?path=${encodeURIComponent(file.path)}`);
                            if (!response.ok) throw new Error('无法打开文件');
                            const fileData = await response.json();
                            
                            // 获取当前编辑器实例
                            const editor = monacoEditorInstances.get(windowId);
                            if (editor) {
                                editor.setValue(fileData.content);
                                // 更新窗口标题和路径
                                const windowEl = document.getElementById(windowId);
                                windowEl.querySelector('.window-header .font-medium').textContent = fileData.name;
                                windowEl.querySelector('.window-content .text-gray-500').textContent = fileData.path;
                                // 更新当前文件路径
                                // 重新识别语言
                                const newExt = fileData.name.split('.').pop().toLowerCase();
                                const languageMap = {
                                    'js': 'javascript', 'ts': 'typescript', 'py': 'python', 'java': 'java', 'cpp': 'cpp',
                                    'c': 'c', 'html': 'html', 'css': 'css', 'json': 'json', 'md': 'markdown',
                                    'txt': 'plaintext', 'xml': 'xml', 'sql': 'sql', 'sh': 'shell', 'go': 'go',
                                    'php': 'php', 'rb': 'ruby', 'rs': 'rust'
                                };
                                const newLanguage = languageMap[newExt] || 'plaintext';
                                monaco.editor.setModelLanguage(editor.getModel(), newLanguage);
                            }
                        } catch (err) {
                            alert(err.message);
                        }
                    });
                }
                parentEl.appendChild(itemEl);
            });
        } catch (e) {
            console.error('加载文件树失败:', e);
        }
    }

    // 清空现有文件树，加载根目录
    fileTreeEl.innerHTML = '';
    await loadDir(rootPath, fileTreeEl);
}

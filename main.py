from fastapi import FastAPI, WebSocket, Request, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
import os
import asyncio
import subprocess
import json
from typing import Optional, List
from pathlib import Path

app = FastAPI(title="WebWindow", version="1.0.0")

# 配置路径
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")
TEMPLATES_DIR = os.path.join(BASE_DIR, "templates")
USER_HOME = os.path.expanduser("~")

# 挂载静态文件和模板
os.makedirs(STATIC_DIR, exist_ok=True)
os.makedirs(TEMPLATES_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
templates = Jinja2Templates(directory=TEMPLATES_DIR)

# ========== 数据模型 ==========
class FileItem(BaseModel):
    name: str
    path: str
    is_dir: bool
    size: int
    modified: float
    file_type: str

# ========== 工具函数 ==========
def safe_path(base_path: str, user_path: str) -> Path:
    """安全路径校验，防止目录遍历攻击"""
    base = Path(base_path).resolve()
    target = (base / user_path.lstrip('/')).resolve()
    if not str(target).startswith(str(base)):
        raise HTTPException(status_code=403, detail="路径访问被拒绝")
    return target

# ========== 基础路由 ==========
@app.get("/")
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

# ========== 文件管理API ==========
@app.get("/api/files/list", response_model=List[FileItem])
async def list_files(path: str = ""):
    try:
        target_path = safe_path(USER_HOME, path)
        if not target_path.exists() or not target_path.is_dir():
            raise HTTPException(status_code=404, detail="目录不存在")
        
        files = []
        for entry in os.scandir(target_path):
            file_type = "file"
            if entry.is_dir():
                file_type = "dir"
            elif entry.name.endswith(('.txt', '.md', '.py', '.js', '.html', '.css', '.json', '.java', '.cpp', '.c')):
                file_type = "text"
            elif entry.name.endswith(('.jpg', '.jpeg', '.png', '.gif', '.bmp')):
                file_type = "image"
            elif entry.name.endswith(('.mp4', '.avi', '.mov', '.mkv')):
                file_type = "video"
            
            files.append(FileItem(
                name=entry.name,
                path=str(os.path.relpath(entry.path, USER_HOME)),
                is_dir=entry.is_dir(),
                size=entry.stat().st_size if entry.is_file() else 0,
                modified=entry.stat().st_mtime,
                file_type=file_type
            ))
        
        # 目录排在前面，然后按名称排序
        files.sort(key=lambda x: (not x.is_dir, x.name.lower()))
        return files
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"读取目录失败: {str(e)}")

@app.get("/api/files/read")
async def read_file(path: str):
    try:
        target_path = safe_path(USER_HOME, path)
        if not target_path.exists() or not target_path.is_file():
            raise HTTPException(status_code=404, detail="文件不存在")
        
        # 限制只读取文本文件，最大10MB
        if target_path.stat().st_size > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="文件过大，无法打开")
        
        try:
            with open(target_path, 'r', encoding='utf-8') as f:
                content = f.read()
            return {"path": path, "name": target_path.name, "content": content}
        except UnicodeDecodeError:
            raise HTTPException(status_code=400, detail="不是文本文件，无法打开")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"读取文件失败: {str(e)}")

# 保存文件API
@app.post("/api/files/save")
async def save_file(file_data: dict):
    try:
        path = file_data.get("path", "")
        content = file_data.get("content", "")
        if not path:
            raise HTTPException(status_code=400, detail="路径不能为空")
        
        target_path = safe_path(USER_HOME, path)
        # 确保目录存在
        target_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(target_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        return {"status": "success", "message": "保存成功", "path": path}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"保存文件失败: {str(e)}")

# ========== 终端模拟器WebSocket ==========
@app.websocket("/ws/terminal")
async def terminal_websocket(websocket: WebSocket):
    await websocket.accept()
    process = None
    try:
        # 启动bash shell，工作目录为用户主目录
        process = await asyncio.create_subprocess_shell(
            "bash",
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            cwd=USER_HOME,
            env=os.environ.copy()
        )

        # 异步读取输出并发送到前端
        async def read_output():
            while True:
                data = await process.stdout.read(1024)
                if not data:
                    break
                try:
                    await websocket.send_text(data.decode('utf-8', errors='replace'))
                except:
                    break
        
        # 启动输出读取任务
        output_task = asyncio.create_task(read_output())

        # 接收前端输入并发送到shell
        while True:
            data = await websocket.receive_text()
            if process.stdin.is_closing():
                break
            process.stdin.write(data.encode('utf-8'))
            await process.stdin.drain()

    except Exception as e:
        print(f"终端连接错误: {e}")
    finally:
        # 清理进程
        if process:
            try:
                process.terminate()
                await process.wait()
            except:
                pass
        try:
            await websocket.close()
        except:
            pass

# ========== 健康检查 ==========
@app.get("/api/health")
async def health_check():
    return {"status": "ok", "version": "1.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=5555, reload=True)

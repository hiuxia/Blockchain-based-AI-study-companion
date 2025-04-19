# backend/app/services/task_manager.py
import threading
from typing import Optional, Dict

_lock = threading.Lock()
_tasks: Dict[str, dict] = {}

def create_task() -> str:
    import uuid
    task_id = str(uuid.uuid4())
    with _lock:
        _tasks[task_id] = {"status": "pending", "result": None, "error": None}
    return task_id

def update_task(task_id: str, status: str, result: Optional[dict] = None, error: Optional[str] = None):
    with _lock:
        if task_id in _tasks:
            _tasks[task_id].update({"status": status, "result": result, "error": error})
        else:
            _tasks[task_id] = {"status": status, "result": result, "error": error}

def get_task(task_id: str) -> Optional[dict]:
    with _lock:
        return _tasks.get(task_id)

# backend/app/core/cors.py
from fastapi.middleware.cors import CORSMiddleware

def add_cors(app):
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # 开发阶段允许所有跨域请求，生产环境建议限制具体来源
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    return app

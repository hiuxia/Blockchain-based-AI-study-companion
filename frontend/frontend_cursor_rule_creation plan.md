I have now learnt to use the advanced agent programming tool - cursor. The research doc is a research about how to use its feature named cursor rules. It's a good convention to create the a project-specific project rule set. 

<TASK>: HLEP ME CREATE A PROJECT-SPECIFIC CURSOR RULE SET FOR THIS PROJECT BASED ON THE RESEARCH DOC and PROVIDED API DOCUMENTATION, FRONTEND IMPLEMENTATION PLAN AND BACKEND STRUCTURE.</TASK>


## UI/UX design
The UI/UX design is shown in the image.

## Frontend implementation plan

1. Break down the UI/UX design into smaller components. The components is implemented, based on the project's context, using nextjs and tailwindcss and typescript.
2. Implement a static version of the frontend
3. Add basic interactivity to the frontend. Adapt the state management library zustand.
4. Set up the mock API based on the content in the API document section.
5. Implement the frontend interaction with the mock API.


## API document

```md
### 1. 上传PDF文件

- **端点**: `POST /sources/upload`

- **请求格式**: `multipart/form-data`

- **请求头**:  

  ```http
  Content-Type: multipart/form-data
  参数:
  ```

files: PDF文件列表（支持多文件）

成功响应 (200):

["3fa85f64-5717-4562-b3fc-2c963f66afa6", "4fb86f75-6828-5673-c4gd-3d974g77bgf7"]

错误响应:

413: 文件大小超过50MB限制

400: 非PDF文件类型

500: 服务器内部错误

### 2. 获取已上传文件列表

端点: GET /sources

查询参数:

skip: 跳过的记录数（默认0）

limit: 返回的最大记录数（默认100）

成功响应 (200):


[
  {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "filename": "document.pdf",
    "content_type": "application/pdf",
    "created_at": "2023-10-01T12:34:56Z"
  }
]

### 3. 删除文件

端点: DELETE /sources/{source_id}

路径参数:

source_id: 文件ID

成功响应 (200):

{"message": "Source deleted"}

错误响应:

404: 文件不存在

500: 删除失败

处理任务

### 4. 启动思维导图生成任务

端点: POST /process

请求体:


{
  "source_ids": ["3fa85f64-5717-4562-b3fc-2c963f66afa6"],
  "llm_model": "gemini-flash"
}

成功响应 (202 Accepted):


{"task_id": "550e8400-e29b-41d4-a716-446655440000"}

错误响应:

404: 文件ID不存在

500: 任务创建失败


### 5. 查询任务状态

端点: GET /process/results/{task_id}

路径参数:

task_id: 任务ID

成功响应 (200):


{
  "task_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "result": {
    "markdown": "# 思维导图内容...",
    "summary_id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
    "created_at": "2023-10-01T12:35:00Z"
  }
}

status可能值: pending, processing, completed, failed

错误响应:

404: 任务不存在



思维导图结果

### 6. 获取生成的Markdown内容

端点: GET /summaries/{summary_id}

路径参数:

summary_id: 思维导图记录ID（需从任务结果中获取）

成功响应 (200):


{
  "id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  "source_ids": ["3fa85f64-5717-4562-b3fc-2c963f66afa6"],
  "markdown": "# 思维导图内容...",
  "created_at": "2023-10-01T12:35:00Z"
}

错误响应:

404: 记录不存在

使用流程示例

上传文件:

curl -X POST -F "files=@document1.pdf" -F "files=@document2.pdf" http://localhost:8000/api/sources/upload

启动处理任务:

curl -X POST -H "Content-Type: application/json" -d '{
  "source_ids": ["3fa85f64-5717-4562-b3fc-2c963f66afa6"],
  "llm_model": "gemini-flash"
}' http://localhost:8000/api/process

轮询任务状态:

curl http://localhost:8000/api/process/results/550e8400-e29b-41d4-a716-446655440000

获取结果:

curl http://localhost:8000/api/summaries/6ba7b810-9dad-11d1-80b4-00c04fd430c8

注意事项

文件限制：

仅支持PDF文件

单文件最大50MB

异步任务：

提交任务后需通过task_id轮询结果

建议轮询间隔≥2秒

错误处理：

遵循HTTP状态码（如404、500）

错误详情见响应体中的error字段
```
## Backend structure 

```md
backend/
├── app/
│   ├── api/                  # API路由层
│   │   ├── process.py        - 文档处理任务接口（启动/查询任务）
│   │   └── sources.py        - 文件上传/管理接口（上传/列表/删除）
│   ├── core/                 # 核心配置与基础设施
│   │   ├── config.py         - 应用配置（数据库/文件存储/API密钥）
│   │   ├── database.py       - 数据库引擎与会话管理
│   │   └── cors.py           - CORS跨域中间件配置
│   ├── crud/                 # 数据库操作层
│   │   ├── source.py         - 文件来源的CRUD操作
│   │   └── summary.py        - 摘要记录的CRUD操作
│   ├── models/               # 数据模型与接口协议
│   │   ├── schemas.py        - Pydantic数据验证模型
│   │   ├── source.py         - 文件来源的SQLAlchemy模型
│   │   └── summary.py        - 摘要记录的SQLAlchemy模型
│   ├── langchain_agent/      # LangChain集成模块
│   │   ├── agent.py          - 文档处理主流程（加载/LLM调用）
│   │   ├── llm_config.py     - LLM模型实例化配置
│   │   ├── memory.py         - 对话记忆管理（缓冲/摘要模式）
│   │   ├── prompts.py        - 结构化摘要生成提示模板
│   │   └── tools.py          - PDF文档加载与分块工具
│   ├── services/             # 服务层组件
│   │   ├── file_storage.py   - 文件存储服务（保存/路径获取/删除）
│   │   └── task_manager.py   - 异步任务状态管理（创建/更新/查询）
│   └── main.py               - FastAPI应用入口与路由聚合
├── uploaded_sources/         # 文件存储目录（自动创建）
├── documents.db              # SQLite数据库文件（自动生成）
├── .env                      # 环境变量文件（API密钥等）
└── requirements.txt          # Python依赖清单
```


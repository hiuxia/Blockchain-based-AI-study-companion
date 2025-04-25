# 一、基础信息

- 服务启动端口：8000  
- 基础 URL：  
  `http://localhost:8000`

---

## 二、健康检查

### GET /health

- **URL**  
  `http://localhost:8000/health`

- **用途**  
  检查后端服务是否正常运行。

- **请求参数**  
  无

- **响应示例**

  ```json
  {
    "status": "healthy"
  }
  ```

- **HTTP 状态码**  
  200 OK

---

## 三、文件管理（Sources）

所有文件管理接口均以 `/sources` 前缀。

### 3.1 上传 PDF 文件

- **POST /sources**
- **URL**  
  `http://localhost:8000/sources`
- **用途**  
  上传单个 PDF 文件，保存到服务器，并在数据库中生成记录。
  如文件名与已有文件重复，系统会自动重命名文件。

- **请求 Header**  
  `Content-Type: multipart/form-data`

- **请求 Body (form-data)**

| 字段名 | 必填 | 类型 | 描述 |
|--------|------|------|------|
| file   | 是   | file | 待上传的 PDF 文件 |

- **成功响应**

  - 状态码：200 OK
  - Body：

    ```json
    {
      "id": "e8f5c5a2-1a2b-4d3e-9f0a-1234567890ab",
      "filename": "example.pdf",
      "content_type": "application/pdf"
    }
    ```

- **示例 (curl.exe)**

  ```
  curl.exe -X POST "http://localhost:8000/sources" `
    -F "file=@C:/path/to/example.pdf"
  ```

---

### 3.2 查询所有已上传文件

- **GET /sources**
- **URL**  
  `http://localhost:8000/sources`
- **用途**  
  获取所有上传文件的元数据列表。

- **请求参数**  
  无

- **成功响应**

  - 状态码：200 OK
  - Body (示例)：

    ```json
    [
      {
        "id": "e8f5c5a2-1a2b-4d3e-9f0a-1234567890ab",
        "filename": "example.pdf",
        "content_type": "application/pdf"
      },
      {
        "id": "a1b2c3d4-5e6f-7a8b-9c0d-1234567890ef",
        "filename": "report.pdf",
        "content_type": "application/pdf"
      }
    ]
    ```

---

### 3.3 查询单个文件元数据

- **GET /sources/{source_id}**
- **URL**  
  `http://localhost:8000/sources/{source_id}`

- **路径参数**

| 参数名    | 必填 | 类型   | 描述           |
|-----------|------|--------|----------------|
| source_id | 是   | string | 文件记录的唯一ID |

- **成功响应**

  - 状态码：200 OK
  - Body (示例)：

    ```json
    {
      "id": "e8f5c5a2-1a2b-4d3e-9f0a-1234567890ab",
      "filename": "example.pdf",
      "content_type": "application/pdf"
    }
    ```

- **404 响应**

  ```json
  {
    "detail": "Source not found"
  }
  ```

### 3.4 删除文件

- **DELETE /sources/{source_id}**
- **URL**  
  `http://localhost:8000/sources/{source_id}`
- **用途**  
  删除指定ID的文件及其数据库记录。

- **路径参数**

| 参数名    | 必填 | 类型   | 描述           |
|-----------|------|--------|----------------|
| source_id | 是   | string | 文件记录的唯一ID |

- **成功响应**

  - 状态码：204 No Content
  - Body：无

- **错误响应**

  - 状态码：404 Not Found
  - Body：
    ```json
    {
      "detail": "Source not found"
    }
    ```

### 3.5 重命名文件

- **PATCH /sources/{source_id}**
- **URL**  
  `http://localhost:8000/sources/{source_id}`
- **用途**  
  重命名指定ID的文件。如新文件名与已有文件重复，系统会自动调整文件名。

- **路径参数**

| 参数名    | 必填 | 类型   | 描述           |
|-----------|------|--------|----------------|
| source_id | 是   | string | 文件记录的唯一ID |

- **请求 Body (JSON)**

  ```json
  {
    "filename": "new_filename.pdf"
  }
  ```

- **成功响应**

  - 状态码：200 OK
  - Body：
    ```json
    {
      "id": "e8f5c5a2-1a2b-4d3e-9f0a-1234567890ab",
      "filename": "new_filename.pdf",
      "content_type": "application/pdf"
    }
    ```

- **错误响应**

  - 状态码：404 Not Found
  - Body：
    ```json
    {
      "detail": "Source not found"
    }
    ```

---

## 四、文档处理任务（Processing）

所有处理任务接口均以 `/process` 前缀。返回 Markdown 摘要并存入数据库。

### 4.1 提交处理任务

- **POST /process**
- **URL**  
  `http://localhost:8000/process`
- **用途**  
  启动后台任务：读取指定 PDF，拆分文本并调用 LLM 生成 Markdown 摘要，保存摘要并记录任务状态。

- **请求 Header**  
  `Content-Type: application/json`

- **请求 Body (JSON)**

  ```json
  {
    "source_ids": [
      "e8f5c5a2-1a2b-4d3e-9f0a-1234567890ab"
    ],
    "llm_model": "gemini-flash"
  }
  ```

| 字段名     | 必填 | 类型         | 描述                                 |
|------------|------|--------------|--------------------------------------|
| source_ids | 是   | string array | 已上传文件的 id 列表                 |
| llm_model  | 是   | string       | 要使用的 LLM 模型（如 "gemini-flash" 或 "llama-scout"） |

- **成功响应**

  - 状态码：202 Accepted
  - Body：

    ```json
    {
      "task_id": "5d3b8fed-9c4a-4e2d-8f1b-234567890abc"
    }
    ```

- **示例 (curl.exe)**

  ```
  curl.exe -X POST "http://localhost:8000/process" `
    -H "Content-Type: application/json" `
    -d "{\"source_ids\":[\"e8f5c5a2-1a2b-4d3e-9f0a-1234567890ab\"],\"llm_model\":\"gemini-flash\"}"
  ```

---

### 4.2 查询任务结果

- **GET /process/results/{task_id}**
- **URL**  
  `http://localhost:8000/process/results/{task_id}`
- **用途**  
  根据 task_id 查询处理任务的当前状态与结果。

- **路径参数**

| 参数名 | 必填 | 类型   | 描述         |
|--------|------|--------|--------------|
| task_id| 是   | string | 任务的唯一ID |

- **成功响应**

  - 状态码：200 OK
  - Body：

    ```json
    {
      "task_id": "5d3b8fed-9c4a-4e2d-8f1b-234567890abc",
      "status": "completed",
      "result": {
        "markdown": "# 文档摘要标题\n- 要点1\n- 要点2",
        "summary_id": "a1b2c3d4-5e6f-7a8b-9c0d-1234567890ef",
        "created_at": "2025-04-16T10:00:00.000000"
      },
      "error": null
    }
    ```

| 字段      | 类型           | 描述                         |
|-----------|----------------|------------------------------|
| task_id   | string         | 任务ID                       |
| status    | string         | 任务状态：pending/processing/completed/failed |
| result    | object/null    | 任务完成时的结果；如果失败则为 null |
| markdown  | string         | 生成的 Markdown 摘要         |
| summary_id| string         | 对应摘要记录ID               |
| created_at| string (ISO)   | 摘要生成时间                 |
| error     | string/null    | 失败时的错误消息，否则为 null |

- **示例 (curl.exe)**

  ```
  curl.exe "http://localhost:8000/process/results/5d3b8fed-9c4a-4e2d-8f1b-234567890abc"
  ```

---

## 五、对话历史管理（History）

所有会话历史接口均以 `/history` 前缀。

### 5.1 保存对话历史

- **POST /history**
- **URL**  
  `http://localhost:8000/history`
- **用途**  
  将用户与 LLM 的完整对话文本保存为历史记录。

- **请求 Header**  
  `Content-Type: application/json`

- **请求 Body (JSON)**

  ```json
  {
    "conversation": "用户: 你好\nLLM: 你好，有什么可以帮您？\n用户: 介绍一下文档摘要功能\nLLM: …"
  }
  ```

- **成功响应**

  - 状态码：200 OK
  - Body：

    ```json
    {
      "id": "f1e2d3c4-b5a6-7890-1234-56789abcdef0",
      "conversation": "用户: 你好\nLLM: 你好，有什么可以帮您？\n…",
      "created_at": "2025-04-16T10:05:00.000000"
    }
    ```

- **示例 (Invoke-RestMethod)**

  ```
  $body = @{ conversation = "用户: 你好`nLLM: 你好，有什么可以帮您？" } | ConvertTo-Json
  Invoke-RestMethod -Uri "http://localhost:8000/history" -Method Post -ContentType "application/json" -Body $body
  ```

---

### 5.2 查询所有历史记录

- **GET /history**
- **URL**  
  `http://localhost:8000/history`
- **用途**  
  获取所有已保存的对话历史记录列表。

- **成功响应**

  - 状态码：200 OK
  - Body (示例)：

    ```json
    [
      {
        "id": "f1e2d3c4-b5a6-7890-1234-56789abcdef0",
        "conversation": "用户: 你好\nLLM: 你好，有什么可以帮您？",
        "created_at": "2025-04-16T10:05:00.000000"
      },
      {
        "id": "0a1b2c3d-4e5f-6789-0123-456789abcdef",
        "conversation": "…第二条对话历史…",
        "created_at": "2025-04-16T11:00:00.000000"
      }
    ]
    ```

- **示例 (curl.exe)**

  ```
  curl.exe "http://localhost:8000/history"
  ```

---

### 5.3 查询指定历史记录

- **GET /history/{history_id}**
- **URL**  
  `http://localhost:8000/history/{history_id}`

- **用途**  
  根据 id 获取一条对话历史的详细内容。

- **路径参数**

| 参数名     | 类型   | 描述             |
|------------|--------|------------------|
| history_id | string | 历史记录的唯一ID |

- **成功响应**

  - 状态码：200 OK
  - Body (示例)：

    ```json
    {
      "id": "f1e2d3c4-b5a6-7890-1234-56789abcdef0",
      "conversation": "用户: 你好\nLLM: 你好，有什么可以帮您？",
      "created_at": "2025-04-16T10:05:00.000000"
    }
    ```

- **404 响应**

  ```json
  {
    "detail": "History not found"
  }
  ```

- **示例 (curl.exe)**

  ```
  curl.exe "http://localhost:8000/history/f1e2d3c4-b5a6-7890-1234-56789abcdef0"
  ```

---

## 六、摘要管理 (Summaries)

所有摘要管理接口均以 `/summaries` 前缀。

### 6.1 获取所有摘要

- **GET /summaries**
- **URL**  
  `http://localhost:8000/summaries`
- **用途**  
  获取所有摘要，可选择只返回已命名的摘要。

- **查询参数**

| 参数名     | 必填  | 类型    | 描述                             |
|------------|-------|---------|----------------------------------|
| named_only | 否    | boolean | 如果为true，只返回有名称的摘要   |

- **成功响应**

  - 状态码：200 OK
  - Body (示例)：

    ```json
    [
      {
        "id": "a1b2c3d4-5e6f-7a8b-9c0d-1234567890ef",
        "name": "重要文献摘要",
        "source_ids": ["e8f5c5a2-1a2b-4d3e-9f0a-1234567890ab"],
        "markdown": "# 文档摘要\n- 主要内容...",
        "vector_index_path": "/path/to/index/123.idx",
        "created_at": "2025-04-16T10:00:00.000000"
      }
    ]
    ```

### 6.2 获取指定摘要

- **GET /summaries/{summary_id}**
- **URL**  
  `http://localhost:8000/summaries/{summary_id}`
- **用途**  
  获取指定ID的摘要详细信息。

- **路径参数**

| 参数名     | 必填 | 类型   | 描述           |
|------------|------|--------|----------------|
| summary_id | 是   | string | 摘要的唯一ID    |

- **成功响应**

  - 状态码：200 OK
  - Body (示例)：

    ```json
    {
      "id": "a1b2c3d4-5e6f-7a8b-9c0d-1234567890ef",
      "name": "重要文献摘要",
      "source_ids": ["e8f5c5a2-1a2b-4d3e-9f0a-1234567890ab"],
      "markdown": "# 文档摘要\n- 主要内容...",
      "vector_index_path": "/path/to/index/123.idx",
      "created_at": "2025-04-16T10:00:00.000000"
    }
    ```

- **错误响应**

  - 状态码：404 Not Found
  - Body：
    ```json
    {
      "detail": "Summary not found"
    }
    ```

### 6.3 更新摘要名称

- **PATCH /summaries/{summary_id}**
- **URL**  
  `http://localhost:8000/summaries/{summary_id}`
- **用途**  
  为摘要添加或更新名称。

- **路径参数**

| 参数名     | 必填 | 类型   | 描述          |
|------------|------|--------|---------------|
| summary_id | 是   | string | 摘要的唯一ID   |

- **请求 Body (JSON)**

  ```json
  {
    "name": "重要文献摘要"
  }
  ```

- **成功响应**

  - 状态码：200 OK
  - Body：更新后的完整摘要对象

- **错误响应**

  - 状态码：404 Not Found
  - Body：
    ```json
    {
      "detail": "Summary not found"
    }
    ```

### 6.4 删除摘要

- **DELETE /summaries/{summary_id}**
- **URL**  
  `http://localhost:8000/summaries/{summary_id}`
- **用途**  
  删除指定ID的摘要记录。

- **路径参数**

| 参数名     | 必填 | 类型   | 描述           |
|------------|------|--------|----------------|
| summary_id | 是   | string | 摘要的唯一ID    |

- **成功响应**

  - 状态码：204 No Content
  - Body：无

- **错误响应**

  - 状态码：404 Not Found
  - Body：
    ```json
    {
      "detail": "Summary not found"
    }
    ```

---

## 七、笔记管理 (Notes)

所有笔记管理接口均以 `/notes` 前缀。

### 7.1 创建笔记

- **POST /notes**
- **URL**  
  `http://localhost:8000/notes`
- **用途**  
  创建一个新的笔记。

- **请求 Header**  
  `Content-Type: application/json`

- **请求 Body (JSON)**

  ```json
  {
    "name": "我的学习笔记",
    "content": "# 学习笔记\n- 重要内容...",
    "content_type": "text/markdown",
    "source_summary_id": "a1b2c3d4-5e6f-7a8b-9c0d-1234567890ef"
  }
  ```

| 字段名           | 必填 | 类型   | 描述                                    |
|------------------|------|--------|----------------------------------------|
| name             | 是   | string | 笔记名称                               |
| content          | 是   | string | 笔记内容                               |
| content_type     | 否   | string | 内容类型，默认为 "text/markdown"       |
| source_summary_id| 否   | string | 关联的源文件或摘要ID                   |

- **成功响应**

  - 状态码：201 Created
  - Body：创建的笔记对象

### 7.2 获取所有笔记

- **GET /notes**
- **URL**  
  `http://localhost:8000/notes`
- **用途**  
  获取所有笔记，可选择按关联的源文件/摘要ID过滤。

- **查询参数**

| 参数名            | 必填 | 类型   | 描述                    |
|-------------------|------|--------|-------------------------|
| source_summary_id | 否   | string | 关联的源文件或摘要ID    |

- **成功响应**

  - 状态码：200 OK
  - Body：笔记对象数组

### 7.3 获取指定笔记

- **GET /notes/{note_id}**
- **URL**  
  `http://localhost:8000/notes/{note_id}`
- **用途**  
  获取指定ID的笔记详细信息。

- **路径参数**

| 参数名  | 必填 | 类型   | 描述         |
|---------|------|--------|--------------|
| note_id | 是   | string | 笔记的唯一ID  |

- **成功响应**

  - 状态码：200 OK
  - Body：笔记对象

- **错误响应**

  - 状态码：404 Not Found
  - Body：
    ```json
    {
      "detail": "Note not found"
    }
    ```

### 7.4 更新笔记

- **PATCH /notes/{note_id}**
- **URL**  
  `http://localhost:8000/notes/{note_id}`
- **用途**  
  更新指定ID的笔记内容或名称。

- **路径参数**

| 参数名  | 必填 | 类型   | 描述         |
|---------|------|--------|--------------|
| note_id | 是   | string | 笔记的唯一ID  |

- **请求 Body (JSON)**

  ```json
  {
    "name": "更新后的笔记名称",
    "content": "# 更新后的内容"
  }
  ```

| 字段名   | 必填 | 类型   | 描述           |
|----------|------|--------|----------------|
| name     | 否   | string | 更新后的笔记名称 |
| content  | 否   | string | 更新后的笔记内容 |

- **成功响应**

  - 状态码：200 OK
  - Body：更新后的笔记对象

- **错误响应**

  - 状态码：404 Not Found
  - Body：
    ```json
    {
      "detail": "Note not found"
    }
    ```

### 7.5 删除笔记

- **DELETE /notes/{note_id}**
- **URL**  
  `http://localhost:8000/notes/{note_id}`
- **用途**  
  删除指定ID的笔记。

- **路径参数**

| 参数名  | 必填 | 类型   | 描述         |
|---------|------|--------|--------------|
| note_id | 是   | string | 笔记的唯一ID  |

- **成功响应**

  - 状态码：204 No Content
  - Body：无

- **错误响应**

  - 状态码：404 Not Found
  - Body：
    ```json
    {
      "detail": "Note not found"
    }
    ```

---

## 八、错误响应示例（通用）

- **400 Bad Request**：请求体缺少字段或 JSON 格式错误

  ```json
  {
    "detail": [
      {
        "loc": ["body","source_ids"],
        "msg": "field required",
        "type": "value_error.missing"
      }
    ]
  }
  ```

- **404 Not Found**：指定的资源不存在

  ```json
  {
    "detail": "Resource not found"
  }
  ```

- **500 Internal Server Error**：后端处理异常

  ```json
  {
    "detail": "Unexpected error message..."
  }
  ```

---

## 说明

- 前端请将所有请求都指向 `http://localhost:8000`，并使用示例中对应的 HTTP 方法、URL 路径、Header 与 Body。
- 对于需要提供 ID 的接口，请使用实际由后端返回的 UUID。
- 接口均支持 CORS，前端可跨域调用。
- 推荐在开发阶段使用 `--reload` 模式启动服务，以实时加载代码改动：

  ```
  uvicorn app.main:app --reload
  ```

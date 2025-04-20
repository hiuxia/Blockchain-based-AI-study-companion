# 前端修改建议

## 1. 主界面

### 1.1 左侧边栏显示文件（功能暂时不变）

具体修改建议见 section 2

### 1.2 chat界面 和 思维导图笔记布局改动

思维导图和 chat 界面同时只应该显示一个，通过 tab 切换。

- chat 界面改动建议见 section 3

  - chat 界面所在 panel 应分为两部分。
    - 1. chat QA subtab
      2. 笔记保存 subtab

- 思维导图修改建议见 section 4

  - 思维导图的 生成按钮 应该放在思维导图 (markdown/思维导图切换界面 panel) 的上方
    - ![image-20250420150002743](/Users/wanghaonan/WebstormProjects/np_project/assets/image-20250420150002743.png)
  - 在右侧添加一个新的 panel （可收缩）用来保存已经生成的笔记。

  - 生成的笔记需要自动保存到右侧边栏

     
### 1.3 高度，scrollbar 设置

- 左侧边栏，右侧可切换 panel 必须保证固定的高度，不能随着内容的添加而收缩。
- 可以添加竖向的 scrollbar, 横向需要分情况讨论
  - 左侧边栏横向不可以有 scollbar, 如果名称过长，需要使用 … 符号去缩短名称。！必须保证 select box 不被遮挡
  - chat 界面可以添加 scrollbar
  - 思维导图界面
    - 切换的 markdown 界面可以添加 横向的 scrollbar
    - mindmap 则完全通过拖移 移动。


### 1.4 图标设计

### 1.4.1 左侧边栏文件图标应改为 pdf icon

![image-20250420152329726](/Users/wanghaonan/WebstormProjects/np_project/assets/image-20250420152329726.png)

> 目前的图标容易和右侧混淆

### 1.4.2 移除重复文件处理方式选项

移除最顶层对 duplication file 处理方式的选项，直接按照 section 2 提供的方式处理。

## 2. 左侧导航栏

### 2.1 如果名称过长

名称如果过长, 使用 …缩略显示。

![image-20250420142805100](/Users/wanghaonan/WebstormProjects/np_project/assets/image-20250420142805100.png)

### 2.2 上传重复文件需要重命名

比如上传文件 “文件 1”，第二次上传他应该被命名为 “文件 1(1)”。

### 2.3 添加一个可收缩按钮

![image-20250420143453827](/Users/wanghaonan/WebstormProjects/np_project/assets/image-20250420143453827.png)

为左右边栏添加一个可收缩按钮并实现对应功能。

## 3. chat 界面

### 3.1 chatQA tab

- 每一轮对话下面都应该添加一个保存按钮，同时右侧的已保存笔记界面应实时显示保存动画，同时允许用户为每一个保存的笔记添加自定义名称。
- chat 的内容应该会当前左侧边栏所选择的内容。
- chat 界面可以随着右侧 保存界面的缩小而扩大，但本身不可以缩小。

### 3.2 保存笔记界面

- 当保存笔记和后台交互时，添加延时动画
- 允许用户自定义名称，同时更新后台数据库状态。



## 4. mindmap 显示

后端使用 markmap library 去显示思维导图和 markdown note

https://markmap.js.org/docs/markmap

后端需要更新生成的 markdown 形式。


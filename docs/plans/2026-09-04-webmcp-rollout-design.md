# Concitech 全项目 WebMCP 接入设计

日期：2026-09-04

## 目标与边界

为当前目录下五个公开网站增加 Chrome WebMCP 命令式工具，让浏览器智能体能够发现并调用网站已有能力。采用已确认的方案 1：每个项目只公开一个职责明确的工具；Tweet Craft 只覆盖官网，不改扩展弹窗；X Video Downloader 只启动页面现有解析并展示结果，不自动保存文件。

所有实现使用 `document.modelContext`、JSON Schema 输入、`AbortController` 生命周期和能力检测。未支持 WebMCP 的浏览器直接跳过注册，不影响原页面。工具不向跨源页面公开，说明、参数名和返回内容遵守 Chrome 建议的字符预算。

## 工具清单

| 项目 | 工具 | 行为 |
| --- | --- | --- |
| Concitech | `find_concitech_content` | 检索项目、开发笔记和站点页面 |
| Concitech AI Daily | `find_ai_content` | 按语言、内容类型和关键词检索日报与文章 |
| Blog | `find_blog_posts` | 检索构建期生成的可索引文章目录 |
| Tweet Craft 官网 | `find_tweet_craft_help` | 检索功能、安装入口和 Notion 指南 |
| X Video Downloader | `prepare_x_media` | 校验帖子链接、填入可见输入框并启动现有解析 |

## 内容与执行设计

静态内容站优先复用现有内容源。Concitech 和 Tweet Craft 从同源公开页面提取卡片或标题；AI Daily 和 Blog 在构建期生成 JSON 索引，避免把全部正文塞进工具定义。检索工具最多返回五到六条精简结果，并在序列化后控制在 1,500 字符以内。

`prepare_x_media` 是唯一会改变页面状态的工具，标记为非只读和包含不受信任内容。它复用 Hero 组件的输入框与 `onDownload` 回调，因此人工按钮和 WebMCP 走同一套 URL 校验与解析路径；下载选择仍留在可见页面中。

## 安全与上线

- 只使用同源公开内容，不读取账户、剪贴板、Cookie 或私有数据。
- 对类型、枚举、长度、结果数量和 X 状态链接进行代码级校验。
- 只读检索工具使用 `readOnlyHint: true`；外部或用户输入使用相应的 `untrustedContentHint`。
- 不设置 `exposedTo`，避免跨源页面直接发现工具。
- 生产启用需要为实际域名配置 Chrome WebMCP Origin Trial token；仓库不提交虚构或共享 token。

## 验证

每个仓库提供或扩展专项检查，确认工具名、注册入口、页面覆盖和关键安全约束。随后运行各项目现有站点检查和生产构建。浏览器端验收需在启用 WebMCP Origin Trial 或实验标志的 Chrome 中，通过 `document.modelContext.getTools()` 检查工具，并分别执行一次合法输入与一次非法输入。

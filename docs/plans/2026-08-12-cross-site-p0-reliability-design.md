# Concitech 跨站 P0 修复设计

日期：2026-08-12

## 目标

优先修复会影响内容正确性、搜索收录、自动发布安全性和 AdSense 风险边界的问题。视觉重构、搜索功能和一般性能优化不在本轮范围。

## AI 日报

- 将 PT 归属日期视为 `YYYY-MM-DD` 日历值，不再经过 UTC `Date` 转换，保证路由、首页、归档和文章可见日期一致。
- 对同一日期只计算一次主题分类，中文与英文复用同一组分类；验证器强制双语分类一致。
- 发布前先确认源目录存在完整、非空的 `daily.md` 与 `daily.en.md`，再以临时文件导入并原子替换内容对，禁止孤立中文稿进入内容树。
- 文章页只保留一个 H1，并输出 `NewsArticle` JSON-LD、发布日期、作者、语言、图片与 publisher 信息；首页输出 `WebSite`/`Organization`。
- Hermes `ai-list` 使用无模型、确定性 Cron 在北京时间 13:00–15:00 尝试发布；遇到双语缺失、脏工作树或无法 fast-forward 时停止，不强推。

## 收录基础

- Tweet Craft 提供真实的 `robots.txt`、`sitemap.xml` 与 canonical，不再让缺失路径回退到首页 HTML。
- Blog 增加 sitemap 生成能力，并在 robots 中声明 sitemap。
- X Video Downloader 增加 description、canonical、Open Graph、Twitter Card、`WebApplication` JSON-LD、robots 与 sitemap。
- Concitech 主站增加 `WebSite`/`Person` JSON-LD 和分享图片元数据。

## AdSense 边界

采用方案 A：保留主站首页的 X Video Downloader 项目卡，但移除主站首页 AdSense 脚本。AI 日报与博客的广告配置不变；主站保留 `ads.txt`，便于未来在合规页面恢复投放。

## 验证

- AI 日报构建、类型检查、内容校验、smoke test 全部通过。
- 测试路由日期与可见日期一致、双语分类一致、缺少英文源时不会写入任何目标文件。
- 静态站点的 robots、sitemap、canonical、JSON-LD 可被解析。
- Tweet Craft 扩展构建与 Blog Hexo 构建通过。
- Hermes Cron 可列出且脚本重复运行返回幂等状态。

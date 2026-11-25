# LightX2V Website

LightX2V 开源社区网站，包含中英文首页、模型案例、开源生态与提交历史。

网站地址：https://light-ai.top/LightX2V-Website/

## 本地开发

需要 Node.js 22+ 和 Python 3，无需安装第三方依赖。

```sh
npm run dev
```

打开 http://localhost:4173/LightX2V-Website/ 。编辑 `public/` 中的 HTML、CSS、JavaScript 或素材后，重新执行 `npm run build`。

## 检查与部署

```sh
npm run build
npm run check
```

推送到 `main` 后，`.github/workflows/pages.yml` 自动构建、验证并部署 GitHub Pages。仓库 Settings → Pages 的 Source 使用 **GitHub Actions**。

构建脚本将根路径资源适配到 `/LightX2V-Website/`，包含视频、语言切换和历史页。`dist/` 是发布输出，`_site/` 用于本地模拟最终域名下的子目录，两者不提交。

本站作为 ModelTC 的项目站点继承组织 Pages 的 `light-ai.top` 域名，不添加指向域名根目录的 CNAME，避免影响其他项目站点。

## 页面

- `/LightX2V-Website/`：中文首页
- `/LightX2V-Website/en/`：英文首页
- `/LightX2V-Website/sparks.html`：提交历史
- `/LightX2V-Website/en/sparks.html`：英文提交历史

初始内容来自当前网页的已发布版本；该仓库不包含原托管服务的凭据和配置。

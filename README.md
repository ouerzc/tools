# DevKit Hub

纯前端开发工具聚合平台，可直接用浏览器打开 `index.html`，也可部署到 GitHub Pages。

## 工具

- JSON Diff：按稳定字段路径比较新增、删除和变更。
- JSON 格式化：格式化、压缩 JSON，并暴露非法输入状态。
- 时间戳转换：Unix 秒/毫秒、日期时间和常用时区互转。

## 本地打开

直接打开 `index.html`，或启动静态服务：

```bash
python3 -m http.server 4175 --bind 127.0.0.1
```

## GitHub Pages

仓库包含 `.github/workflows/pages.yml`，推送到 `main` 后会把仓库根目录作为静态站点发布。

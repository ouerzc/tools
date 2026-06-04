# DevKit Hub

Vue 3 + Vite 构建的纯前端开发工具聚合平台。工具逻辑在浏览器本地运行，不依赖后端服务。

## 工具

- JSON Diff：按稳定字段路径比较新增、删除和变更。
- JSON 格式化：格式化、压缩 JSON，并暴露非法输入状态。
- 时间戳转换：Unix 秒/毫秒、日期时间和常用时区互转。

## 本地打开

安装依赖后启动开发服务：

```bash
npm install
npm run dev
```

构建和验证：

```bash
npm run test
npm run build
```

## GitHub Pages

仓库包含 `.github/workflows/pages.yml`，推送到 `main` 后会执行测试与 Vite 构建，并发布 `dist/`。

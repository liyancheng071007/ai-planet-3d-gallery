# AI星球 · 三维藏品馆

独立的三维模型展示站。原闯关游戏：[AI星球](https://liyancheng071007.github.io/AI-planet/)。

**[在线查看三维藏品馆](https://liyancheng071007.github.io/ai-planet-3d-gallery/)** · [模型文件目录](public/models/) · [五轮优化记录](docs/POLISH_LOG.md)

13件原创参数化模型：1种统一算力币、8种不同轮廓与功能符号的核心芯片、4种不同形态的优质数据。点击藏品即可旋转、缩放、查看线框、分层展开、下载GLB与STL。可使用前后藏品按钮、固定视角、全屏及分享深链接；键盘方向键旋转，加减键缩放，Home复位。

## 运行

需要Node.js 22或更新版本。

```sh
npm ci
npm run build
npm run dev
```

打开 http://127.0.0.1:4174 。所有运行资源均由本站提供，不依赖CDN。

## 模型文件

- GLB：保存网格、层级与材质，遵循glTF米制单位，1模型单位导出为0.02米。
- STL：仅保存三角网格，导出约定1模型单位=20毫米，导入软件时选择毫米。
- 模型为展示与二次建模参考；由多个独立闭合或相交组件构成，未执行实体布尔并集、壁厚检查或切片。打印前需在CAD/切片软件检查、合并和修复，不宣称开箱即印。
- 展台尺寸由未旋转、未展开模型的包围盒计算，保留一位小数，不作为制造公差。
- `public/models/` 保存13件模型的GLB/STL共26个文件，`manifest.json` 记录尺寸、组件数与文件大小。浏览器动态导出同样的装配模型，不会把线框或展开状态写进文件。

## 检查与部署

`npm test` 验证目录、网格、STL及展开复原。`npm run build` 生成独立站点，只复制实际使用的Three.js扩展。GitHub Actions在检查通过后发布Pages。

可选浏览器验证需安装Playwright并拥有Microsoft Edge：

```sh
npm install --no-save --package-lock=false playwright
node scripts/browser-check.mjs
node scripts/fallback-check.mjs
node scripts/export-check.mjs
```

先运行本地服务。最后一个脚本会重新导出全部模型，解析GLB和STL并比对尺寸。`scripts/previews.mjs` 重新生成真实模型预览图。修改模型后应更新预览与文件，再构建。

已验证桌面Edge、360/390/768/1024/1440宽度、无WebGL降级和减少动画模式；未在所有手机浏览器或真实3D打印机验证。移动端采用较低渲染分辨率；模型离屏、静止或标签隐藏时减少绘制。

微信前后端版本位于[原项目独立分支](https://github.com/liyancheng071007/AI-planet/tree/codex/wechat-backend/wechat)，此站与原网页及小程序数据库完全独立。

源码使用固定版本 Three.js（MIT许可证），参考 [官方文档](https://threejs.org/docs/)。原创造型不引用第三方角色或品牌资产。

# 📒 网申记事本（Online Application Notepad）

![CI](https://github.com/kongwenjun56-maker/online-app-notepad/actions/workflows/ci.yml/badge.svg)

一个给应届生用的**网申投递管理桌面工具**：把各家企业的网申链接、平台账号密码、投递进度和常用网申信息，集中在一个本地应用里管理。

- 🖥️ **本地优先**：所有数据只存在你自己电脑上，不联网、不上传、无账号体系
- 📦 **零依赖使用**：下载安装包即用，无需配置任何环境
- 🔄 **自动更新**：新版本发布后打开应用即会提示（仅安装版）
- 📝 **自由记事本**：网申要填的个人信息、开放问题答案，自由记录、一键复制粘贴

## ✨ 功能

| 模块 | 说明 |
|---|---|
| 📮 网申记录 | 手动录入企业名称 + 网申链接（自动补全 `https://`），一键跳转或复制链接 |
| 🔑 账号密码 | 与企业一一对应，密码默认掩码，点击眼睛看明文、⧉ 一键复制 |
| ✅ 投递状态 | 每行方框点击循环切换：待投递（空）→ 已投递（✓ 绿）→ 已终止（✗ 红） |
| 📝 网申记事本 | 多篇笔记默认折叠显示标题+内容预览，点标题展开；内容无模板自由填写，一键复制 |
| 🔍 搜索筛选 | 按企业/账号/备注搜索，按投递状态筛选，顶部实时统计 |
| 💾 备份迁移 | JSON 导出/导入，换电脑、换浏览器不丢数据 |

## 📥 下载

到 [Releases](../../releases) 页面下载**最新版本**，两种包任选：

| 资产（形如） | 适合谁 |
|---|---|
| `online-app-notepad-setup-x.y.z.exe` | 大多数人：安装版，带开始菜单/桌面快捷方式，支持自动更新 |
| `online-app-notepad-x.y.z-win.zip` | 便携版：解压即用，不写注册表，适合放 U 盘 |

> 资产名为 ASCII 是 GitHub 发布规范要求（electron-builder 自动转换），安装后应用名仍是「网申记事本」。

> ⚠️ **Windows 安全提示**：本软件未购买代码签名证书，首次运行 SmartScreen 可能拦截。
> 这是预期行为，不是异常——点击「更多信息」→「仍要运行」即可。介意者请勿使用。

> 🔒 **只从本仓库 Releases 页面下载**。任何第三方转载、重新打包的版本都不被官方认可，
> 无法保证安全性。详见 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 🔐 隐私说明

- 你的企业、链接、账号密码、笔记**全部存储在本机**（安装版在系统用户目录的 Electron 存储中，便携版在应用目录旁），源码与安装包**不包含任何用户数据**。
- 账号密码以明文存在本机——这是一键复制的代价。**不要在公用电脑上记录真实密码**。
- 导出的备份 JSON 含全部数据（明文），传输时注意安全，不要随便发群/发邮箱。
- 从旧版网页版迁移：旧版里「导出备份」→ 本应用「导入备份」，一次搞定。

## 🛠️ 自行构建

需要 Node.js 20+：

```bash
npm install
npm run dist          # 产物在 dist/：Setup exe + 便携 zip
npm start             # 开发模式直接跑（不打包，自动更新自动禁用）
```

## 📄 开源协议

[MIT](LICENSE) —— 随意用、随意改，保留版权声明即可。

## 🤝 参与改进

欢迎 PR：加功能、修 bug、改界面。流程与红线见 [CONTRIBUTING.md](CONTRIBUTING.md)。

---

# 📒 Online Application Notepad

A **local-first desktop tool for recent graduates** to manage their online job applications: company application links, platform accounts & passwords, application progress, and reusable notes — all in one offline app.

- 🖥️ **Local-first**: all data stays on your own computer. No network, no upload, no account.
- 📦 **Zero setup**: download the installer and run it. No environment configuration needed.
- 🔄 **Auto-update**: get notified when a new version is released (installer build only).
- 📝 **Free-form notepad**: jot down personal info and open-question answers, copy with one click.

## ✨ Features

| Module | Description |
|---|---|
| 📮 Application records | Add company + application link manually (`https://` auto-completed); open or copy the link with one click |
| 🔑 Accounts & passwords | Bound to each company; passwords masked by default, reveal or copy with one click |
| ✅ Application status | Click the checkbox to cycle: pending → applied (✓ green) → terminated (✗ red) |
| 📝 Notepad | Notes collapsed by default (title + preview); click to expand. Free-form content, one-click copy |
| 🔍 Search & filter | Search by company/account/note, filter by status, live stats on top |
| 💾 Backup & migrate | JSON export/import — move to a new computer or browser without losing data |

## 📥 Download

Grab the **latest release** from the [Releases](../../releases) page:

| Asset (example name) | Who it's for |
|---|---|
| `online-app-notepad-setup-x.y.z.exe` | Most users: installer with Start Menu / desktop shortcuts and auto-update |
| `online-app-notepad-x.y.z-win.zip` | Portable build: unzip and run, no registry writes, great for USB drives |

> ASCII asset names are a GitHub release convention (converted automatically by electron-builder). The installed app is still named「网申记事本」.

> ⚠️ **Windows security notice**: this software is not code-signed, so SmartScreen may warn on first run.
> This is expected — click "More info" → "Run anyway" if you accept the risk.

> 🔒 **Only download from this repository's Releases page.** Third-party reposts or repacks are not
> officially endorsed and cannot be guaranteed safe. See [CONTRIBUTING.md](CONTRIBUTING.md).

## 🔐 Privacy

- Your companies, links, accounts, passwords and notes are **stored locally only** (installer build: Electron store in your user directory; portable build: beside the app). The source code and installer **contain no user data**.
- Passwords are stored in plain text locally — the price of one-click copy. **Do not store real passwords on shared computers**.
- Exported backup JSON contains all data in plain text. Share it carefully.
- Migrating from the old web version: "Export backup" in the old version → "Import backup" in this app. Done.

## 🛠️ Build from source

Requires Node.js 20+:

```bash
npm install
npm run dist          # output in dist/: Setup exe + portable zip
npm start             # dev mode (no packaging, auto-update disabled)
```

## 📄 License

[MIT](LICENSE) — use it, modify it, just keep the copyright notice.

## 🤝 Contributing

PRs welcome: new features, bug fixes, UI tweaks. Process and red lines: [CONTRIBUTING.md](CONTRIBUTING.md).

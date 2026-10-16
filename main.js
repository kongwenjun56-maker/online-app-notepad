/* 网申记事本 — Electron 主进程
 * v1.0.4 2026-10-15：更名「网申记事本 / Online Application Notepad」（v1.0.3 及以前叫「求职工作台」）。
 * 业务逻辑全部在 app/index.html，与网页版完全一致。
 * 安全基线：渲染进程 sandbox + contextIsolation + 禁 nodeIntegration，
 * 页面万一被注入脚本也摸不到 Node 能力。
 */
'use strict';

const { app, BrowserWindow, Menu, dialog } = require('electron');
const path = require('path');

// 单实例锁：重复双击只聚焦已有窗口，避免多窗口写同一份 localStorage
if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

let win = null;

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 1024,
    minHeight: 640,
    title: '网申记事本',
    autoHideMenuBar: true,
    backgroundColor: '#0d1117',
    webPreferences: {
      contextIsolation: true,   // 渲染进程与 Node 隔离
      nodeIntegration: false,   // 页面不接触 Node API
      sandbox: true
    }
  });
  Menu.setApplicationMenu(null);
  win.loadFile(path.join(__dirname, 'app', 'index.html'));
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('second-instance', () => {
  if (win) {
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

/* ---- 自动更新（仅打包后生效） ----
 * 公开仓库的 Release 资产匿名可读，latest.yml 无需 token。
 * 开发模式（未打包）跳过，避免误连。 */
if (app.isPackaged) {
  const { autoUpdater } = require('electron-updater');
  autoUpdater.autoDownload = false;   // 先征得同意再下载

  app.whenReady().then(() => {
    autoUpdater.on('update-available', (info) => {
      if (!win) return;
      dialog.showMessageBox(win, {
        type: 'info',
        title: '发现新版本',
        message: '发现新版本 v' + info.version + '，是否现在下载？',
        detail: '下载完成后重启即安装，你的企业数据与笔记不受影响。',
        buttons: ['下载并安装', '稍后再说'],
        defaultId: 0,
        cancelId: 1
      }).then((r) => {
        if (r.response === 0) autoUpdater.downloadUpdate();
      });
    });
    autoUpdater.on('update-downloaded', () => {
      if (!win) return;
      dialog.showMessageBox(win, {
        type: 'info',
        title: '更新已就绪',
        message: '新版本已下载完成，重启工作台后生效。',
        buttons: ['立即重启', '稍后'],
        defaultId: 0,
        cancelId: 1
      }).then((r) => {
        if (r.response === 0) autoUpdater.quitAndInstall();
      });
    });
    // 启动 5 秒后再检查，避开开窗高峰
    setTimeout(() => { autoUpdater.checkForUpdates().catch(() => {}); }, 5000);
  });
}

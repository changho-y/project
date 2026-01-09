// main.js
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  // 브라우저 창을 생성
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true, // 일렉트론 최신 보안 가이드라인은 두 값을 반대로(true, false) 설정하고 preload.js를 사용하기를 권장
      contextIsolation: false // 로컬 리소스 접근 편의성을 위해 설정을 허용, 추후 Bridge 도입
    }
  });

  // index.html 파일을 로드
  mainWindow.loadFile('index.html');

  // 개발자 도구 오픈
  mainWindow.webContents.openDevTools();
}

// Electron이 준비되면 창 생성
app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// 앱 종료
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

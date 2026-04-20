const { app, BrowserWindow } = require('electron');
const path = require('path');
const http = require('http');

function waitForReact(port, callback) {
  const options = { host: 'localhost', port: port, path: '/' };

  const check = () => {
    const req = http.request(options, (res) => {
      if (res.statusCode === 200) {
        callback();
      } else {
        setTimeout(check, 300);
      }
    });

    req.on('error', () => setTimeout(check, 300));
    req.end();
  };

  check();
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  waitForReact(3000, () => {
    win.loadURL('http://localhost:3000');
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

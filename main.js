const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

// Check if we are running the packaged executable or not
const isDev = !app.isPackaged;

if (!isDev) {
    // In production, force desktop environment to run Express internally
    process.env.DESKTOP_ENV = 'true';
    process.env.NODE_ENV = 'production';
    process.env.PORT = '5000';

    // Require the express server
    require('./server/server.js');
}

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        title: "Happy Hanger",
        icon: path.join(__dirname, 'build', 'icon.png'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    // Remove default top menu for a premium look
    Menu.setApplicationMenu(null);

    // If development, load Vite Server. If production, load our Express Server
    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
    } else {
        mainWindow.loadURL('http://localhost:5000');
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Trigger update check only in production
    if (!isDev) {
        autoUpdater.checkForUpdatesAndNotify();
    }
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

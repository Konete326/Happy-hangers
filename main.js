const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const net = require('net');

// Check if we are running the packaged executable or not
const isDev = !app.isPackaged;

let mainWindow;
let serverPort = 5000;
let backendServer = null;

function findAvailablePort(startPort) {
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        server.unref();
        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                resolve(findAvailablePort(startPort + 1));
            } else {
                reject(err);
            }
        });
        server.listen(startPort, () => {
            const port = server.address().port;
            server.close(() => resolve(port));
        });
    });
}

async function startServerAndApp() {
    if (!isDev) {
        // Find an available port starting from 5000
        serverPort = await findAvailablePort(5000);

        // In production, force desktop environment to run Express internally
        process.env.DESKTOP_ENV = 'true';
        process.env.NODE_ENV = 'production';
        process.env.PORT = serverPort.toString();

        // Require the express server
        const { serverInstance } = require('./server/server.js');
        backendServer = serverInstance;
    }
    
    createWindow();
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        title: "Happy Hangers",
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
        mainWindow.loadURL(`http://localhost:${serverPort}`);
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
    startServerAndApp();

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

app.on('will-quit', () => {
    if (backendServer) {
        backendServer.close();
    }
});

ipcMain.on('print-receipt', (event, htmlContent) => {
    let workerWindow = new BrowserWindow({
        show: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });
    workerWindow.loadURL("data:text/html;charset=utf-8," + encodeURIComponent(htmlContent));
    workerWindow.webContents.on('did-finish-load', () => {
        workerWindow.webContents.print({
            silent: true,
            printBackground: true
        }, (success, errorType) => {
            if (!success) {
                console.error("Silent print failed:", errorType);
            }
            workerWindow.destroy();
            workerWindow = null;
        });
    });
});

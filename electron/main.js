const { app, BrowserWindow, session, ipcMain, Menu, Tray, nativeImage, shell, dialog } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('child_process');
const os = require('os');

const isDev = process.env.NODE_ENV !== 'production';
const isWindows = process.platform === 'win32';
const isMac = process.platform === 'darwin';
const isLinux = process.platform === 'linux';

let mainWindow = null;
let tray = null;
let backendProcess = null;
let splashWindow = null;

const APP_NAME = 'YATAV Training System';
const APP_VERSION = '2.0.0';

const appPaths = {
  userData: app.getPath('userData'),
  logs: path.join(app.getPath('userData'), 'logs'),
  database: path.join(app.getPath('userData'), 'database'),
  uploads: path.join(app.getPath('userData'), 'uploads'),
  recordings: path.join(app.getPath('userData'), 'recordings'),
  backups: path.join(app.getPath('userData'), 'backups'),
  cache: path.join(app.getPath('userData'), 'cache')
};

Object.values(appPaths).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const logger = {
  info: (message, data = {}) => {
    const log = {
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      ...data
    };
    console.log(JSON.stringify(log));
    fs.appendFileSync(
      path.join(appPaths.logs, `app-${new Date().toISOString().split('T')[0]}.log`),
      JSON.stringify(log) + '\n'
    );
  },
  error: (message, error = {}) => {
    const log = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      error: error.stack || error.message || error
    };
    console.error(JSON.stringify(log));
    fs.appendFileSync(
      path.join(appPaths.logs, `error-${new Date().toISOString().split('T')[0]}.log`),
      JSON.stringify(log) + '\n'
    );
  }
};

const singleInstance = app.requestSingleInstanceLock();
if (!singleInstance) {
  app.quit();
  return;
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

class BackendManager {
  constructor() {
    this.process = null;
    this.isRunning = false;
    this.port = 8008;
    this.retryCount = 0;
    this.maxRetries = 5;
    this.isNodeBackend = true; // Use Node.js backend
  }

  async start() {
    if (this.isRunning) return;

    try {
      logger.info('Starting backend server...');
      
      let executablePath;
      let args = [];
      let cwd;
      
      if (this.isNodeBackend) {
        // Use Node.js backend
        if (isDev) {
          executablePath = 'node';
          args = ['-r', 'tsx/cjs', path.join(__dirname, '..', 'backend-node', 'src', 'server.ts')];
          cwd = path.join(__dirname, '..', 'backend-node');
        } else {
          executablePath = process.execPath; // Use Electron's Node.js
          args = [path.join(process.resourcesPath, 'backend-node', 'dist', 'server.js')];
          cwd = process.resourcesPath;
        }
      } else {
        // Legacy Python backend (kept for reference)
        if (isDev) {
          executablePath = 'python';
          args = ['-m', 'uvicorn', 'main:app', '--host', '127.0.0.1', '--port', this.port.toString(), '--reload'];
          cwd = path.join(__dirname, '..', 'backend');
        } else {
          executablePath = path.join(process.resourcesPath, 'backend', 'yatav-backend');
          try {
            fs.chmodSync(executablePath, '755');
          } catch (e) {
            logger.error('Failed to set executable permissions:', e);
          }
          args = [];
          cwd = process.resourcesPath;
        }
      }

      logger.info('Backend executable path:', { executablePath, cwd, isDev, isNodeBackend: this.isNodeBackend });

      const env = {
        ...process.env,
        DATABASE_PATH: appPaths.database,
        UPLOAD_PATH: appPaths.uploads,
        RECORDING_PATH: appPaths.recordings,
        CACHE_PATH: appPaths.cache,
        LOG_PATH: appPaths.logs,
        PORT: this.port,
        HOST: '127.0.0.1',
        ELECTRON_APP: 'true',
        NODE_ENV: process.env.NODE_ENV || 'production'
      };

      if (!this.isNodeBackend && isDev) {
        env.PYTHONPATH = cwd;
      }

      this.process = spawn(executablePath, args, {
        cwd,
        env,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.process.stdout.on('data', (data) => {
        logger.info('Backend:', { output: data.toString() });
      });

      this.process.stderr.on('data', (data) => {
        logger.error('Backend error:', { output: data.toString() });
      });

      this.process.on('error', (error) => {
        logger.error('Failed to start backend:', error);
        this.handleBackendError();
      });

      this.process.on('exit', (code) => {
        logger.info('Backend exited', { code });
        this.isRunning = false;
        if (code !== 0 && this.retryCount < this.maxRetries) {
          this.retry();
        }
      });

      await this.waitForBackend();
      this.isRunning = true;
      logger.info('Backend server started successfully');
      
    } catch (error) {
      logger.error('Failed to start backend:', error);
      throw error;
    }
  }

  async waitForBackend(timeout = 30000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        const response = await fetch(`http://127.0.0.1:${this.port}/health`);
        if (response.ok) return true;
      } catch (e) {
        // Server not ready yet
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error('Backend server failed to start within timeout');
  }

  async stop() {
    if (!this.process) return;

    return new Promise((resolve) => {
      this.process.on('exit', () => {
        this.isRunning = false;
        resolve();
      });

      if (isWindows) {
        spawn('taskkill', ['/pid', this.process.pid, '/f', '/t']);
      } else {
        this.process.kill('SIGTERM');
      }

      setTimeout(() => {
        if (this.process) {
          this.process.kill('SIGKILL');
        }
        resolve();
      }, 5000);
    });
  }

  retry() {
    this.retryCount++;
    logger.info(`Retrying backend start (${this.retryCount}/${this.maxRetries})...`);
    setTimeout(() => this.start(), 3000);
  }

  handleBackendError() {
    if (mainWindow) {
      mainWindow.webContents.send('backend-error', {
        message: 'Backend server error occurred',
        retrying: this.retryCount < this.maxRetries
      });
    }
  }
}

const backendManager = new BackendManager();

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 600,
    height: 400,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  const splashHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            height: 100vh;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            color: white;
          }
          .logo {
            font-size: 48px;
            font-weight: bold;
            margin-bottom: 20px;
            animation: pulse 2s infinite;
          }
          .status {
            font-size: 14px;
            opacity: 0.9;
            margin-top: 20px;
          }
          .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid rgba(255,255,255,0.3);
            border-top: 4px solid white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-top: 30px;
          }
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      </head>
      <body>
        <div class="logo">YATAV</div>
        <div>Training System v${APP_VERSION}</div>
        <div class="spinner"></div>
        <div class="status">Initializing application...</div>
      </body>
    </html>
  `;

  splashWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(splashHTML)}`);
  splashWindow.center();
}

function createMainWindow() {
  const { screen } = require('electron');
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  mainWindow = new BrowserWindow({
    width: Math.min(1400, width * 0.9),
    height: Math.min(900, height * 0.9),
    minWidth: 1024,
    minHeight: 768,
    frame: !isMac,
    titleBarStyle: isMac ? 'hiddenInset' : 'default',
    backgroundColor: '#ffffff',
    show: false,
    icon: isDev ? path.join(__dirname, '..', 'assets', 'icon.png') : path.join(process.resourcesPath, 'assets', 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
      sandbox: false,
      allowRunningInsecureContent: false
    }
  });

  mainWindow.once('ready-to-show', () => {
    if (splashWindow) {
      setTimeout(() => {
        splashWindow.close();
        splashWindow = null;
        mainWindow.show();
      }, 1500);
    } else {
      mainWindow.show();
    }
  });

  // Load React app
  const htmlPath = path.join(__dirname, '..', 'frontend', 'dist', 'index.html');
  console.log('Loading React app from:', htmlPath);
  console.log('File exists:', fs.existsSync(htmlPath));
  
  if (fs.existsSync(htmlPath)) {
    mainWindow.loadFile(htmlPath).then(() => {
      console.log('React app loaded successfully!');
    }).catch(err => {
      console.error('Failed to load React app:', err);
      dialog.showErrorBox('Load Error', `Failed to load: ${err.message}`);
    });
  } else {
    console.error('React app not found!');
    dialog.showErrorBox('File Not Found', `React app not found at:\n${htmlPath}`);
  }
  
  // Open DevTools only in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    logger.error('Failed to load main window:', { errorCode, errorDescription });
    
    if (!isDev) {
      mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                background: #f5f5f5;
              }
              .error-container {
                text-align: center;
                padding: 40px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              }
              h1 { color: #e74c3c; }
              button {
                margin-top: 20px;
                padding: 10px 20px;
                background: #3498db;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
              }
            </style>
          </head>
          <body>
            <div class="error-container">
              <h1>Failed to Load Application</h1>
              <p>${errorDescription}</p>
              <button onclick="location.reload()">Retry</button>
            </div>
          </body>
        </html>
      `)}`);
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

function createTray() {
  const iconPath = isDev ? path.join(__dirname, '..', 'assets', 'icon.png') : path.join(process.resourcesPath, 'assets', 'icon.png');
  const trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
  
  tray = new Tray(trayIcon);
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Application',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    {
      label: 'Settings',
      click: () => {
        if (mainWindow) {
          mainWindow.webContents.send('navigate', '/settings');
        }
      }
    },
    { type: 'separator' },
    {
      label: 'About',
      click: () => {
        dialog.showMessageBox(mainWindow, {
          type: 'info',
          title: 'About',
          message: APP_NAME,
          detail: `Version: ${APP_VERSION}\nElectron: ${process.versions.electron}\nNode: ${process.versions.node}`,
          buttons: ['OK']
        });
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      }
    }
  ]);

  tray.setToolTip(APP_NAME);
  tray.setContextMenu(contextMenu);

  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

function setupApplicationMenu() {
  const template = [
    ...(isMac ? [{
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services', submenu: [] },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'New Session',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow?.webContents.send('navigate', '/session/new')
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        ...(isMac ? [
          { role: 'pasteAndMatchStyle' },
          { role: 'delete' },
          { role: 'selectAll' }
        ] : [
          { role: 'delete' },
          { type: 'separator' },
          { role: 'selectAll' }
        ])
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' },
        ...(isMac ? [
          { type: 'separator' },
          { role: 'front' },
          { type: 'separator' },
          { role: 'window' }
        ] : [])
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Documentation',
          click: async () => {
            await shell.openExternal('https://docs.yatav.com');
          }
        },
        {
          label: 'Report Issue',
          click: async () => {
            await shell.openExternal('https://github.com/yatav/issues');
          }
        },
        { type: 'separator' },
        {
          label: 'View Logs',
          click: () => {
            shell.openPath(appPaths.logs);
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function setupSecurityPolicy() {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' http://127.0.0.1:8008 http://localhost:8008 ws://127.0.0.1:8008 ws://localhost:8008 https://accounts.google.com https://api.openai.com",
      "media-src 'self' blob:",
      "frame-src 'self' https://accounts.google.com"
    ].join('; ');

    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [csp],
        'X-Content-Type-Options': ['nosniff'],
        'X-Frame-Options': ['DENY'],
        'X-XSS-Protection': ['1; mode=block'],
        'Referrer-Policy': ['strict-origin-when-cross-origin']
      }
    });
  });

  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowedPermissions = ['media', 'microphone', 'camera', 'notifications'];
    
    if (allowedPermissions.includes(permission)) {
      callback(true);
    } else {
      callback(false);
    }
  });
}

function setupIPC() {
  ipcMain.handle('app:version', () => APP_VERSION);
  ipcMain.handle('app:paths', () => appPaths);
  
  ipcMain.handle('backend:status', async () => {
    return {
      running: backendManager.isRunning,
      port: backendManager.port,
      retryCount: backendManager.retryCount
    };
  });

  ipcMain.handle('backend:restart', async () => {
    await backendManager.stop();
    await backendManager.start();
    return { success: true };
  });

  ipcMain.handle('dialog:open', async (event, options) => {
    const result = await dialog.showOpenDialog(mainWindow, options);
    return result;
  });

  ipcMain.handle('dialog:save', async (event, options) => {
    const result = await dialog.showSaveDialog(mainWindow, options);
    return result;
  });

  ipcMain.handle('shell:openExternal', async (event, url) => {
    await shell.openExternal(url);
  });

  ipcMain.handle('shell:openPath', async (event, path) => {
    await shell.openPath(path);
  });

  ipcMain.on('window:minimize', () => {
    mainWindow?.minimize();
  });

  ipcMain.on('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });

  ipcMain.on('window:close', () => {
    mainWindow?.close();
  });
}

async function initializeApp() {
  try {
    logger.info('Application starting...', { version: APP_VERSION, platform: process.platform });
    
    createSplashWindow();
    
    // Start backend server
    try {
      logger.info('Starting backend server...');
      await backendManager.start();
      logger.info('Backend server started successfully');
    } catch (err) {
      logger.error('Backend start failed:', err);
      // Continue anyway - app can work without backend
      dialog.showMessageBox({
        type: 'warning',
        title: '백엔드 서버',
        message: '백엔드 서버를 시작할 수 없습니다.\n일부 기능이 제한될 수 있습니다.',
        buttons: ['확인']
      });
    }
    
    setupSecurityPolicy();
    setupApplicationMenu();
    setupIPC();
    
    createMainWindow();
    createTray();
    
    logger.info('Application initialized successfully');
    
  } catch (error) {
    logger.error('Failed to initialize application:', error);
    
    dialog.showErrorBox(
      'Initialization Error',
      `Failed to start the application:\n${error.message}\n\nPlease check the logs for more details.`
    );
    
    app.quit();
  }
}

app.whenReady().then(initializeApp);

app.on('window-all-closed', () => {
  if (!isMac) {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

app.on('before-quit', async (event) => {
  if (backendManager.isRunning) {
    event.preventDefault();
    logger.info('Shutting down backend server...');
    await backendManager.stop();
    logger.info('Backend server stopped');
    app.quit();
  }
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  dialog.showErrorBox('Unexpected Error', error.message);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection:', { reason, promise });
});

module.exports = { app, mainWindow };
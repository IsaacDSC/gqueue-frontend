const { app, BrowserWindow, Menu, ipcMain, nativeTheme } = require("electron");
const path = require("path");

let mainWindow;

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
    show: false,
  });

  // Load the app
  mainWindow.loadFile(path.join(__dirname, "index.html"));

  // Show window when ready
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  // Handle theme changes
  ipcMain.handle("dark-mode:toggle", () => {
    if (nativeTheme.shouldUseDarkColors) {
      nativeTheme.themeSource = "light";
    } else {
      nativeTheme.themeSource = "dark";
    }
    return nativeTheme.shouldUseDarkColors;
  });

  ipcMain.handle("dark-mode:system", () => {
    nativeTheme.themeSource = "system";
    return nativeTheme.shouldUseDarkColors;
  });

  // Send theme updates to renderer
  nativeTheme.on("updated", () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(
        "theme-updated",
        nativeTheme.shouldUseDarkColors,
      );
    }
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createWindow();

  // Create application menu
  const template = [
    {
      label: "View",
      submenu: [
        {
          label: "Toggle Dark Mode",
          accelerator: "CmdOrCtrl+D",
          click: async () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              const isDark = await mainWindow.webContents.executeJavaScript(`
                window.electronAPI && window.electronAPI.toggleDarkMode()
              `);
            }
          },
        },
        {
          label: "Use System Theme",
          click: async () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              await mainWindow.webContents.executeJavaScript(`
                window.electronAPI && window.electronAPI.useSystemTheme()
              `);
            }
          },
        },
        { type: "separator" },
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
      ],
    },
  ];

  if (process.platform === "darwin") {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: "about" },
        { type: "separator" },
        { role: "services" },
        { type: "separator" },
        { role: "hide" },
        { role: "hideOthers" },
        { role: "unhide" },
        { type: "separator" },
        { role: "quit" },
      ],
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
});

// Quit when all windows are closed, except on macOS
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

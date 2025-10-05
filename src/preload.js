const { contextBridge, ipcRenderer } = require('electron')

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  toggleDarkMode: () => ipcRenderer.invoke('dark-mode:toggle'),
  useSystemTheme: () => ipcRenderer.invoke('dark-mode:system'),
  onThemeUpdated: (callback) => ipcRenderer.on('theme-updated', callback)
})

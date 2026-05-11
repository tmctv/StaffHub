const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  getStaff: () => ipcRenderer.invoke('get-staff'),
  addStaff: (member) => ipcRenderer.invoke('add-staff', member),
  clockAction: (data) => ipcRenderer.invoke('clock-action', data),
  getAllRecords: () => ipcRenderer.invoke('get-all-records'),
  getAllStatuses: () => ipcRenderer.invoke('get-all-statuses'),
  fetchRadioMeta: () => ipcRenderer.invoke('fetch-radio-metadata'),
  // Presenter
  getDisplays: () => ipcRenderer.invoke('get-displays'),
  openPresenter: (displayId) => ipcRenderer.send('open-presenter', displayId),
  closePresenter: () => ipcRenderer.send('close-presenter'),
  // Announcements
  getAnnouncements: () => ipcRenderer.invoke('get-announcements'),
  postAnnouncement: (data) => ipcRenderer.invoke('post-announcement', data),
  deleteAnnouncement: (id) => ipcRenderer.invoke('delete-announcement', id),
  // Emergency
  triggerEmergency: (data) => ipcRenderer.invoke('trigger-emergency', data),
  clearEmergency: () => ipcRenderer.invoke('clear-emergency'),
  getEmergency: () => ipcRenderer.invoke('get-emergency'),
  // Events from main
  onDataUpdated: (cb) => ipcRenderer.on('data-updated', cb),
  onAnnouncement: (cb) => ipcRenderer.on('announcement', (_, data) => cb(data)),
  onEmergency: (cb) => ipcRenderer.on('emergency', (_, data) => cb(data)),
  onEmergencyClear: (cb) => ipcRenderer.on('emergency-clear', cb),
  // Updates
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version')
});

const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');

const dataPath = path.join(app.getPath('userData'), 'clockin-data.json');

const DEFAULT_STAFF = [
  { id: 'TMC-0001', name: 'Alex Mishra', role: 'CEO & Founder', avatar: 'AM', color: '#7C4DFF' },
  { id: 'TMC-0002', name: 'Seehed', role: 'Staff', avatar: 'SH', color: '#FF48BC' },
  { id: 'TMC-0003', name: 'Cody', role: 'Staff', avatar: 'CO', color: '#0ED7FF' },
  { id: 'TMC-0004', name: 'Hashtag', role: 'Staff', avatar: 'HT', color: '#FF6B35' }
];

function loadData() {
  try {
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    if (!data.staff || data.staff.length === 0) data.staff = DEFAULT_STAFF;
    if (!data.records) data.records = [];
    if (!data.announcements) data.announcements = [];
    if (!data.emergency) data.emergency = null;
    return data;
  } catch {
    return { staff: DEFAULT_STAFF, records: [], announcements: [], emergency: null };
  }
}

function saveData(data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

let splashWin = null;
let mainWin = null;
let presenterWin = null;

function createSplash() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  splashWin = new BrowserWindow({
    width: 520, height: 380,
    x: Math.round((width - 520) / 2), y: Math.round((height - 380) / 2),
    frame: false, transparent: true, resizable: false,
    skipTaskbar: false, alwaysOnTop: true,
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    webPreferences: { contextIsolation: true, nodeIntegration: false }
  });
  splashWin.loadFile('renderer/splash.html');
  setTimeout(() => createMainWindow(), 4200);
}

function createMainWindow() {
  mainWin = new BrowserWindow({
    width: 1100, height: 750, minWidth: 860, minHeight: 600,
    show: false, frame: false, backgroundColor: '#f5f5fa',
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false
    }
  });
  mainWin.loadFile('renderer/index.html');
  mainWin.once('ready-to-show', () => {
    setTimeout(() => {
      if (splashWin && !splashWin.isDestroyed()) { splashWin.close(); splashWin = null; }
      mainWin.maximize();
      mainWin.show();
    }, 600);
  });

  ipcMain.on('window-minimize', () => mainWin.minimize());
  ipcMain.on('window-maximize', () => {
    if (mainWin.isMaximized()) mainWin.unmaximize(); else mainWin.maximize();
  });
  ipcMain.on('window-close', () => mainWin.close());
}

// Presenter mode
ipcMain.on('open-presenter', (_, displayId) => {
  if (presenterWin && !presenterWin.isDestroyed()) { presenterWin.focus(); return; }

  const displays = screen.getAllDisplays();
  let target = displays.find(d => d.id.toString() === displayId);
  if (!target && displays.length > 1) target = displays.find(d => d.id !== screen.getPrimaryDisplay().id);
  if (!target) target = screen.getPrimaryDisplay();

  presenterWin = new BrowserWindow({
    x: target.bounds.x, y: target.bounds.y,
    width: target.bounds.width, height: target.bounds.height,
    fullscreen: true, frame: false, backgroundColor: '#0a0a14',
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false
    }
  });
  presenterWin.loadFile('renderer/presenter.html');
  presenterWin.on('closed', () => { presenterWin = null; });
});

ipcMain.on('close-presenter', () => {
  if (presenterWin && !presenterWin.isDestroyed()) presenterWin.close();
});

ipcMain.handle('get-displays', () => {
  const displays = screen.getAllDisplays();
  const primary = screen.getPrimaryDisplay();
  return displays.map(d => ({
    id: d.id.toString(),
    label: `${d.size.width}x${d.size.height}${d.id === primary.id ? ' (Primary)' : ' (External)'}`,
    isPrimary: d.id === primary.id
  }));
});

// Staff
ipcMain.handle('get-staff', () => loadData().staff);
ipcMain.handle('add-staff', (_, member) => {
  const data = loadData(); data.staff.push(member); saveData(data); return data.staff;
});

// Clock
ipcMain.handle('clock-action', (_, { employeeId, action }) => {
  const data = loadData();
  const record = { id: Date.now().toString(36), employeeId, action, timestamp: new Date().toISOString() };
  data.records.push(record);
  saveData(data);
  if (presenterWin && !presenterWin.isDestroyed()) presenterWin.webContents.send('data-updated');
  return record;
});

ipcMain.handle('get-all-records', () => {
  return loadData().records.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 100);
});

ipcMain.handle('get-all-statuses', () => {
  const data = loadData();
  const statuses = {};
  for (const member of data.staff) {
    const last = data.records.filter(r => r.employeeId === member.id)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
    statuses[member.id] = last || null;
  }
  return statuses;
});

// Announcements
ipcMain.handle('get-announcements', () => {
  return loadData().announcements.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
});

ipcMain.handle('post-announcement', (_, { title, message, priority }) => {
  const data = loadData();
  const ann = { id: Date.now().toString(36), title, message, priority: priority || 'normal', timestamp: new Date().toISOString() };
  data.announcements.push(ann);
  saveData(data);
  if (presenterWin && !presenterWin.isDestroyed()) presenterWin.webContents.send('announcement', ann);
  return ann;
});

ipcMain.handle('delete-announcement', (_, id) => {
  const data = loadData();
  data.announcements = data.announcements.filter(a => a.id !== id);
  saveData(data);
  return true;
});

// Emergency
ipcMain.handle('trigger-emergency', (_, { message }) => {
  const data = loadData();
  data.emergency = { message, timestamp: new Date().toISOString(), active: true };
  saveData(data);
  if (presenterWin && !presenterWin.isDestroyed()) presenterWin.webContents.send('emergency', data.emergency);
  if (mainWin && !mainWin.isDestroyed()) mainWin.webContents.send('emergency', data.emergency);
  return data.emergency;
});

ipcMain.handle('clear-emergency', () => {
  const data = loadData();
  data.emergency = null;
  saveData(data);
  if (presenterWin && !presenterWin.isDestroyed()) presenterWin.webContents.send('emergency-clear');
  if (mainWin && !mainWin.isDestroyed()) mainWin.webContents.send('emergency-clear');
  return true;
});

ipcMain.handle('get-emergency', () => loadData().emergency);

// Radio metadata
ipcMain.handle('fetch-radio-metadata', async () => {
  return new Promise((resolve) => {
    https.get('https://cast.cirya.co/api/nowplaying', { timeout: 5000 }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          const station = Array.isArray(data) ? data[0] : data;
          resolve({
            title: station?.now_playing?.song?.title || 'Unknown',
            artist: station?.now_playing?.song?.artist || 'Unknown Artist',
            album: station?.now_playing?.song?.album || '',
            art: station?.now_playing?.song?.art || '',
            stationName: station?.station?.name || 'Cirya Radio',
            listeners: station?.listeners?.current || 0,
            elapsed: station?.now_playing?.elapsed || 0,
            duration: station?.now_playing?.duration || 0
          });
        } catch { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
});

// Update checker — checks a remote JSON file for the latest version
ipcMain.handle('check-for-updates', async () => {
  const currentVersion = app.getVersion();
  return new Promise((resolve) => {
    https.get('https://tmc.gg/staffhub-version.json', { timeout: 5000 }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          const hasUpdate = data.version !== currentVersion;
          resolve({
            currentVersion,
            latestVersion: data.version,
            hasUpdate,
            changelog: data.changelog || '',
            downloadUrl: data.downloadUrl || 'https://tmc.gg/staffhub.html'
          });
        } catch { resolve({ currentVersion, latestVersion: currentVersion, hasUpdate: false }); }
      });
    }).on('error', () => resolve({ currentVersion, latestVersion: currentVersion, hasUpdate: false }));
  });
});

ipcMain.handle('get-app-version', () => app.getVersion());

app.whenReady().then(createSplash);
app.on('window-all-closed', () => app.quit());

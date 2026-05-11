const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

let staff = [];
let statuses = {};
let isPlaying = false;

const COLORS = ['#7C4DFF','#FF48BC','#0ED7FF','#FF6B35','#00E676','#FFD600','#FF5252','#00BCD4'];
const audio = $('#radio-audio');
const alarm = $('#alarm-audio');

// ═══ TITLEBAR ═══
$('#btn-min').addEventListener('click', () => window.api.minimize());
$('#btn-max').addEventListener('click', () => window.api.maximize());
$('#btn-close').addEventListener('click', () => window.api.close());

// ═══ NAVIGATION ═══
$$('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.nav-item').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    $$('.view').forEach(v => v.classList.remove('active'));
    $(`#view-${btn.dataset.view}`).classList.add('active');
    if (btn.dataset.view === 'activity') loadActivity();
    if (btn.dataset.view === 'announcements') loadAnnouncements();
    if (btn.dataset.view === 'presenter') loadDisplays();
    if (btn.dataset.view === 'emergency') checkEmergencyStatus();
  });
});

// ═══ CLOCK ═══
function updateClock() {
  const now = new Date();
  $('#header-clock').textContent = now.toLocaleTimeString('en-US', { hour12: false });
  $('#dash-date').textContent = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}
setInterval(updateClock, 1000);
updateClock();

// ═══ TOAST ═══
function toast(msg, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  $('#toast-container').appendChild(el);
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('show')));
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); }, 2500);
}

// ═══ STAFF ═══
async function loadStaff() {
  staff = await window.api.getStaff();
  statuses = await window.api.getAllStatuses();
  renderStaff();
  updateStats();
}

function renderStaff() {
  const grid = $('#staff-grid');
  grid.innerHTML = staff.map(m => {
    const s = statuses[m.id];
    const isIn = s && s.action === 'in';
    const since = s ? timeAgo(s.timestamp) : '';
    return `
      <div class="staff-card ${isIn ? 'clocked-in' : ''}" data-id="${m.id}">
        <div class="staff-top">
          <div class="staff-avatar" style="background:${m.color || COLORS[0]}">${m.avatar}</div>
          <div class="staff-info"><div class="staff-name">${m.name}</div><div class="staff-role">${m.role}</div></div>
        </div>
        <div class="staff-status">
          <div class="staff-status-dot ${isIn ? 'active' : ''}"></div>
          <span class="staff-status-text ${isIn ? 'active' : ''}">${isIn ? 'Clocked In' : (s ? 'Clocked Out' : 'Not Active')}</span>
          ${since ? `<span class="staff-since">${since}</span>` : ''}
        </div>
        <div class="staff-actions">
          <button class="btn-staff-action btn-staff-in" ${isIn ? 'disabled' : ''} onclick="clockIn('${m.id}')">Clock In</button>
          <button class="btn-staff-action btn-staff-out" ${!isIn ? 'disabled' : ''} onclick="clockOut('${m.id}')">Clock Out</button>
        </div>
      </div>`;
  }).join('');
}

function updateStats() {
  let clockedIn = 0;
  for (const m of staff) { if (statuses[m.id]?.action === 'in') clockedIn++; }
  $('#stat-total').textContent = staff.length;
  $('#stat-clocked').textContent = clockedIn;
  $('#stat-out').textContent = staff.length - clockedIn;
}

window.clockIn = async (id) => {
  await window.api.clockAction({ employeeId: id, action: 'in' });
  toast(`${staff.find(m => m.id === id)?.name || id} clocked in`);
  await loadStaff();
};

window.clockOut = async (id) => {
  await window.api.clockAction({ employeeId: id, action: 'out' });
  toast(`${staff.find(m => m.id === id)?.name || id} clocked out`);
  await loadStaff();
};

// Add Staff Modal
$('#btn-add-staff').addEventListener('click', () => { $('#modal-overlay').classList.add('open'); $('#new-id').focus(); });
$('#btn-modal-cancel').addEventListener('click', () => $('#modal-overlay').classList.remove('open'));
$('#modal-overlay').addEventListener('click', (e) => { if (e.target === $('#modal-overlay')) $('#modal-overlay').classList.remove('open'); });
$('#btn-modal-confirm').addEventListener('click', async () => {
  const id = $('#new-id').value.trim(), name = $('#new-name').value.trim(), role = $('#new-role').value.trim() || 'Staff';
  if (!id || !name) return;
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  await window.api.addStaff({ id, name, role, avatar: initials, color: COLORS[staff.length % COLORS.length] });
  $('#new-id').value = ''; $('#new-name').value = ''; $('#new-role').value = '';
  $('#modal-overlay').classList.remove('open');
  toast(`${name} added`, 'info');
  await loadStaff();
});

// ═══ ACTIVITY ═══
async function loadActivity() {
  const records = await window.api.getAllRecords();
  const feed = $('#activity-feed');
  if (records.length === 0) { feed.innerHTML = '<p class="activity-empty">No activity records yet</p>'; return; }
  feed.innerHTML = records.map(r => {
    const member = staff.find(m => m.id === r.employeeId);
    const isIn = r.action === 'in';
    const d = new Date(r.timestamp);
    return `
      <div class="activity-item">
        <div class="activity-avatar" style="background:${member?.color || '#666'}">${member?.avatar || '??'}</div>
        <div class="activity-info"><div class="activity-text"><strong>${member?.name || r.employeeId}</strong> <span class="${isIn ? 'act-in' : 'act-out'}">${isIn ? 'clocked in' : 'clocked out'}</span></div></div>
        <div class="activity-time">${d.toLocaleDateString('en-US',{month:'short',day:'numeric'})} ${d.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:true})}</div>
      </div>`;
  }).join('');
}

// ═══ ANNOUNCEMENTS ═══
$('#btn-new-announcement').addEventListener('click', () => { $('#modal-announcement').classList.add('open'); $('#ann-title').focus(); });
$('#btn-ann-cancel').addEventListener('click', () => $('#modal-announcement').classList.remove('open'));
$('#modal-announcement').addEventListener('click', (e) => { if (e.target === $('#modal-announcement')) $('#modal-announcement').classList.remove('open'); });
$('#btn-ann-confirm').addEventListener('click', async () => {
  const title = $('#ann-title').value.trim(), message = $('#ann-message').value.trim(), priority = $('#ann-priority').value;
  if (!title || !message) return;
  await window.api.postAnnouncement({ title, message, priority });
  $('#ann-title').value = ''; $('#ann-message').value = ''; $('#ann-priority').value = 'normal';
  $('#modal-announcement').classList.remove('open');
  toast('Announcement posted', 'info');
  loadAnnouncements();
});

async function loadAnnouncements() {
  const anns = await window.api.getAnnouncements();
  const list = $('#announcements-list');
  if (anns.length === 0) { list.innerHTML = '<p class="activity-empty">No announcements yet</p>'; return; }
  const priorityColors = { urgent: '#F44336', important: '#FF6B35', normal: '#7C4DFF' };
  const priorityBgs = { urgent: 'rgba(244,67,54,0.06)', important: 'rgba(255,107,53,0.06)', normal: 'rgba(124,77,255,0.04)' };
  list.innerHTML = anns.map(a => {
    const d = new Date(a.timestamp);
    return `
      <div class="announcement-card" style="border-left:3px solid ${priorityColors[a.priority]};background:${priorityBgs[a.priority]}">
        <div class="ann-header">
          <span class="ann-priority-badge" style="background:${priorityColors[a.priority]}20;color:${priorityColors[a.priority]}">${a.priority.toUpperCase()}</span>
          <span class="ann-time">${d.toLocaleDateString('en-US',{month:'short',day:'numeric'})} ${d.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:true})}</span>
          <button class="ann-delete" onclick="deleteAnn('${a.id}')">&times;</button>
        </div>
        <h3 class="ann-title">${a.title}</h3>
        <p class="ann-body">${a.message}</p>
      </div>`;
  }).join('');
}

window.deleteAnn = async (id) => {
  await window.api.deleteAnnouncement(id);
  toast('Announcement removed');
  loadAnnouncements();
};

// ═══ PRESENTER ═══
let selectedDisplay = null;

async function loadDisplays() {
  const displays = await window.api.getDisplays();
  const list = $('#display-list');
  list.innerHTML = displays.map(d => `
    <label class="display-option">
      <input type="radio" name="display" value="${d.id}" ${d.isPrimary ? '' : 'checked'}>
      <div class="display-info">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
        <span>${d.label}</span>
      </div>
    </label>
  `).join('');
}

$('#btn-launch-presenter').addEventListener('click', () => {
  const selected = document.querySelector('input[name="display"]:checked');
  if (selected) {
    window.api.openPresenter(selected.value);
    $('#btn-launch-presenter').style.display = 'none';
    $('#btn-stop-presenter').style.display = 'block';
    toast('Presenter launched', 'info');
  }
});

$('#btn-stop-presenter').addEventListener('click', () => {
  window.api.closePresenter();
  $('#btn-launch-presenter').style.display = 'block';
  $('#btn-stop-presenter').style.display = 'none';
  toast('Presenter stopped');
});

// ═══ EMERGENCY ═══
$('#btn-trigger-emergency').addEventListener('click', async () => {
  const msg = $('#emergency-msg').value.trim();
  if (!msg) return;
  await window.api.triggerEmergency({ message: msg });
  toast('EMERGENCY ALERT TRIGGERED', 'error');
  checkEmergencyStatus();
});

$('#btn-clear-emergency').addEventListener('click', async () => {
  await window.api.clearEmergency();
  toast('Emergency cleared');
  checkEmergencyStatus();
});

async function checkEmergencyStatus() {
  const emg = await window.api.getEmergency();
  const status = $('#emergency-status');
  if (emg && emg.active) {
    status.innerHTML = `
      <div class="emg-icon-active"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#F44336" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>
      <h3 style="color:#F44336">EMERGENCY ACTIVE</h3>
      <p style="color:#F44336">${emg.message}</p>`;
    $('#btn-trigger-emergency').style.display = 'none';
    $('#btn-clear-emergency').style.display = 'block';
  } else {
    status.innerHTML = `
      <div class="emg-icon-ok"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>
      <h3>No Active Emergency</h3>
      <p>All clear. Use the form below to trigger an emergency alert.</p>`;
    $('#btn-trigger-emergency').style.display = 'block';
    $('#btn-clear-emergency').style.display = 'none';
  }
}

// Emergency events from main process
window.api.onEmergency((data) => {
  $('#emergency-overlay').classList.add('active');
  $('#emg-overlay-msg').textContent = data.message;
  alarm.play().catch(() => {});
});

window.api.onEmergencyClear(() => {
  $('#emergency-overlay').classList.remove('active');
  alarm.pause();
  alarm.currentTime = 0;
});

// ═══ RADIO ═══
function toggleRadio() {
  if (isPlaying) { audio.pause(); audio.src = ''; isPlaying = false; }
  else { audio.src = 'https://cast.cirya.co/listen/one/radio.mp3'; audio.volume = $('#volume-slider').value / 100; audio.play().catch(() => {}); isPlaying = true; }
  updatePlayUI();
}
function updatePlayUI() {
  document.querySelectorAll('.icon-play').forEach(i => i.style.display = isPlaying ? 'none' : 'block');
  document.querySelectorAll('.icon-pause').forEach(i => i.style.display = isPlaying ? 'block' : 'none');
  $('#radio-viz').classList.toggle('active', isPlaying);
  $('#mini-viz').classList.toggle('active', isPlaying);
}
$('#btn-radio-play').addEventListener('click', toggleRadio);
$('#btn-mini-play').addEventListener('click', toggleRadio);
$('#volume-slider').addEventListener('input', (e) => { audio.volume = e.target.value / 100; });

async function fetchMeta() {
  const meta = await window.api.fetchRadioMeta();
  if (!meta) return;
  $('#radio-title').textContent = meta.title;
  $('#radio-artist').textContent = meta.artist;
  $('#radio-album').textContent = meta.album || '';
  $('#radio-station').textContent = meta.stationName;
  $('#radio-listeners').textContent = meta.listeners;
  $('#meta-station').textContent = meta.stationName;
  $('#mini-title').textContent = meta.title;
  $('#mini-artist').textContent = meta.artist;
  if (meta.art) $('#radio-art').innerHTML = `<img src="${meta.art}" alt="Art" style="width:100%;height:100%;object-fit:cover">`;
  if (meta.duration > 0) {
    $('#radio-progress-fill').style.width = Math.min((meta.elapsed / meta.duration) * 100, 100) + '%';
    $('#radio-elapsed').textContent = fmtDur(meta.elapsed);
    $('#radio-duration').textContent = fmtDur(meta.duration);
  }
}

function fmtDur(s) { return `${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,'0')}`; }
function timeAgo(iso) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs/24)}d ago`;
}

// ═══ UPDATES ═══
async function checkUpdates() {
  const update = await window.api.checkForUpdates();
  if (update.hasUpdate) {
    $('#update-version').textContent = 'v' + update.latestVersion;
    $('#update-link').href = update.downloadUrl;
    $('#update-banner').classList.add('show');
    // Adjust layout height
    document.querySelector('.app-layout').style.height = 'calc(100vh - 42px - 48px - 33px)';
  }
}

$('#update-dismiss').addEventListener('click', () => {
  $('#update-banner').classList.remove('show');
  document.querySelector('.app-layout').style.height = '';
});

// ═══ INIT ═══
(async () => {
  await loadStaff();
  await fetchMeta();
  setInterval(fetchMeta, 15000);
  checkEmergencyStatus();
  checkUpdates();
  setInterval(checkUpdates, 300000); // check every 5 min
})();

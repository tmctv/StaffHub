# TMC StaffHub Portal

Internal staff management application for **The Mishra Corporation**.

StaffHub is a desktop app built for staff rooms — clock in/out, post announcements, trigger emergency alerts, stream Cirya Radio to store speakers, and display live shift status on a TV with Presenter Mode.

## Features

- **Staff Clock-In/Out** — One-click clock in and out for all team members with live status tracking
- **Presenter Mode** — Fullscreen dark-themed display for staff room TVs on any connected monitor. Shows real-time shift status, clock, and staff cards
- **Announcements** — Post Normal, Important, or Urgent announcements visible to all staff and on the presenter display
- **Emergency Alerts** — Trigger fire, security, medical, or weather alerts with alarm sounds across all screens. Preset buttons for fast activation
- **Cirya Radio** — Built-in radio streamer for store speakers with live metadata (now playing, album art, listeners) from CiryaCast
- **Auto Updates** — Checks for new versions on launch and notifies staff when an update is available
- **Branded Installer** — NSIS installer with TMC branding, EULA, and desktop/Start Menu shortcuts

## Tech Stack

- Electron 35
- HTML/CSS/JS (no framework)
- Inter typeface
- CiryaCast API for radio metadata

## Getting Started

```bash
npm install
npm start
```

## Building

```bash
npm run build
```

Outputs to `dist/`. Generates an NSIS `.exe` installer for Windows x64.

## Download

Staff can download the latest version at [tmc.gg/staffhub.html](https://tmc.gg/staffhub.html) (password required).

## Version History

- **v1.1.0** — Added Presenter Mode, Announcements, Emergency Alerts, auto-update checker
- **v1.0.0** — Initial release with staff clock-in/out, Cirya Radio, activity log

---

**The Mishra Corporation** — [tmc.gg](https://tmc.gg) | Internal use only.

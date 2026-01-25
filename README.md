# 🖼️ Gallery Viewer – Chrome Extension

A powerful, offline-first **image & video gallery viewer** built as a custom Chrome extension.

![Gallery View](Screenshots/Screenshot%201.png)

Designed for quickly browsing large image sets or folders, previewing video frames, and navigating visually with speed and precision.

---

## ✨ Features

### 📂 File & Folder Support

- Load **individual images or videos**
- Load **entire folders** (recursive)
- Natural filename sorting (handles numbers correctly)
- Offline — everything runs locally in your browser

### 🎞️ Video Frame Extraction

- Automatically extracts **multiple preview frames** from videos
- Frames are evenly distributed across the video duration
- Useful for quick content review or reference browsing

### 🧱 Flexible Grid Layout

- Switch between **12 / 6 / 3 / 2 / 1 images per row**
- Adjustable container width (zoom in / out)
- Toggle grid gaps on/off
- Optional **actual-width mode** for single-image rows

### 🔍 Advanced Viewing Experience

- Fullscreen overlay viewer
- Three zoom modes:
  - Off
  - Click-to-zoom
  - Live magnifying lens
- Auto sizing based on image orientation
- 80% width or full-width viewing modes

### 📌 Bookmarks (Folder Mode)

- Save your last viewed image per folder
- Automatically resumes from where you left off

### 🎲 Productivity Tools

- Randomize image order
- Keyboard shortcuts for fast navigation
- Horizontal scroll → vertical scroll remapping
- Spotlight mode (hide UI for distraction-free viewing)

---

## 🖥️ Screenshots

### Main Gallery View

![Gallery View](Screenshots/Screenshot%201.png)

### Overlay Image Viewer

![Overlay Viewer](Screenshots/Screenshot%202.png)

### Zoom & Controls

![Zoom Features](Screenshots/Screenshot%203.png)

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|---|---|
| `←` / `→` | Previous / Next image |
| `Esc` | Close overlay |
| `Z` | Toggle zoom mode |
| `R` | Randomize images |
| `G` | Toggle grid gaps |
| `H` | Toggle spotlight mode |
| `F` | Toggle fullscreen |
| `S` | Save bookmark (folder mode) |
| `+` / `-` | Increase / decrease grid width |

---

## 🚀 Installation (Developer Mode)

1. Clone or download this repository
2. Open Chrome and navigate to:

```
chrome://extensions
```

1. Enable **Developer Mode** (top-right)
2. Click **Load unpacked**
3. Select the project folder

You can open the extension via:

- Chrome toolbar icon
- Keyboard shortcut: **Alt + G**

---

## 🛠️ Tech Stack

- Vanilla **HTML / CSS / JavaScript**
- Chrome Extensions **Manifest V3**
- No external dependencies
- Fully offline-capable

---

## 📁 Project Structure

```
Gallery Viewer
├── index.html
├── manifest.json
├── scripts/
│   ├── main.js
│   ├── background.js
│   └── materialize.js
├── styles/
│   ├── main.css
│   └── effects.css
├── icons/
├── Screenshots/
└── LICENSE
```

---

## 👤 Author

**Abdul Hadi Khan**

---

## 📄 License

This project is licensed under the terms of the **MIT License**.  
See the `LICENSE` file for details.

---

## ⭐ Notes

This extension was built to handle **large galleries efficiently**, provide **fast visual navigation**, and stay completely local for privacy and performance.

Feel free to fork, modify, or extend it 🚀

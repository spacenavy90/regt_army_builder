const canvas = document.getElementById("mapCanvas");
const ctx = canvas.getContext("2d");

const cellSize = 80;
let cols = 12;
let rows = 8;

let currentTool = "blue";
let isPainting = false;
let mapData = [];
let tokens = [];
let isIdManuallyEdited = false;

// Variables to preserve JSON fields not actively edited in the UI
let currentDeploymentMap = "";
let currentTtsCardFront = "";

let globalMissionsData = [];
let selectedMissionId = null;

// --- DATABASE & LIBRARY LOGIC ---

async function fetchMissions() {
  try {
    const response = await fetch("data.json?t=" + Date.now()); // cache busting
    const data = await response.json();
    globalMissionsData = [];
    if (data.missions) {
      Object.keys(data.missions).forEach((cat) => {
        data.missions[cat].forEach((msn) => globalMissionsData.push(msn));
      });
    }
    renderLibrary();
  } catch (err) {
    console.error("Could not load data.json", err);
  }
}

function renderLibrary() {
  const listContainer = document.getElementById("library-list");
  const searchTerm = document.getElementById("lib-search").value.toLowerCase();
  const filterType = document.getElementById("lib-filter-type").value;

  listContainer.innerHTML = "";

  const filtered = globalMissionsData.filter((msn) => {
    const matchesSearch = msn.name.toLowerCase().includes(searchTerm) || msn.id.toLowerCase().includes(searchTerm);
    const matchesType = filterType === "All" || msn.type === filterType;
    return matchesSearch && matchesType;
  });

  filtered.forEach((msn) => {
    const item = document.createElement("div");
    item.style = `padding: 12px; border-bottom: 1px solid #eee; cursor: pointer; transition: background 0.2s;`;
    if (selectedMissionId === msn.id) item.style.background = "#e8f0fe";

    item.innerHTML = `
            <div style="font-weight:bold;">${msn.name}</div>
            <div style="font-size:12px; color:#666;">${msn.id} | <span style="color:#1a73e8">${msn.type}</span></div>
        `;

    item.onclick = () => {
      selectedMissionId = msn.id;
      renderLibrary();
    };

    item.ondblclick = () => {
      selectedMissionId = msn.id;
      loadMissionIntoEditor();
    };

    listContainer.appendChild(item);
  });
}

function loadMissionIntoEditor() {
  const msn = globalMissionsData.find((m) => m.id === selectedMissionId);
  if (!msn) return;

  document.getElementById("msn-id").value = msn.id || "";
  document.getElementById("msn-name").value = msn.name || "";
  document.getElementById("msn-type").value = msn.type || "Aggressive";
  document.getElementById("msn-desc").value = msn.desc || "";
  document.getElementById("msn-setup").value = msn.setup || "";
  document.getElementById("msn-scoring").value = msn.scoring || "";
  document.getElementById("msn-victory").value = msn.victory || "";
  document.getElementById("msn-special").value = msn.special_rules || "";
  isIdManuallyEdited = true;

  // Preserve external fields
  currentDeploymentMap = msn.deployment_map || "";
  currentTtsCardFront = msn.tts_card_front || "";

  if (msn.map_code) {
    try {
      const state = JSON.parse(atob(msn.map_code));
      document.getElementById("board-size").value = state.board || "6x4";
      cols = state.board === "6x4" ? 12 : 8;
      rows = 8;
      canvas.width = cols * cellSize;
      canvas.height = rows * cellSize;
      mapData = state.map;
      tokens = state.tokens || [];
    } catch (e) {
      console.error("Map Code Error", e);
    }
  } else {
    initMap();
  }

  document.getElementById("library-modal").style.display = "none";
  draw();
}

// Event Listeners for Library
document.getElementById("btn-library").onclick = () => {
  document.getElementById("library-modal").style.display = "flex";
  fetchMissions();
};
document.getElementById("lib-close").onclick = () => (document.getElementById("library-modal").style.display = "none");
document.getElementById("btn-refresh-db").onclick = fetchMissions;
document.getElementById("lib-search").oninput = renderLibrary;
document.getElementById("lib-filter-type").onchange = renderLibrary;
document.getElementById("lib-load-selected").onclick = loadMissionIntoEditor;

// --- RESET MISSION LOGIC ---
document.getElementById("btn-reset").onclick = () => {
  if (!confirm("Are you sure you want to reset all parameters and clear the map?")) return;

  document.getElementById("msn-id").value = "";
  document.getElementById("msn-name").value = "";
  document.getElementById("msn-type").value = "Aggressive";
  document.getElementById("msn-desc").value = "";
  document.getElementById("msn-setup").value = "";
  document.getElementById("msn-scoring").value = "";
  document.getElementById("msn-victory").value = "";
  document.getElementById("msn-special").value = "";

  isIdManuallyEdited = false;
  currentDeploymentMap = "";
  currentTtsCardFront = "";
  selectedMissionId = null;

  document.getElementById("board-size").value = "6x4";
  cols = 12;
  rows = 8;
  initMap();
};

// --- CORE LOGIC ---
function initMap() {
  mapData = Array(cols)
    .fill()
    .map(() => Array(rows).fill(null));
  tokens = [];
  canvas.width = cols * cellSize;
  canvas.height = rows * cellSize;
  draw();
}

document.querySelectorAll(".tool-btn").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    document.querySelectorAll(".tool-btn").forEach((b) => b.classList.remove("active"));
    e.currentTarget.classList.add("active");
    currentTool = e.currentTarget.dataset.tool;
  });
});

document.getElementById("board-size").addEventListener("change", (e) => {
  cols = e.target.value === "6x4" ? 12 : 8;
  rows = 8;
  initMap();
});

document.getElementById("show-scale").addEventListener("change", draw);
if (document.getElementById("scale-pos")) document.getElementById("scale-pos").addEventListener("change", draw);
document.getElementById("bg-theme").addEventListener("change", draw);
document.getElementById("btn-clear").addEventListener("click", initMap);

function generateId() {
  if (isIdManuallyEdited) return;
  const name = document.getElementById("msn-name").value;
  const typeStr = document.getElementById("msn-type").value;

  if (!name) {
    document.getElementById("msn-id").value = "";
    return;
  }

  let prefix = "msn_";
  if (typeStr === "Aggressive") prefix += "agg_";
  else if (typeStr === "Defensive") prefix += "def_";
  else if (typeStr === "Maneuver") prefix += "man_";
  else if (typeStr === "Scenario") prefix += "sce_";

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  document.getElementById("msn-id").value = prefix + slug;
}

document.getElementById("msn-name").addEventListener("input", generateId);
document.getElementById("msn-type").addEventListener("change", generateId);
document.getElementById("msn-id").addEventListener("input", () => {
  isIdManuallyEdited = true;
});

function getMousePos(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  };
}

function handlePaint(pos) {
  if (currentTool === "token") return;
  const brushType = document.getElementById("brush-size").value;

  let startX = Math.floor(pos.x / cellSize);
  let startY = Math.floor(pos.y / cellSize);

  let size = 1;
  if (brushType === "large") {
    size = 2;
    startX = Math.floor(startX / 2) * 2;
    startY = Math.floor(startY / 2) * 2;
  }

  for (let dx = 0; dx < size; dx++) {
    for (let dy = 0; dy < size; dy++) {
      let x = startX + dx;
      let y = startY + dy;
      if (x >= 0 && x < cols && y >= 0 && y < rows) {
        if (currentTool === "blue") mapData[x][y] = "#5c7cfa";
        else if (currentTool === "red") mapData[x][y] = "#ff6b6b";
        else if (currentTool === "eraser") mapData[x][y] = null;
      }
    }
  }
  draw();
}

function handleToken(pos) {
  if (currentTool !== "token") return;

  const snapDist = cellSize;
  const snappedX = Math.round(pos.x / snapDist) * snapDist;
  const snappedY = Math.round(pos.y / snapDist) * snapDist;

  const existingIndex = tokens.findIndex((t) => t.x === snappedX && t.y === snappedY);
  if (existingIndex > -1) {
    tokens.splice(existingIndex, 1);
  } else {
    tokens.push({ x: snappedX, y: snappedY });
  }
  draw();
}

canvas.addEventListener("mousedown", (e) => {
  const pos = getMousePos(e);
  if (currentTool === "token") {
    handleToken(pos);
  } else {
    isPainting = true;
    handlePaint(pos);
  }
});

canvas.addEventListener("mousemove", (e) => {
  if (isPainting) handlePaint(getMousePos(e));
});

window.addEventListener("mouseup", () => {
  isPainting = false;
});

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const theme = document.getElementById("bg-theme").value;
  const isDark = theme === "black";

  // Paint Base Layer
  if (theme === "white") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else if (theme === "black") {
    ctx.fillStyle = "#111111"; // Off-black is easier on the eyes
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Draw Zones
  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      if (mapData[x][y]) {
        ctx.fillStyle = mapData[x][y];
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }
  }

  // Set Theme Variables
  const gridRGB = isDark ? "255,255,255" : "0,0,0";
  const lineColor = isDark ? "#ffffff" : "#000000";

  // Sub grids
  ctx.strokeStyle = `rgba(${gridRGB},0.2)`;
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1;
  for (let i = 0; i <= canvas.width; i += cellSize) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, canvas.height);
    ctx.stroke();
  }
  for (let j = 0; j <= canvas.height; j += cellSize) {
    ctx.beginPath();
    ctx.moveTo(0, j);
    ctx.lineTo(canvas.width, j);
    ctx.stroke();
  }

  // Major Grids
  ctx.strokeStyle = `rgba(${gridRGB},0.5)`;
  ctx.setLineDash([8, 8]);
  ctx.lineWidth = 2;
  for (let i = 0; i <= canvas.width; i += cellSize * 2) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, canvas.height);
    ctx.stroke();
  }
  for (let j = 0; j <= canvas.height; j += cellSize * 2) {
    ctx.beginPath();
    ctx.moveTo(0, j);
    ctx.lineTo(canvas.width, j);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // --- 12" SCALE DRAWING ---
  if (document.getElementById("show-scale").checked) {
    const scaleFontSize = 42;
    const scalePosElement = document.getElementById("scale-pos");
    const scalePos = scalePosElement ? scalePosElement.value : "tl";

    let centerX = cellSize;
    let centerY = cellSize;

    if (scalePos === "tr") {
      centerX = canvas.width - cellSize;
    } else if (scalePos === "bl") {
      centerY = canvas.height - cellSize;
    } else if (scalePos === "br") {
      centerX = canvas.width - cellSize;
      centerY = canvas.height - cellSize;
    }

    const scaleWidth = cellSize * 1.75;
    const scaleStartX = centerX - scaleWidth / 2;
    const scaleEndX = centerX + scaleWidth / 2;
    const lineY = centerY + 8;

    ctx.fillStyle = lineColor;
    ctx.font = `italic bold ${scaleFontSize}px sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText('12"', centerX, lineY - 8);
    ctx.textAlign = "left";

    ctx.beginPath();
    ctx.moveTo(scaleStartX, lineY);
    ctx.lineTo(scaleEndX, lineY);
    ctx.lineWidth = 2;
    ctx.strokeStyle = lineColor;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(scaleStartX + 6, lineY - 6);
    ctx.lineTo(scaleStartX, lineY);
    ctx.lineTo(scaleStartX + 6, lineY + 6);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(scaleEndX - 6, lineY - 6);
    ctx.lineTo(scaleEndX, lineY);
    ctx.lineTo(scaleEndX - 6, lineY + 6);
    ctx.stroke();
  }

  // Draw Tokens
  const tokenRadius = 18;
  const innerRadius = 10;
  tokens.forEach((t) => {
    // Outer Circle
    ctx.beginPath();
    ctx.arc(t.x, t.y, tokenRadius, 0, Math.PI * 2);
    ctx.fillStyle = "#1e3a5f";
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = isDark ? "#555" : "#81c7d4";
    ctx.stroke();

    // Inner Circle
    ctx.beginPath();
    ctx.arc(t.x, t.y, innerRadius, 0, Math.PI * 2);
    ctx.fillStyle = isDark ? "#222" : "#fff";
    ctx.fill();

    // Crosshairs
    ctx.beginPath();
    ctx.moveTo(t.x - tokenRadius / 2, t.y);
    ctx.lineTo(t.x + tokenRadius / 2, t.y);
    ctx.moveTo(t.x, t.y - tokenRadius / 2);
    ctx.lineTo(t.x, t.y + tokenRadius / 2);
    ctx.strokeStyle = isDark ? "#fff" : "#1e3a5f";
    ctx.lineWidth = 2;
    ctx.stroke();
  });
}

// --- EXPORT LOGIC ---
const modal = document.getElementById("export-modal");
const modalTextarea = document.getElementById("modal-textarea");

function showModal(content, title) {
  document.getElementById("modal-title").innerText = title;
  modalTextarea.value = content;
  modalTextarea.readOnly = true;
  modal.style.display = "flex";
}

document.getElementById("modal-close").addEventListener("click", () => (modal.style.display = "none"));
document.getElementById("modal-copy").addEventListener("click", () => {
  navigator.clipboard.writeText(modalTextarea.value);
  const btn = document.getElementById("modal-copy");
  btn.innerText = "Copied!";
  setTimeout(() => (btn.innerText = "Copy to Clipboard"), 2000);
});

function getMissionData() {
  const mapDataPayload = {
    board: document.getElementById("board-size").value,
    map: mapData,
    tokens: tokens,
  };

  return {
    id: document.getElementById("msn-id").value,
    name: document.getElementById("msn-name").value,
    type: document.getElementById("msn-type").value,
    desc: document.getElementById("msn-desc").value,
    setup: document.getElementById("msn-setup").value,
    scoring: document.getElementById("msn-scoring").value,
    victory: document.getElementById("msn-victory").value,
    special_rules: document.getElementById("msn-special").value,
    map_code: btoa(JSON.stringify(mapDataPayload)),
    deployment_map: currentDeploymentMap,
    tts_card_front: currentTtsCardFront,
  };
}

document.getElementById("exp-json").addEventListener("click", () => {
  showModal(JSON.stringify(getMissionData(), null, 4), "JSON Output");
});

document.getElementById("exp-text").addEventListener("click", () => {
  const data = getMissionData();
  const text = `MISSION: ${data.name} [${data.type}]\n\nDESCRIPTION:\n${data.desc}\n\nSETUP:\n${data.setup}\n\nSCORING:\n${data.scoring}\n\nVICTORY:\n${data.victory}\n\nSPECIAL RULES:\n${data.special_rules}`;
  showModal(text, "Text Output");
});

// --- IMAGE EXPORT FILENAME & FORMAT LOGIC ---

function getExportExtension(mimeType) {
  if (mimeType === "image/jpeg") return ".jpg";
  if (mimeType === "image/webp") return ".webp";
  return ".png";
}

function triggerDownload(content, fileName) {
  const a = document.createElement("a");
  a.href = content;
  a.download = fileName;
  a.click();
}

document.getElementById("exp-map").onclick = () => {
  const format = document.getElementById("export-format").value;
  const ext = getExportExtension(format);
  const fileName = `${document.getElementById("msn-id").value || "map"}${ext}`;
  triggerDownload(canvas.toDataURL(format, 0.9), fileName);
};

document.getElementById("exp-card").onclick = () => {
  const cardCanvas = document.createElement("canvas");
  const cCtx = cardCanvas.getContext("2d");
  const data = getMissionData();
  const format = document.getElementById("export-format").value;
  const ext = getExportExtension(format);

  const isDark = document.getElementById("bg-theme").value === "black";
  const bgFill = isDark ? "#111111" : "#ffffff";
  const headerColor = isDark ? "#ffffff" : "#333333";
  const subheadColor = isDark ? "#aaaaaa" : "#333333";
  const labelColor = isDark ? "#eeeeee" : "#111111";
  const textColor = isDark ? "#cccccc" : "#444444";
  const borderColor = isDark ? "#444444" : "#333333";

  cardCanvas.width = 840;
  cardCanvas.height = 1200;
  const padding = 50;

  cCtx.fillStyle = bgFill;
  cCtx.fillRect(0, 0, cardCanvas.width, cardCanvas.height);

  cCtx.fillStyle = headerColor;
  cCtx.font = "bold 42px sans-serif";
  cCtx.fillText(data.name || "Unnamed Mission", padding, padding + 30);

  cCtx.fillStyle = subheadColor;
  cCtx.font = "italic 24px sans-serif";
  cCtx.fillText(`Type: ${data.type}`, padding, padding + 70);

  let currentY = padding + 130;
  function drawWrappedText(label, text) {
    if (!text) return;
    cCtx.fillStyle = labelColor;
    cCtx.font = "bold 20px sans-serif";
    cCtx.fillText(label, padding, currentY);
    currentY += 28;
    cCtx.fillStyle = textColor;
    cCtx.font = "18px sans-serif";
    const words = text.split(" ");
    let line = "";
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " ";
      const metrics = cCtx.measureText(testLine);
      if (metrics.width > cardCanvas.width - padding * 2 && n > 0) {
        cCtx.fillText(line, padding, currentY);
        line = words[n] + " ";
        currentY += 24;
      } else {
        line = testLine;
      }
    }
    cCtx.fillText(line, padding, currentY);
    currentY += 45;
  }

  drawWrappedText("Description", data.desc);
  drawWrappedText("Setup", data.setup);
  drawWrappedText("Scoring", data.scoring);
  drawWrappedText("Victory", data.victory);
  drawWrappedText("Special Rules", data.special_rules);

  const cardMapMaxWidth = cardCanvas.width - padding * 2;
  const cardMapHeight = 493;

  const boardSize = document.getElementById("board-size").value;
  let drawWidth, drawHeight, drawX;

  if (boardSize === "4x4") {
    drawHeight = cardMapHeight;
    drawWidth = cardMapHeight;
    drawX = (cardCanvas.width - drawWidth) / 2;
  } else {
    drawWidth = cardMapMaxWidth;
    drawHeight = cardMapHeight;
    drawX = padding;
  }

  const mapY = cardCanvas.height - drawHeight - padding;
  cCtx.drawImage(canvas, drawX, mapY, drawWidth, drawHeight);

  cCtx.strokeStyle = borderColor;
  cCtx.lineWidth = 4;
  cCtx.strokeRect(drawX, mapY, drawWidth, drawHeight);

  const fileName = `${data.id || "mission"}_card${ext}`;
  triggerDownload(cardCanvas.toDataURL(format, 0.9), fileName);
};

initMap();

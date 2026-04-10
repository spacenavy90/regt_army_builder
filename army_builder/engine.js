let REGIMENT_DATA = null;
let currentList = {};
let currentMissions = { aggressive: null, defensive: null, maneuver: null };
let selectedFactionId = "reb_all";

document.addEventListener("DOMContentLoaded", async () => {
  try {
    // 1. Fetch the data
    const response = await fetch("data.json");
    if (!response.ok) throw new Error("Failed to load data.json");

    // 2. Parse and assign to the global variable
    REGIMENT_DATA = await response.json();

    // 3. Setup standard listeners
    setupEventListeners();

    // 4. Initialize the view
    initializeHomeScreen();

    if (loadState()) {
      loadBuilderView(selectedFactionId, currentList);
    }
  } catch (error) {
    console.error("Critical Initialization Error:", error);
    alert("The Army Builder could not load the game database. Check the console for details.");
  }
});

function setupEventListeners() {
  document.getElementById("armyCap").addEventListener("input", updateUI);
  document.getElementById("sortSelect").addEventListener("change", renderRoster);
  document.getElementById("factionSelect").addEventListener("change", (e) => {
    loadBuilderView(e.target.value);
  });
  document.getElementById("overrideToggle").addEventListener("change", updateUI);
  document.getElementById("btnClearList").addEventListener("click", clearArmy);

  // --- NEW MODAL LISTENERS ---
  document.getElementById("btnKeywords").addEventListener("click", toggleKeywordModal);

  document.getElementById("keywordModal").addEventListener("click", (e) => {
    if (e.target.id === "keywordModal") toggleKeywordModal();
  });

  document.getElementById("btnCopySimple").addEventListener("click", () => copyToClipboard(generateSimpleText(), "btnCopySimple"));
  document.getElementById("btnCopyDetailed").addEventListener("click", () => copyToClipboard(generateDetailedText(), "btnCopyDetailed"));
  document.getElementById("btnCopyCode").addEventListener("click", () => {
    const cap = document.getElementById("armyCap").value;
    const listState = { f: selectedFactionId, c: cap, l: currentList, m: currentMissions };
    copyToClipboard(btoa(JSON.stringify(listState)), "btnCopyCode");
  });
  document.getElementById("btnCopyTTS").addEventListener("click", () => copyToClipboard(generateTTSJSON(), "btnCopyTTS"));
  document.getElementById("btnLoadCode").addEventListener("click", () => {
    const code = document.getElementById("shareCodeInput").value.trim();
    if (code) loadFromShareCode(code);
  });
}

function toggleKeywordModal() {
  const modal = document.getElementById("keywordModal");
  const isActive = modal.classList.toggle("active");

  if (isActive) {
    renderKeywordDefinitions();
  }
}

function renderKeywordDefinitions() {
  const container = document.getElementById("keywordList");

  if (!REGIMENT_DATA || !REGIMENT_DATA.definitions) {
    container.innerHTML = "<p>Error: Definitions not loaded.</p>";
    return;
  }

  // Sort keywords alphabetically for a better user experience
  const sortedKeys = Object.keys(REGIMENT_DATA.definitions).sort();

  container.innerHTML = sortedKeys
    .map((key) => {
      const entry = REGIMENT_DATA.definitions[key];
      return `
            <div class="kw-entry">
                <span class="kw-name">${key}</span>
                <p class="kw-desc">${entry.desc}</p>
            </div>
        `;
    })
    .join("");
}

// View Switching Functions
function initializeHomeScreen() {
  const majorGrid = document.getElementById("majorFactionsGrid");
  const minorGrid = document.getElementById("minorFactionsGrid");
  const selectDropdown = document.getElementById("factionSelect");

  // Clear initial HTML
  majorGrid.innerHTML = "";
  minorGrid.innerHTML = "";
  selectDropdown.innerHTML = "";

  REGIMENT_DATA.factions.forEach((f) => {
    // Populate the dropdown in the header dynamically
    selectDropdown.innerHTML += `<option value="${f.id}">${f.name}</option>`;

    // Populate the Home Screen grids
    if (f.type === "Major") {
      majorGrid.innerHTML += `
                <div class="faction-card" onclick="loadBuilderView('${f.id}')">
                    <img src="icons/${f.id}.svg" alt="${f.name} Icon" class="faction-icon" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'100\\' height=\\'100\\'><circle cx=\\'50\\' cy=\\'50\\' r=\\'40\\' stroke=\\'#333\\' stroke-width=\\'3\\' fill=\\'none\\'/></svg>'">
                    <span class="faction-card-name">${f.name}</span>
                </div>
            `;
    } else {
      minorGrid.innerHTML += `
                <button class="minor-btn" onclick="loadBuilderView('${f.id}')">${f.name}</button>
            `;
    }
  });
}

function loadBuilderView(factionId, listData = null) {
  selectedFactionId = factionId;
  document.getElementById("factionSelect").value = factionId;

  if (listData) {
    currentList = listData;
  } else {
    currentList = {};
  }

  document.getElementById("homeView").style.display = "none";
  document.getElementById("builderControls").style.display = "flex";
  document.getElementById("builderView").style.display = "grid";

  renderRoster();
}

function goHome() {
  // Return to faction select
  document.getElementById("homeView").style.display = "flex";
  document.getElementById("builderControls").style.display = "none";
  document.getElementById("builderView").style.display = "none";
}

function formatStat(val1, val2, unitSuffix = "") {
  if (val1 === null && val2 === null) return "-";
  const s1 = val1 !== null ? val1 + unitSuffix : "-";
  const s2 = val2 !== null ? val2 + unitSuffix : "-";
  return val2 !== null ? `${s1}/${s2}` : s1;
}

function calculateLimits(unit, cap) {
  const ceil = Math.ceil(cap * ((unit.max_pct || 100) / 100));
  const floor = Math.ceil(cap * ((unit.min_pct || 0) / 100));
  const maxUnits = unit.cost > ceil ? 0 : Math.floor(ceil / unit.cost);
  const minUnits = Math.floor(floor / unit.cost);
  return { min: minUnits, max: maxUnits };
}

function renderRoster() {
  const container = document.getElementById("unitList");
  const otsContainer = document.getElementById("otsList");
  const sortType = document.getElementById("sortSelect").value;
  const faction = REGIMENT_DATA.factions.find((f) => f.id === selectedFactionId);

  // Dynamically update the roster title with icon and faction name
  document.getElementById("rosterTitle").innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
            <img src="icons/${faction.id}.svg" class="title-icon" onerror="this.style.display='none'">
            ${faction.name} Unit Roster
        </div>
        <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 5px; text-transform: none;">
            Command Value: ${faction.command_value}
        </div>
    `;

  let units = [...faction.units];

  if (sortType === "alpha") units.sort((a, b) => a.name.localeCompare(b.name));
  if (sortType === "cost-high") units.sort((a, b) => b.cost - a.cost);

  container.innerHTML = units
    .map(
      (u) => `
        <div class="roster-row" id="row-${u.id}">
            <div class="row-info">
                <div class="unit-name">${u.name} (${u.unit_size})</div>
                <div class="unit-type">${u.class}${u.subclass ? " - " + u.subclass : ""}</div>
                <div class="unit-stats">
                    Mv: ${formatStat(u.mv, u.mv_min, '"')} | Atk: ${formatStat(u.atk_ranged, u.atk_melee)} | Rng: ${formatStat(u.rng_short, u.rng_long, '"')} | Wnd: ${u.wnd} | Cou: ${u.courage} | Sv: ${u.sv}
                </div>
                <div class="unit-keywords">${u.keywords.join(", ")}</div>
            </div>
            <div class="row-controls">
                <div class="cost-limit">
                    <span class="cost">${u.cost} pts</span>
                    <span class="limit" id="limit-text-${u.id}">Limit: 0-0</span>
                </div>
                <div class="stepper">
                    <button class="btn-step" onclick="adjust('${u.id}', -1)">-</button>
                    <span class="qty" id="qty-${u.id}">0</span>
                    <button class="btn-step" id="add-${u.id}" onclick="adjust('${u.id}', 1)">+</button>
                </div>
            </div>
        </div>
    `,
    )
    .join("");

  const leaderContainer = document.getElementById("leaderList");

  if (faction.leaders && faction.leaders.length > 0) {
    leaderContainer.innerHTML = faction.leaders
      .map(
        (l) => `
            <div class="roster-row" id="row-${l.id}">
                <div class="row-info">
                    <div class="unit-name">${l.name}</div>
                    <div class="unit-type">Leader</div>
                    <div class="unit-stats" style="color: var(--text-muted); font-size: 0.85rem; margin-top: 2px;">Restriction: ${l.restriction_text}</div>
                    <div class="unit-keywords" style="margin-top: 6px; font-style: italic;">${l.ability}</div>
                </div>
                <div class="row-controls">
                    <div class="cost-limit"><span class="cost">${l.cost} pts</span></div>
                    <div class="stepper">
                        <button class="btn-step" onclick="adjust('${l.id}', -1)">-</button>
                        <span class="qty" id="qty-${l.id}">0</span>
                        <button class="btn-step" id="add-${l.id}" onclick="adjust('${l.id}', 1)">+</button>
                    </div>
                </div>
            </div>
        `,
      )
      .join("");
  } else {
    leaderContainer.innerHTML = `<div style="padding: 15px; color: var(--text-muted); font-style: italic;">No leaders available for this faction.</div>`;
  }

  updateUI();
}

function updateUI() {
  const cap = parseInt(document.getElementById("armyCap").value) || 0;
  const isOverride = document.getElementById("overrideToggle").checked;
  const faction = REGIMENT_DATA.factions.find((f) => f.id === selectedFactionId);

  let totalSpent = 0;
  let otsSpent = 0;
  let otsCards = 0;

  const maxOtsPoints = Math.floor(cap * 0.15);
  const maxOtsCards = Math.floor(cap / 250);

  const manifestContainer = document.getElementById("manifestList");
  const manifestOtsContainer = document.getElementById("manifestOtsList");
  manifestContainer.innerHTML = "";
  manifestOtsContainer.innerHTML = "";

  let hasUnits = false;
  let hasOts = false;

  let leaderCount = 0;
  const manifestLeaderContainer = document.getElementById("manifestLeaderList");
  manifestLeaderContainer.innerHTML = "";

  // Process Combat Units
  faction.units.forEach((u) => {
    const qty = currentList[u.id] || 0;
    const limits = calculateLimits(u, cap);

    document.getElementById(`limit-text-${u.id}`).textContent = `Limit: ${limits.min}-${limits.max}`;
    document.getElementById(`qty-${u.id}`).textContent = qty;
    document.getElementById(`add-${u.id}`).disabled = !isOverride && qty >= limits.max;

    const isIllegal = (qty < limits.min && qty > 0) || qty > limits.max;
    document.getElementById(`row-${u.id}`).classList.toggle("illegal", isIllegal);

    if (qty > 0) {
      hasUnits = true;
      totalSpent += qty * u.cost;
      manifestContainer.innerHTML += buildManifestItem(u.id, u.name, qty, u.cost, `Allowed: ${limits.min} to ${limits.max}`);
    }
  });

  // Count leaders first to establish the lock
  if (faction.leaders) {
    faction.leaders.forEach((l) => {
      if (currentList[l.id] > 0) leaderCount += currentList[l.id];
    });

    // Process Leader UI Locks and Restrictions
    faction.leaders.forEach((l) => {
      const qty = currentList[l.id] || 0;
      document.getElementById(`qty-${l.id}`).textContent = qty;

      const isLocked = !isOverride && leaderCount >= 1 && qty === 0;
      document.getElementById(`add-${l.id}`).disabled = isLocked;

      let isIllegal = qty > 1 && !isOverride;

      // Trigger validation if the leader has ANY requirement
      if (qty > 0 && (l.requires_class || l.requires_subclass || l.requires_unit)) {
        let hasValidAttachment = false;

        // Check for a specific unit ID requirement first
        if (l.requires_unit) {
          if (currentList[l.requires_unit] > 0) {
            hasValidAttachment = true;
          }
        } else {
          // Otherwise, check class and subclass requirements
          faction.units.forEach((u) => {
            if (currentList[u.id] > 0) {
              const classMatch = !l.requires_class || u.class === l.requires_class;
              const subclassMatch = !l.requires_subclass || u.subclass === l.requires_subclass;

              if (classMatch && subclassMatch) {
                hasValidAttachment = true;
              }
            }
          });
        }

        if (!hasValidAttachment) isIllegal = true;
      }

      document.getElementById(`row-${l.id}`).classList.toggle("illegal", isIllegal);

      if (qty > 0) {
        totalSpent += qty * l.cost;
        manifestLeaderContainer.innerHTML += buildManifestItem(
          l.id,
          l.name,
          qty,
          l.cost,
          `Attachment Status: ${isIllegal ? "Missing Required Unit" : "Valid"}`,
        );
      }
    });
  }

  if (leaderCount > 0)
    manifestLeaderContainer.insertAdjacentHTML(
      "afterbegin",
      '<div style="color:var(--accent); font-weight:bold; margin-bottom:8px; border-bottom:1px solid var(--border-color); padding-bottom:5px;">ARMY LEADER</div>',
    );

  // Process OTS Logic
  REGIMENT_DATA.ots.forEach((o) => {
    const qty = currentList[o.id] || 0;

    if (qty > 0) {
      hasOts = true;
      otsSpent += qty * o.cost;
      otsCards += qty;
      totalSpent += qty * o.cost;
      manifestOtsContainer.innerHTML += buildManifestItem(o.id, o.name, qty, o.cost, `Support Asset`);
    }
  });

  if (hasUnits) manifestContainer.insertAdjacentHTML("afterbegin", '<div style="color:var(--accent); font-weight:bold; margin-bottom:8px;">COMBAT UNITS</div>');
  if (hasOts)
    manifestOtsContainer.insertAdjacentHTML(
      "afterbegin",
      '<div style="color:var(--accent); font-weight:bold; margin-bottom:8px; border-top:1px solid var(--border-color); padding-top:10px;">SUPPORT ASSETS</div>',
    );

  const totalDisp = document.getElementById("totalSpent");
  totalDisp.textContent = `${totalSpent} / ${cap}`;
  totalDisp.classList.toggle("over-limit", totalSpent > cap);

  const otsTracker = document.getElementById("otsTracker");
  otsTracker.textContent = `${otsSpent} / ${maxOtsPoints} pts | ${otsCards} / ${maxOtsCards} cards`;
  otsTracker.style.color = otsSpent > maxOtsPoints || otsCards > maxOtsCards ? "var(--danger)" : "var(--text-muted)";

  const bidValue = cap - totalSpent;
  document.getElementById("bidDisplay").textContent = bidValue > 0 ? bidValue : 0;

  // Update Mission Buttons & Warning
  const categories = ["aggressive", "defensive", "maneuver"];
  let missingMissions = false;

  categories.forEach((cat) => {
    const btn = document.getElementById(`btnMsn${cat.charAt(0).toUpperCase() + cat.slice(1)}`);
    if (!btn) return;

    if (currentMissions[cat]) {
      const msn = REGIMENT_DATA.missions[cat].find((m) => m.id === currentMissions[cat]);
      btn.textContent = msn ? msn.name : `Choose ${cat}`;
      btn.style.borderColor = "var(--accent)";
      btn.style.color = "var(--accent)";
    } else {
      btn.textContent = `Choose ${cat.charAt(0).toUpperCase() + cat.slice(1)}`;
      btn.style.borderColor = "var(--border-color)";
      btn.style.color = "var(--text-main)";
      missingMissions = true; // Flag if any are null
    }
  });

  document.getElementById("missionWarning").style.display = missingMissions ? "inline" : "none";

  saveState();
}

function buildManifestItem(id, name, qty, cost, subtext) {
  return `
        <div class="manifest-item">
            <div class="manifest-header">
                <div class="manifest-title">
                    <span class="manifest-name">${name}</span>
                    <span class="manifest-qty">x${qty}</span>
                </div>
                <button class="btn-remove" onclick="removeUnit('${id}')" title="Remove unit">×</button>
            </div>
            <div class="manifest-details">Cost: ${cost} pts ea / ${qty * cost} pts total</div>
            <div class="manifest-details">${subtext}</div>
        </div>
    `;
}

function adjust(id, amt) {
  currentList[id] = (currentList[id] || 0) + amt;
  if (currentList[id] <= 0) delete currentList[id];
  updateUI();
}

function clearArmy() {
  currentList = {};
  currentMissions = { aggressive: null, defensive: null, maneuver: null };
  updateUI();
}

function removeUnit(id) {
  delete currentList[id];
  updateUI();

  if (document.getElementById("otsModal").classList.contains("active")) {
    renderOtsModalList();
  }
}

function generateSimpleText() {
  const cap = parseInt(document.getElementById("armyCap").value) || 0;
  const faction = REGIMENT_DATA.factions.find((f) => f.id === selectedFactionId);
  let text = `Faction: ${faction.name}\nCommand Value: ${faction.command_value}\nPoints Cap: ${cap}\n\n`;

  let total = 0;
  let leaderText = "";
  let unitsText = "";
  let otsText = "";

  for (const [id, qty] of Object.entries(currentList)) {
    const unit = faction.units.find((u) => u.id === id);
    const ots = REGIMENT_DATA.ots.find((o) => o.id === id);
    const leader = faction.leaders ? faction.leaders.find((l) => l.id === id) : null;

    if (leader && qty > 0) {
      const cost = qty * leader.cost;
      leaderText += `${qty}x ${leader.name} [${leader.cost} pts]\n`;
      total += cost;
    } else if (unit && qty > 0) {
      const cost = qty * unit.cost;
      unitsText += `${qty}x ${unit.name} [${unit.cost} ea | ${cost} pts]\n`;
      total += cost;
    } else if (ots && qty > 0) {
      const cost = qty * ots.cost;
      otsText += `${qty}x ${ots.name} [${ots.cost} ea | ${cost} pts]\n`;
      total += cost;
    }
  }

  if (leaderText) text += `ARMY LEADER\n${leaderText}\n`;
  if (unitsText) text += `COMBAT UNITS\n${unitsText}\n`;
  if (otsText) text += `SUPPORT ASSETS\n${otsText}\n`;

  let missionText = `MISSIONS\n`;
  ["aggressive", "defensive", "maneuver"].forEach((cat) => {
    const msnId = currentMissions[cat];
    if (msnId && REGIMENT_DATA.missions[cat]) {
      const msn = REGIMENT_DATA.missions[cat].find((m) => m.id === msnId);
      missionText += `- ${cat.charAt(0).toUpperCase() + cat.slice(1)}: ${msn ? msn.name : "Error"}\n`;
    } else {
      missionText += `- ${cat.charAt(0).toUpperCase() + cat.slice(1)}: [None Selected]\n`;
    }
  });
  text += `${missionText}\n`;

  const bid = cap - total > 0 ? cap - total : 0;
  text += `TOTAL SPENT: ${total} | BID: ${bid}\n`;

  return text;
}

function generateDetailedText(showCode = true) {
  const cap = parseInt(document.getElementById("armyCap").value) || 0;
  const faction = REGIMENT_DATA.factions.find((f) => f.id === selectedFactionId);
  let text = `Faction: ${faction.name}\nCommand Value: ${faction.command_value}\nPoints Cap: ${cap}\n\n`;

  let total = 0;
  let leaderText = "";
  let unitsText = "";
  let otsText = "";
  let usedKeywords = new Set();

  for (const [id, qty] of Object.entries(currentList)) {
    const unit = faction.units.find((u) => u.id === id);
    const ots = REGIMENT_DATA.ots.find((o) => o.id === id);
    const leader = faction.leaders ? faction.leaders.find((l) => l.id === id) : null;

    if (leader && qty > 0) {
      const cost = qty * leader.cost;
      leaderText += `${qty}x ${leader.name} [${leader.cost} pts]\n`;
      leaderText += `    Restriction: ${leader.restriction_text || "None"}\n`;
      leaderText += `    Ability: ${leader.ability}\n\n`;
      total += cost;
    } else if (unit && qty > 0) {
      const cost = qty * unit.cost;
      unitsText += `${qty}x ${unit.name} [${unit.cost} ea | ${cost} pts]\n`;
      unitsText += `    Mv: ${formatStat(unit.mv, unit.mv_min, '"')} | Attack Dice: ${formatStat(unit.atk_ranged, unit.atk_melee)} | Rng: ${formatStat(unit.rng_short, unit.rng_long, '"')} | Wnd: ${unit.wnd} | Sv: ${unit.sv} | Crg: ${unit.courage}\n`;
      if (unit.keywords && unit.keywords.length > 0) {
        unitsText += `    Keywords: ${unit.keywords.join(", ")}\n`;
        unit.keywords.forEach((kw) => usedKeywords.add(kw));
      }
      unitsText += `\n`;
      total += cost;
    } else if (ots && qty > 0) {
      const cost = qty * ots.cost;
      otsText += `${qty}x ${ots.name} [${ots.cost} ea | ${cost} pts]\n`;
      otsText += `    Avail: ${ots.availability} | Shape: ${ots.shape}\n`;

      if (ots.details && ots.details.attack_dice) {
        const toHit = ots.details.to_hit ? ` | Attack To-Hit: ${ots.details.to_hit}` : "";
        otsText += `    Attack Dice: ${ots.details.attack_dice}${toHit}\n`;
      }
      otsText += `    Ability: ${ots.ability_text}\n`;

      if (ots.modifier_keywords && ots.modifier_keywords.length > 0) {
        otsText += `    Keywords: ${ots.modifier_keywords.join(", ")}\n`;
        ots.modifier_keywords.forEach((kw) => usedKeywords.add(kw));
      }
      otsText += `\n`;
      total += cost;
    }
  }

  if (leaderText) text += `ARMY LEADER\n${leaderText}`;
  if (unitsText) text += `COMBAT UNITS\n${unitsText}`;
  if (otsText) text += `SUPPORT ASSETS\n${otsText}`;

  if (usedKeywords.size > 0) {
    text += `KEYWORD DEFINITIONS\n`;
    usedKeywords.forEach((kw) => {
      const entry = REGIMENT_DATA.definitions[kw];
      const def = entry ? entry.desc : "[Definition Pending]";
      text += `- ${kw.toUpperCase()}: ${def}\n`;
    });
    text += `\n`;
  }

  let missionText = `MISSIONS\n`;
  ["aggressive", "defensive", "maneuver"].forEach((cat) => {
    const msnId = currentMissions[cat];
    if (msnId && REGIMENT_DATA.missions[cat]) {
      const msn = REGIMENT_DATA.missions[cat].find((m) => m.id === msnId);
      missionText += `- ${cat.charAt(0).toUpperCase() + cat.slice(1)}: ${msn ? msn.name : "Error"}\n`;
    } else {
      missionText += `- ${cat.charAt(0).toUpperCase() + cat.slice(1)}: [None Selected]\n`;
    }
  });
  text += `${missionText}\n`;

  const bid = cap - total > 0 ? cap - total : 0;
  text += `TOTAL SPENT: ${total} | BID: ${bid}\n`;

  // Wrap the share code block in this IF statement
  if (showCode) {
    const listState = { f: selectedFactionId, c: cap, l: currentList, m: currentMissions };
    const shareCode = btoa(JSON.stringify(listState));
    text += `\nSHARE CODE: ${shareCode}\n`;
  }

  return text;
}

function copyToClipboard(text, btnId) {
  const btn = document.getElementById(btnId);
  const originalText = btn.textContent;

  navigator.clipboard
    .writeText(text)
    .then(() => {
      btn.textContent = "Copied!";
      btn.classList.add("btn-success"); // Optional: add a green class in CSS

      setTimeout(() => {
        btn.textContent = originalText;
        btn.classList.remove("btn-success");
      }, 2000);
    })
    .catch((err) => {
      console.error("Failed to copy text: ", err);
    });
}

function generateTTSJSON() {
  const faction = REGIMENT_DATA.factions.find((f) => f.id === selectedFactionId);
  const cap = parseInt(document.getElementById("armyCap").value) || 0;

  const output = {
    metadata: {
      faction_id: faction.id,
      faction_name: faction.name,
      points_cap: cap,
      total_points: 0,
      bid: 0,
    },
    leader: null,
    missions: [],
    units: [],
    ots: [],
  };

  let totalSpent = 0;

  for (const [id, qty] of Object.entries(currentList)) {
    const unit = faction.units.find((u) => u.id === id);
    const ots = REGIMENT_DATA.ots.find((o) => o.id === id);
    const leader = faction.leaders ? faction.leaders.find((l) => l.id === id) : null;

    if (leader && qty > 0) {
      output.leader = {
        id: leader.id,
        name: leader.name,
        cost: leader.cost,
        restriction_text: leader.restriction_text,
        ability: leader.ability,
        tts_image: leader.tts_image,
        tts_card_front: leader.tts_card_front,
        tts_model: leader.tts_model,
        tts_texture: leader.tts_texture,
        tts_collider: leader.tts_collider,
      };
      totalSpent += leader.cost;
    } else if (unit && qty > 0) {
      output.units.push({
        id: unit.id,
        name: unit.name,
        quantity: qty,
        unit_size: unit.unit_size,
        cost: unit.cost,
        mv: unit.mv,
        mv_min: unit.mv_min || null,
        atk_ranged: unit.atk_ranged,
        atk_melee: unit.atk_melee,
        rng_short: unit.rng_short,
        rng_long: unit.rng_long,
        wnd: unit.wnd,
        sv: unit.sv,
        courage: unit.courage,
        keywords: unit.keywords,
        tts_height: unit.tts_height || 1.0,
        tts_model: unit.tts_model,
        tts_texture: unit.tts_texture,
        tts_collider: unit.tts_collider,
      });
      totalSpent += qty * unit.cost;
    } else if (ots && qty > 0) {
      output.ots.push({
        name: ots.name,
        quantity: qty,
        cost: ots.cost,
        category: ots.category,
        availability: ots.availability,
        shape: ots.shape,
        duration: ots.duration,
        modifier_keywords: ots.modifier_keywords,
        ability_text: ots.ability_text,
        tts_card_front: ots.tts_card_front || "",
      });
      totalSpent += qty * ots.cost;
    }
  }

  ["aggressive", "defensive", "maneuver"].forEach((cat) => {
    const msnId = currentMissions[cat];
    if (msnId && REGIMENT_DATA.missions[cat]) {
      const msn = REGIMENT_DATA.missions[cat].find((m) => m.id === msnId);
      if (msn) {
        output.missions.push({
          category: cat,
          id: msn.id,
          name: msn.name,
          setup: msn.setup,
          scoring: msn.scoring,
          victory: msn.victory,
          special_rules: msn.special_rules,
          tts_card_front: msn.tts_card_front,
        });
      }
    }
  });

  output.metadata.total_points = totalSpent;
  output.metadata.bid = Math.max(0, cap - totalSpent);

  return JSON.stringify(output, null, 2);
}

function generateShareCode() {
  const cap = document.getElementById("armyCap").value;
  const listState = {
    f: selectedFactionId,
    c: cap,
    l: currentList,
    m: currentMissions,
  };
  copyToClipboard(btoa(JSON.stringify(listState)), "btnCopyCode");
}

function loadFromShareCode(base64Code) {
  try {
    const jsonStr = atob(base64Code);
    const listState = JSON.parse(jsonStr);

    document.getElementById("armyCap").value = listState.c || 1000;

    currentMissions = listState.m || { aggressive: null, defensive: null, maneuver: null };

    loadBuilderView(listState.f, listState.l);
    document.getElementById("shareCodeInput").value = "";
  } catch (e) {
    alert("Invalid share code. Please check the code and try again.");
    console.error("Failed to parse share code:", e);
  }
}

function saveState() {
  const state = {
    cap: document.getElementById("armyCap").value,
    factionId: selectedFactionId,
    roster: currentList,
    missions: currentMissions, // Save missions
    lastUpdated: Date.now(),
  };
  localStorage.setItem("regimentBuilderState", JSON.stringify(state));
}

function loadState() {
  const saved = localStorage.getItem("regimentBuilderState");
  if (saved) {
    try {
      const state = JSON.parse(saved);
      const now = Date.now();
      if (state.lastUpdated && now - state.lastUpdated > 30 * 60 * 1000) {
        localStorage.removeItem("regimentBuilderState");
        return false;
      }
      document.getElementById("armyCap").value = state.cap;
      selectedFactionId = state.factionId;
      currentList = state.roster || {};
      currentMissions = state.missions || { aggressive: null, defensive: null, maneuver: null }; // Load missions
      return true;
    } catch (e) {
      return false;
    }
  }
  return false;
}

function printDetailedList() {
  const text = generateDetailedText(false);

  const printWindow = window.open("", "", "height=800,width=800");

  printWindow.document.write("<html><head><title>Regiment Army Manifest</title>");
  printWindow.document.write("<style>body { font-family: monospace; font-size: 14px; white-space: pre-wrap; padding: 20px; }</style>");
  printWindow.document.write("</head><body>");
  printWindow.document.write(text);
  printWindow.document.write("</body></html>");

  printWindow.document.close();
  printWindow.focus();

  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
}

function openMissionModal(category) {
  const modal = document.getElementById("missionModal");
  const title = document.getElementById("missionModalTitle");
  const list = document.getElementById("missionModalList");

  title.textContent = `Select ${category.charAt(0).toUpperCase() + category.slice(1)} Mission`;
  list.innerHTML = "";

  if (!REGIMENT_DATA || !REGIMENT_DATA.missions || !REGIMENT_DATA.missions[category]) return;

  let selectedMissionData = null;

  list.innerHTML += `
      <div class="roster-row" style="cursor: pointer;" onclick="selectMission('${category}', null)">
          <div class="row-info"><div class="unit-name" style="color: var(--danger);">[Clear Selection]</div></div>
      </div>
  `;

  REGIMENT_DATA.missions[category].forEach((msn) => {
    const isSelected = currentMissions[category] === msn.id;
    if (isSelected) selectedMissionData = msn;

    list.innerHTML += `
          <div class="roster-row" style="cursor: pointer; ${isSelected ? "border-color: var(--accent);" : ""}" onclick="selectMission('${category}', '${msn.id}')">
              <div class="row-info">
                  <div class="unit-name" style="${isSelected ? "color: var(--accent);" : ""}">${msn.name} ${isSelected ? "✓" : ""}</div>
                  <div class="unit-stats" style="white-space: normal; background: transparent; padding: 0; margin-top: 4px;">${msn.desc}</div>
              </div>
              <div class="row-controls">
                  <button class="btn-step btn-preview-eye" title="Preview Card" 
                          onclick="event.stopPropagation(); previewMissionCard('${category}', '${msn.id}')">
                      👁️
                  </button>
              </div>
          </div>
      `;
  });

  if (selectedMissionData) {
    previewMissionCard(category, selectedMissionData.id);
  } else {
    previewMissionCard(null, null); // Show placeholder
  }

  modal.classList.add("active");

  // Load the initial preview of the currently selected mission
  if (selectedMissionData) {
    previewMissionCard(selectedMissionData.tts_card_front, selectedMissionData.id);
  } else {
    previewMissionCard("", ""); // Show placeholder
  }

  modal.classList.add("active");
}

function previewMissionCard(category, missionId) {
  const container = document.getElementById("missionPreviewContainer");

  if (!missionId || !category) {
    container.innerHTML = `
      <div class="mission-card-placeholder" style="flex: 1;">
        <div class="placeholder-content">
          <span class="placeholder-icon">🎴</span>
          <h3>Mission Preview</h3>
          <p>Select a mission or click the 👁️ icon to view the details and deployment map.</p>
        </div>
      </div>
    `;
    return;
  }

  const msn = REGIMENT_DATA.missions[category].find((m) => m.id === missionId);
  if (!msn) return;

  const remoteCardUrl = msn.tts_card_front || "";
  const remoteMapUrl = msn.deployment_map || "";

  const localCardPath = `cards/mission/${missionId}.webp`;
  const localMapPath = `cards/map/${missionId}.webp`;

  // 1. Build the Text View (Default)
  const textViewHtml = `
    <div id="msnTextView" style="width: 100%; display: flex; flex-direction: column; gap: 15px;">
      <h3 style="color: var(--accent); margin: 0; font-size: 1.4rem; text-transform: uppercase; border-bottom: 2px solid var(--border-color); padding-bottom: 8px;">${msn.name}</h3>
      <div style="font-style: italic; color: var(--text-muted); font-size: 0.95rem;">${msn.desc}</div>
      
      ${msn.setup ? `<div><strong style="color: var(--text-main);">Setup:</strong><br><span style="color: var(--text-muted); font-size: 0.9rem;">${msn.setup}</span></div>` : ""}
      ${msn.scoring ? `<div><strong style="color: var(--text-main);">Scoring:</strong><br><span style="color: var(--text-muted); font-size: 0.9rem;">${msn.scoring}</span></div>` : ""}
      ${msn.victory ? `<div><strong style="color: var(--text-main);">Victory:</strong><br><span style="color: var(--text-muted); font-size: 0.9rem;">${msn.victory}</span></div>` : ""}
      ${msn.special_rules ? `<div><strong style="color: var(--text-main);">Special Rules:</strong><br><span style="color: var(--text-muted); font-size: 0.9rem;">${msn.special_rules}</span></div>` : ""}
      
      <img src="${localMapPath}" 
           class="deployment-map-img" 
           alt="Deployment Map" 
           onerror="this.onerror=null; this.referrerPolicy='no-referrer'; this.src='${remoteMapUrl}'; this.onerror=function(){this.style.display='none';};">
    </div>
  `;

  // 2. Build the Card View (Hidden by default)
  const cardViewHtml = `
    <div id="msnCardView" style="display: none; width: 100%; flex-direction: column; align-items: center;">
      <img id="dynamicCardImg" src="${localCardPath}" class="mission-card-img" style="display: block;" alt="Mission Card">
      <div id="dynamicCardPlaceholder" class="mission-card-placeholder" style="display: none;">
        <div class="placeholder-content">
          <span class="placeholder-icon">🎴</span>
          <h3>Image Not Found</h3>
          <p>Could not load card preview for ${missionId}.</p>
        </div>
      </div>
    </div>
  `;

  container.innerHTML = `
    <div class="mission-preview-header">
      <button class="btn-toggle-view" id="btnToggleMissionView" onclick="toggleMissionView()">Switch to Card View</button>
    </div>
    ${textViewHtml}
    ${cardViewHtml}
  `;

  // 3. Handle Failover for the Card View Image
  const imgEl = document.getElementById("dynamicCardImg");
  const placeholder = document.getElementById("dynamicCardPlaceholder");

  imgEl.onerror = () => {
    if (remoteCardUrl.trim() !== "") {
      imgEl.referrerPolicy = "no-referrer";
      imgEl.onerror = () => {
        imgEl.style.display = "none";
        placeholder.style.display = "flex";
      };
      imgEl.src = remoteCardUrl;
    } else {
      imgEl.style.display = "none";
      placeholder.style.display = "flex";
      placeholder.querySelector("h3").textContent = "No Image Available";
      placeholder.querySelector("p").textContent = "This mission does not have a preview card assigned yet.";
    }
  };
}

// Global Toggle Function for the Button
function toggleMissionView() {
  const btn = document.getElementById("btnToggleMissionView");
  const textView = document.getElementById("msnTextView");
  const cardView = document.getElementById("msnCardView");

  if (textView.style.display === "none") {
    textView.style.display = "flex";
    cardView.style.display = "none";
    btn.textContent = "Switch to Card View";
  } else {
    textView.style.display = "none";
    cardView.style.display = "flex";
    btn.textContent = "Switch to Text View";
  }
}

function closeMissionModal() {
  document.getElementById("missionModal").classList.remove("active");
}

function selectMission(category, id) {
  currentMissions[category] = id;
  closeMissionModal();
  updateUI();
}

function openOtsModal() {
  const catSelect = document.getElementById("otsCategoryFilter");
  const categories = new Set(REGIMENT_DATA.ots.map((o) => o.category).filter(Boolean));

  const currentVal = catSelect.value;
  let catOptions = `<option value="All">All Categories</option>`;
  categories.forEach((c) => (catOptions += `<option value="${c}">${c}</option>`));
  catSelect.innerHTML = catOptions;
  if (categories.has(currentVal)) catSelect.value = currentVal;

  renderOtsModalList();
  document.getElementById("otsModal").classList.add("active");
}

function closeOtsModal() {
  document.getElementById("otsModal").classList.remove("active");
}

function adjustOts(id, amt) {
  adjust(id, amt);
  renderOtsModalList();
}

function renderOtsModalList() {
  const list = document.getElementById("otsModalList");
  const search = document.getElementById("otsSearch").value.toLowerCase();
  const category = document.getElementById("otsCategoryFilter").value;
  const sort = document.getElementById("otsSortFilter").value;

  const cap = parseInt(document.getElementById("armyCap").value) || 0;
  const maxOtsPoints = Math.floor(cap * 0.15);
  const maxOtsCards = Math.floor(cap / 250);
  const isOverride = document.getElementById("overrideToggle").checked;

  let otsSpent = 0;
  let otsCards = 0;
  REGIMENT_DATA.ots.forEach((o) => {
    const qty = currentList[o.id] || 0;
    otsSpent += qty * o.cost;
    otsCards += qty;
  });

  let filteredOts = [...REGIMENT_DATA.ots];

  if (category !== "All") filteredOts = filteredOts.filter((o) => o.category === category);

  if (search) {
    filteredOts = filteredOts.filter(
      (o) => o.name.toLowerCase().includes(search) || (o.modifier_keywords && o.modifier_keywords.join(" ").toLowerCase().includes(search)),
    );
  }

  if (sort === "cost-high") filteredOts.sort((a, b) => b.cost - a.cost);
  if (sort === "cost-low") filteredOts.sort((a, b) => a.cost - b.cost);
  if (sort === "alpha") filteredOts.sort((a, b) => a.name.localeCompare(b.name));

  list.innerHTML = "";

  filteredOts.forEach((o) => {
    const qty = currentList[o.id] || 0;
    const disableAdd = !isOverride && (otsSpent + o.cost > maxOtsPoints || otsCards + 1 > maxOtsCards);

    let detailsString = "";
    if (o.details && o.details.attack_dice) {
      const toHit = o.details.to_hit ? ` | Attack To-Hit: ${o.details.to_hit}` : "";
      detailsString = ` | Attack Dice: ${o.details.attack_dice}${toHit}`;
    }

    list.innerHTML += `
      <div class="roster-row" style="${qty > 0 ? "border-color: var(--accent);" : ""}">
          <div class="row-info">
              <div class="unit-name" style="${qty > 0 ? "color: var(--accent);" : ""}">${o.name}</div>
              <div class="unit-type" style="margin-bottom: 8px;">${o.category || "Support"}</div>
              
              <div style="font-size: 1rem; margin-bottom: 12px; color: var(--text-main); line-height: 1.5; padding-left: 12px; border-left: 3px solid var(--border-color);">
                  ${o.ability_text}
              </div>
              
              <div class="unit-stats" style="margin-bottom: 8px;">
                  Avail: ${o.availability} | Shape: ${o.shape}${detailsString}
              </div>
              
              <div class="unit-keywords">${o.modifier_keywords && o.modifier_keywords.length > 0 ? o.modifier_keywords.join(", ") : ""}</div>
          </div>
          <div class="row-controls">
              <div class="cost-limit"><span class="cost">${o.cost} pts</span></div>
              <div class="stepper">
                  <button class="btn-step" onclick="adjustOts('${o.id}', -1)">-</button>
                  <span class="qty">${qty}</span>
                  <button class="btn-step" onclick="adjustOts('${o.id}', 1)" ${disableAdd ? "disabled" : ""}>+</button>
              </div>
          </div>
      </div>
    `;
  });
}

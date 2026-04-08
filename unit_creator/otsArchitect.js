class OTSArchitect {
  constructor() {
    this.availMap = { "3+": 1.0, "4+": 0.95, "5+": 0.85, "6+": 0.75, "7+": 0.6, "8+": 0.45, "9+": 0.3 };
    this.selectedOtsId = null;
    this.activeMetadata = {
      tts_card_front: "",
    };

    // Standard Shape Map (For Sustainment, Defensive, Utility)
    this.shapeMap = {
      "Single Base": 0.6,
      "Single Unit": 0.8,
      "Point (Standard Card)": 1.0,
      "Double Card (Long)": 1.4,
      "Double Card (Wide)": 1.4,
      'Aura (6" Radius)': 1.75,
      'Aura (8" Radius)': 2.0,
      'Aura (12" Radius)': 2.5,
      "Entire Board": 4.0,
      "Off-Board / Meta": 1.0,
    };

    // Punishing Shape Map (Strictly for Offensive AoE)
    this.offShapeMap = {
      "Single Base": 0.8,
      "Single Unit": 0.8,
      "Point (Standard Card)": 1.0,
      "Double Card (Long)": 1.8,
      "Double Card (Wide)": 1.8,
      'Aura (6" Radius)': 2.5,
      'Aura (8" Radius)': 3.0,
      'Aura (12" Radius)': 4.0,
      "Entire Board": 5.0,
      "Off-Board / Meta": 1.0,
    };

    this.durationMap = { "Instant / Next Act": 1.0, "1 Round": 1.25, Permanent: 1.5 };

    // Bumped Offensive Scalar to 10
    this.scalarMap = { Offensive: 10, Sustainment: 10, Defensive: 12, Utility: 6 };
    this.viewMode = "json";
  }

  open() {
    document.getElementById("otsModal").style.display = "flex";
    this.populateKeywords();
    this.switchCategory();
    this.viewMode = "json";
    this.update();
  }

  close() {
    document.getElementById("otsModal").style.display = "none";
  }

  reset() {
    this.activeMetadata = { tts_card_front: "" };

    // Global Fields
    document.getElementById("otsName").value = "New Support Request";
    document.getElementById("otsOverrideId").value = "";
    document.getElementById("otsOverridePts").value = "0";
    document.getElementById("otsAbility").value = "";

    // Deployment Settings
    document.getElementById("otsCategory").value = "Offensive";
    document.getElementById("otsAvail").value = "4+";
    document.getElementById("otsShape").value = "Point (Standard Card)";
    document.getElementById("otsDuration").value = "Instant / Next Act";

    // Offensive Panel
    document.getElementById("offDice").value = "3";

    // Sustainment Panel
    document.getElementById("susClass").value = "Infantry/Emplacement";
    document.getElementById("susWounds").value = "0";
    document.getElementById("susShaken").checked = false;
    document.getElementById("susCourage").checked = false;

    // Defensive Panel
    document.getElementById("defTerrain").value = "None";
    document.getElementById("defEwHit").value = "0";
    document.getElementById("defEwCv").value = "0";

    // Utility Panel
    document.getElementById("utiIntelType").value = "None";
    document.getElementById("utiIntelVal").value = "0";
    document.getElementById("utiPsychCourage").value = "0";
    document.getElementById("utiShakenPenalty").value = "0";

    // Modifier Keywords
    const checkboxes = document.querySelectorAll(".ots-kw-checkbox");
    checkboxes.forEach((cb) => (cb.checked = false));

    // Reinitialize UI
    this.switchCategory();
    this.viewMode = "json";
    this.update();
  }

  switchCategory() {
    const panels = ["panelOffensive", "panelSustainment", "panelDefensive", "panelUtility"];
    panels.forEach((p) => {
      const el = document.getElementById(p);
      if (el) el.style.display = "none";
    });

    const category = document.getElementById("otsCategory").value;
    const activePanel = document.getElementById(`panel${category}`);
    if (activePanel) activePanel.style.display = "block";

    this.update();
  }

  populateKeywords() {
    const container = document.getElementById("otsKeywordList");
    if (!container) return;

    const allKeywords = Object.keys(ui.keywordsDb).sort();

    container.innerHTML = allKeywords
      .map((kw) => {
        const safeId = kw.replace(/ /g, "_");
        return `
        <div class="kw-item">
          <input type="checkbox" id="ots_kw_${safeId}" value="${kw}" class="ots-kw-checkbox" onchange="otsArchitect.update()">
          <label for="ots_kw_${safeId}">${kw}</label>
        </div>`;
      })
      .join("");
  }

  calculate() {
    const category = document.getElementById("otsCategory").value;
    const avail = document.getElementById("otsAvail").value;
    const shape = document.getElementById("otsShape").value;
    const duration = document.getElementById("otsDuration").value;

    const omAv = this.availMap[avail] || 0.85;
    const omDur = this.durationMap[duration] || 1.0;
    const scalar = this.scalarMap[category];

    // Apply Offensive Shape Map if category is Offensive
    const omShape = category === "Offensive" ? this.offShapeMap[shape] || 1.0 : this.shapeMap[shape] || 1.0;

    let baseMag = 0;
    let payloadLog = "";
    let payloadDetails = {};
    let classMod = 1.0;

    // --- 1. CORE PAYLOAD MAGNITUDE ---
    if (category === "Offensive") {
      const rawDice = parseInt(document.getElementById("offDice").value) || 0;

      // Progressive Overwhelming Fire Logic
      if (rawDice <= 3) {
        baseMag = rawDice * 1.0;
        payloadLog = `   - Attack Dice: ${rawDice} (Linear Mag: ${baseMag.toFixed(2)})\n`;
      } else {
        baseMag = 3.0 + (rawDice - 3) * 1.5;
        payloadLog = `   - Attack Dice: ${rawDice} (Progressive Mag: 3 + ${(rawDice - 3) * 1.5} = ${baseMag.toFixed(2)})\n`;
      }
      payloadDetails = { attack_dice: rawDice, progressive_mag: baseMag };
    } else if (category === "Sustainment") {
      const wnds = parseInt(document.getElementById("susWounds").value) || 0;
      const shaken = document.getElementById("susShaken").checked ? 2 : 0;
      const courage = document.getElementById("susCourage").checked ? 1 : 0;
      const targetClass = document.getElementById("susClass").value;
      classMod = targetClass === "Vehicle/Titan" ? 1.25 : 1.0;
      baseMag = wnds + shaken + courage;
      payloadLog = `   - Wounds: ${wnds} | Shaken Clear: ${shaken} | Courage Resist: ${courage}\n`;
      payloadLog += `   - Class Multiplier (${targetClass}): ${classMod.toFixed(2)}x\n`;
      payloadDetails = {
        wounds_restored: wnds,
        clear_shaken: document.getElementById("susShaken").checked,
        courage_resist: document.getElementById("susCourage").checked,
        target_class: targetClass,
      };
    } else if (category === "Defensive") {
      const terrain = document.getElementById("defTerrain").value;
      const ewHit = parseInt(document.getElementById("defEwHit").value) || 0;
      const ewCv = parseInt(document.getElementById("defEwCv").value) || 0;
      const terrainMags = { None: 0, Difficult: 1, Area: 2, Blocking: 3, Dangerous: 5 };
      baseMag = (terrainMags[terrain] || 0) + ewHit + ewCv;
      payloadLog = `   - Terrain (${terrain}): ${terrainMags[terrain] || 0} | EW Hit Pen: ${ewHit} | EW CV Pen: ${ewCv}\n`;
      payloadDetails = { terrain_tier: terrain, ew_hit_penalty: ewHit, ew_cv_penalty: ewCv };
    } else if (category === "Utility") {
      const intel = parseInt(document.getElementById("utiIntelVal").value) || 0;
      const psych = parseInt(document.getElementById("utiPsychCourage").value) || 0;
      const shaken = parseInt(document.getElementById("utiShakenPenalty").value) || 0;
      const itype = document.getElementById("utiIntelType").value;
      const intelMag = itype === "Reveal Support" ? intel * 2 : itype === "Target Uplink" ? intel * 3 : 0;
      baseMag = intelMag + psych + (shaken > 0 ? 4 + shaken : 0);
      payloadLog = `   - Intel (${itype}): ${intelMag} | Psych: ${psych} | Shaken Pen: ${shaken > 0 ? 4 + shaken : 0}\n`;
      payloadDetails = { intel_type: itype, intel_value: intel, courage_penalty: psych, shaken_penalty: shaken };
    }

    // --- 2. EVALUATE KEYWORDS ---
    let kwTotalMult = 1.0;
    let kwTotalFlat = 0;
    let modKwLog = "";
    const activeNames = Array.from(document.querySelectorAll(".ots-kw-checkbox:checked")).map((cb) => cb.value);

    const formulaContext = { atk_r: Math.max(baseMag, 3), rng_l: 12, bases: 1, wnd: 1, om_save: 1.0, om_move: 1.0, courage: 3 };

    activeNames.forEach((kwName) => {
      const kw = ui.keywordsDb[kwName];
      if (!kw) return;

      let val = kw.logic.bal_val || 1.0;

      if (kw.logic.bal_type === "formula") {
        try {
          const func = new Function(...Object.keys(formulaContext), `return ${kw.logic.bal_formula};`);
          val = func(...Object.values(formulaContext));
        } catch (e) {
          val = 1.0;
        }
      }

      if (kw.logic.is_flat) {
        kwTotalFlat += val;
        modKwLog += `   - Modifier [${kwName}]: Flat +${val.toFixed(2)}\n`;
      } else {
        kwTotalMult *= val;
        modKwLog += `   - Modifier [${kwName}]: Mult x${val.toFixed(2)}\n`;
      }
    });

    // --- 3. DYNAMIC FLOOR LOGIC ---
    let finalMag = baseMag;
    let floorLog = "";

    if (kwTotalMult > 1.0 && baseMag < 2.5) {
      finalMag = 2.5;
      floorLog = `   - Buff Floor Applied: 2.50 Mag (Theoretical Target Density)\n`;
    } else if (baseMag < 0.5) {
      finalMag = 0.5;
      floorLog = `   - Logistics Floor Applied: 0.50 Mag\n`;
    }

    // --- 4. MATH EXECUTION ---
    const subtotal = scalar * finalMag * omShape * omDur * omAv * classMod;
    const finalRaw = subtotal * kwTotalMult + kwTotalFlat;
    const rounded = Math.ceil(finalRaw / 5) * 5;

    // --- 5. VERBOSE AUDIT LOG ---
    let log = `AUDIT LOG: ${document.getElementById("otsName").value.toUpperCase()}\n`;
    log += "=".repeat(50) + "\n";

    log += `1. PAYLOAD MAGNITUDE (TOTAL MAG: ${finalMag.toFixed(2)})\n`;
    log += payloadLog;
    if (floorLog) log += floorLog;

    log += `\n2. MULTIPLIER STACK\n`;
    log += `   - Category Scalar (${category}): ${scalar}\n`;
    log += `   - Targeting Shape (${shape}): ${omShape.toFixed(2)}x\n`;
    log += `   - Duration (${duration}): ${omDur.toFixed(2)}x\n`;
    log += `   - Availability (${avail}): ${omAv.toFixed(2)}x\n`;
    if (classMod !== 1.0) log += `   - Class Premium: ${classMod.toFixed(2)}x\n`;

    log += `\n3. MODIFIER KEYWORDS\n`;
    if (activeNames.length > 0) {
      log += modKwLog;
      log += `   - Total Multiplier: x${kwTotalMult.toFixed(2)}\n`;
      log += `   - Total Flat: +${kwTotalFlat.toFixed(2)}\n`;
    } else {
      log += `   - None\n`;
    }

    log += "\n" + "=".repeat(50) + "\n";
    log += `BASE POTENCY: ${scalar} * ${finalMag.toFixed(2)} * ${omShape.toFixed(2)} * ${omDur.toFixed(2)} * ${omAv.toFixed(2)} * ${classMod.toFixed(2)} = ${subtotal.toFixed(2)}\n`;
    log += `FINAL MATH: (${subtotal.toFixed(2)} * ${kwTotalMult.toFixed(2)}) + ${kwTotalFlat.toFixed(2)}\n`;
    log += `RAW TOTAL: ${finalRaw.toFixed(2)}\n`;
    log += `FINAL POINT COST: ${rounded} pts\n`;
    log += "=".repeat(50);

    return { cost: rounded, log: log, activeNames, category, avail, shape, duration, payloadDetails };
  }

  preview() {
    this.viewMode = "json";
    this.update();
  }

  generate() {
    this.viewMode = "log";
    this.update();
  }

  update() {
    const calcResult = this.calculate();
    const override = parseInt(document.getElementById("otsOverridePts").value) || 0;
    const displayCost = override > 0 ? override : calcResult.cost;

    document.getElementById("otsPointBadge").innerText = `${displayCost} PTS`;

    if (this.viewMode === "log") {
      document.getElementById("otsPreview").innerText = calcResult.log;
      return;
    }

    const name = document.getElementById("otsName").value;
    const overrideId = document.getElementById("otsOverrideId").value.trim();
    const finalId = overrideId || `ots_${name.toLowerCase().replace(/ /g, "_")}`;
    const abilityText = document.getElementById("otsAbility").value;

    const payload = {
      id: finalId,
      name: name,
      category: calcResult.category,
      cost: displayCost,
      availability: calcResult.avail,
      shape: calcResult.shape,
      duration: calcResult.duration,
      details: calcResult.payloadDetails,
      modifier_keywords: calcResult.activeNames,
      ability_text: abilityText,
      tts_card_front: this.activeMetadata.tts_card_front,
    };

    document.getElementById("otsPreview").innerText = JSON.stringify(payload, null, 4);
  }

  openLibrary() {
    document.getElementById("otsLibraryModal").style.display = "flex";
    this.selectedOtsId = null;
    document.getElementById("otsLibSearch").value = "";
    document.getElementById("otsLibCategoryFilter").value = "All";
    this.refreshLibraryTable();
  }

  closeLibrary() {
    document.getElementById("otsLibraryModal").style.display = "none";
  }

  getAllOts() {
    let otsList = [];
    const db = dataManager.data;
    if (!db) return otsList;

    // Support cards might be stored globally or nested in factions depending on your DB structure
    if (db.ots && Array.isArray(db.ots)) otsList = otsList.concat(db.ots);
    if (db.support_cards && Array.isArray(db.support_cards)) otsList = otsList.concat(db.support_cards);

    if (db.factions && Array.isArray(db.factions)) {
      db.factions.forEach((f) => {
        if (f.ots && Array.isArray(f.ots)) otsList = otsList.concat(f.ots);
        if (f.support_cards && Array.isArray(f.support_cards)) otsList = otsList.concat(f.support_cards);
      });
    }
    return otsList;
  }

  refreshLibraryTable() {
    const search = document.getElementById("otsLibSearch").value.toLowerCase();
    const catFilter = document.getElementById("otsLibCategoryFilter").value;
    const tbody = document.getElementById("otsLibTableBody");
    tbody.innerHTML = "";

    const otsList = this.getAllOts();

    const filtered = otsList.filter((ots) => {
      const matchesSearch = (ots.name && ots.name.toLowerCase().includes(search)) || (ots.id && ots.id.toLowerCase().includes(search));
      const matchesCat = catFilter === "All" || ots.category === catFilter;
      return matchesSearch && matchesCat;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 15px; color: var(--text-muted);">No supports found.</td></tr>`;
      return;
    }

    filtered.forEach((ots) => {
      const tr = document.createElement("tr");
      tr.style.cursor = "pointer";
      tr.onclick = () => this.selectRow(tr, ots.id);
      tr.innerHTML = `
        <td style="padding: 10px; border-bottom: 1px solid var(--border-light);">${ots.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid var(--border-light); color: var(--text-muted); font-size: 0.9rem;">${ots.category || "Unknown"}</td>
        <td style="padding: 10px; border-bottom: 1px solid var(--border-light); text-align: center; color: var(--color-orange); font-weight: bold;">${ots.cost || 0}</td>
        <td style="padding: 10px; border-bottom: 1px solid var(--border-light); color: var(--text-muted); font-size: 0.85rem;">${ots.id}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  selectRow(trElement, otsId) {
    const rows = document.querySelectorAll("#otsLibTableBody tr");
    rows.forEach((r) => (r.style.background = "transparent"));
    trElement.style.background = "rgba(255, 255, 255, 0.1)"; // Standard selected highlight
    this.selectedOtsId = otsId;
  }

  loadSelection() {
    if (!this.selectedOtsId) {
      alert("Please select a support card from the list first.");
      return;
    }
    const otsList = this.getAllOts();
    const selectedOts = otsList.find((o) => o.id === this.selectedOtsId);

    if (selectedOts) {
      this.loadOtsToUI(selectedOts);
      this.closeLibrary();
    }
  }

  loadOtsToUI(otsData) {
    // 1. Core Data
    document.getElementById("otsName").value = otsData.name || "Loaded Support";
    document.getElementById("otsOverrideId").value = otsData.id || "";
    document.getElementById("otsOverridePts").value = otsData.cost || 0;
    document.getElementById("otsAbility").value = otsData.ability_text || "";

    // 2. Selects
    document.getElementById("otsCategory").value = otsData.category || "Offensive";
    document.getElementById("otsAvail").value = otsData.availability || "4+";
    document.getElementById("otsShape").value = otsData.shape || "Point (Standard Card)";
    document.getElementById("otsDuration").value = otsData.duration || "Instant / Next Act";

    // 3. Force Category Switch to show correct panel
    this.switchCategory();

    // 4. Panel-Specific Data (Checking details object)
    if (otsData.details) {
      if (otsData.category === "Offensive") {
        document.getElementById("offDice").value = otsData.details.attack_dice || 3;
      } else if (otsData.category === "Sustainment") {
        document.getElementById("susClass").value = otsData.details.target_class || "Infantry/Emplacement";
        document.getElementById("susWounds").value = otsData.details.wounds_restored || 0;
        document.getElementById("susShaken").checked = !!otsData.details.clear_shaken;
        document.getElementById("susCourage").checked = !!otsData.details.courage_resist;
      } else if (otsData.category === "Defensive") {
        document.getElementById("defTerrain").value = otsData.details.terrain_tier || "None";
        document.getElementById("defEwHit").value = otsData.details.ew_hit_penalty || 0;
        document.getElementById("defEwCv").value = otsData.details.ew_cv_penalty || 0;
      } else if (otsData.category === "Utility") {
        document.getElementById("utiIntelType").value = otsData.details.intel_type || "None";
        document.getElementById("utiIntelVal").value = otsData.details.intel_value || 0;
        document.getElementById("utiPsychCourage").value = otsData.details.courage_penalty || 0;
        document.getElementById("utiShakenPenalty").value = otsData.details.shaken_penalty || 0;
      }
    }

    // 5. Modifier Keywords
    document.querySelectorAll(".ots-kw-checkbox").forEach((cb) => (cb.checked = false));
    if (otsData.modifier_keywords && Array.isArray(otsData.modifier_keywords)) {
      otsData.modifier_keywords.forEach((kw) => {
        const safeId = kw.replace(/ /g, "_");
        const cb = document.getElementById(`ots_kw_${safeId}`);
        if (cb) cb.checked = true;
      });
    }

    // 6. Hidden Metadata State (Card Fronts)
    this.activeMetadata.tts_card_front = otsData.tts_card_front || "";

    // 7. Recalculate and update UI
    this.update();
  }

  copyJSON() {
    this.viewMode = "json";
    this.update();
    const content = document.getElementById("otsPreview").innerText;

    try {
      const payload = JSON.parse(content);
      const db = dataManager.data;

      // Ensure the global OTS array exists
      if (!db.ots) {
        db.ots = [];
      }

      // Remove older version if overwriting, then push the new payload
      db.ots = db.ots.filter((o) => o.id !== payload.id);
      db.ots.push(payload);

      // Save to local session memory
      dataManager.saveFullDB(db);
    } catch (e) {
      console.error("Could not save support to local DB: ", e);
    }

    navigator.clipboard.writeText(content).then(() => {
      alert("Support JSON copied and saved to session library!");
    });
  }
}
const otsArchitect = new OTSArchitect();

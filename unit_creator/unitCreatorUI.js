class UnitCreatorUI {
  constructor() {
    this.factions = {
      "Rebel Alliance (6+)": "6+",
      "Galactic Empire (6+)": "6+",
      "Separatist Alliance (7+)": "7+",
      "Galactic Republic (5+)": "5+",
      "Gungan Grand Army (6+)": "6+",
    };

    this.init();
  }

  async init() {
    const db = await dataManager.initialize();
    this.keywordsDb = db.definitions || {};

    this.populateFactions();
    this.populateKeywords();
    this.toggleSubtype();
  }

  populateFactions() {
    const select = document.getElementById("factionSelect");
    select.innerHTML = Object.keys(this.factions)
      .map((f) => `<option value="${f}">${f}</option>`)
      .join("");
  }

  populateKeywords() {
    const container = document.getElementById("keywordList");
    if (!container) return;

    const sortedKeywords = Object.keys(this.keywordsDb).sort();

    if (sortedKeywords.length === 0) {
      container.innerHTML = `<div style="padding:10px; color:var(--text-muted); font-style:italic;">No keywords found in DB...</div>`;
      return;
    }

    container.innerHTML = sortedKeywords
      .map((kw) => {
        // Sanitize ID: replace spaces with underscores for safer DOM handling
        const safeId = kw.replace(/ /g, "_");
        return `
            <div class="kw-item">
                <input type="checkbox" id="kw_${safeId}" value="${kw}" class="kw-checkbox">
                <label for="kw_${safeId}">${kw}</label>
            </div>
        `;
      })
      .join("");
  }

  toggleSubtype() {
    const unitType = document.getElementById("unitType").value;
    const subTypeSelect = document.getElementById("subType");
    const isVehicleOrTitan = unitType === "Vehicle" || unitType === "Titan";
    subTypeSelect.disabled = !isVehicleOrTitan;
    if (subTypeSelect.disabled) subTypeSelect.value = "null";
  }

  getUiStats() {
    const factionName = document.getElementById("factionSelect").value;
    return {
      name: document.getElementById("unitName").value,
      type: document.getElementById("unitType").value,
      sub: document.getElementById("subType").value,
      cv: this.factions[factionName],
      bases: parseInt(document.getElementById("bases").value) || 0,
      wnd: parseInt(document.getElementById("wnd").value) || 0,
      mv: parseInt(document.getElementById("mv").value) || 0,
      mv_min: parseInt(document.getElementById("mv_min").value) || 0,
      sv: document.getElementById("sv").value,
      atk_r: parseInt(document.getElementById("atk_r").value) || 0,
      rng_s: parseInt(document.getElementById("rng_s").value) || 0,
      rng_l: parseInt(document.getElementById("rng_l").value) || 0,
      atk_m: parseInt(document.getElementById("atk_m").value) || 0,
    };
  }

  runCalc() {
    try {
      const stats = this.getUiStats();
      const activeKws = Array.from(document.querySelectorAll(".kw-checkbox:checked")).map((cb) => cb.value);
      const result = logicEngine.calculateUnitPoints(stats, activeKws, this.keywordsDb);

      const logElement = document.getElementById("outputLog");
      logElement.innerText = result.log;
      logElement.scrollTop = logElement.scrollHeight;

      return result.rounded;
    } catch (error) {
      document.getElementById("outputLog").innerText = `UI Error: ${error.message}`;
      return null;
    }
  }

  /**
   * Logic from builder.py: build_payload and get_final_cost
   */
  buildPayload(stats, calculatedCost) {
    const factionName = document.getElementById("factionSelect").value;
    const override = parseInt(document.getElementById("override").value) || 0;
    const finalPts = override > 0 ? override : calculatedCost;

    const prefixMap = {
      "Galactic Empire": "emp",
      "Rebel Alliance": "reb",
      "Galactic Republic": "rep",
      "Separatist Alliance": "sep",
      "Gungan Grand Army": "gun",
    };

    // Extract base faction name from label (e.g. "Rebel Alliance (6+)" -> "Rebel Alliance")
    const baseFaction = factionName.split(" (")[0];
    const prefix = prefixMap[baseFaction] || "unk";

    return {
      id: `${prefix}_${stats.name.toLowerCase().replace(/ /g, "_")}`,
      name: stats.name,
      unit_size: stats.bases,
      cost: finalPts,
      min_pct: 0,
      max_pct: 50,
      class: stats.type,
      subclass: stats.sub === "null" ? null : stats.sub,
      mv: stats.mv,
      mv_min: stats.mv_min > 0 ? stats.mv_min : null,
      atk_ranged: stats.atk_r,
      atk_melee: stats.atk_m,
      rng_short: stats.rng_s,
      rng_long: stats.rng_l,
      wnd: stats.wnd,
      sv: stats.sv,
      keywords: Array.from(document.querySelectorAll(".kw-checkbox:checked")).map((cb) => cb.value),
      tts_height: 1.0,
      tts_model: "",
      tts_texture: "",
      tts_collider: "",
    };
  }

  saveUnit() {
    const stats = this.getUiStats();
    const cost = this.runCalc();
    if (cost === null) return;

    // 1. Build the JSON object for the unit
    const payload = this.buildPayload(stats, cost);
    const db = dataManager.data;
    const factionName = document.getElementById("factionSelect").value;

    // 2. Update the local browser memory (so the Library works)
    const faction = db.factions.find((f) => f.name === factionName);
    if (faction) {
      faction.units = faction.units.filter((u) => u.id !== payload.id);
      faction.units.push(payload);
      dataManager.saveFullDB(db);
    }

    // 3. Convert to string and copy to clipboard
    const jsonString = JSON.stringify(payload, null, 4);
    navigator.clipboard
      .writeText(jsonString)
      .then(() => {
        // 4. Update the log to show the JSON (Preview)
        const logElement = document.getElementById("outputLog");
        logElement.innerText = "UNIT JSON COPIED TO CLIPBOARD:\n\n" + jsonString;

        alert(`'${payload.name}' unit JSON copied to clipboard.`);
      })
      .catch((err) => {
        console.error("Could not copy text: ", err);
      });
  }

  preview() {
    const stats = this.getUiStats();
    const cost = this.runCalc();
    if (cost === null) return;

    const payload = this.buildPayload(stats, cost);
    const logElement = document.getElementById("outputLog");
    logElement.innerText = JSON.stringify(payload, null, 4);
  }

  refresh() {
    dataManager.resetToSource().then(() => {
      window.location.reload();
    });
  }

  /**
   * Logic from builder.py: load_unit_to_ui
   */
  loadUnitToUI(unitData, factionName) {
    document.getElementById("unitName").value = unitData.name;

    // Select correct faction
    const factionSelect = document.getElementById("factionSelect");
    for (let i = 0; i < factionSelect.options.length; i++) {
      if (factionSelect.options[i].value.includes(factionName)) {
        factionSelect.selectedIndex = i;
        break;
      }
    }

    document.getElementById("unitType").value = unitData.class;
    this.toggleSubtype();
    if (unitData.subclass) {
      document.getElementById("subType").value = unitData.subclass;
    }

    document.getElementById("bases").value = unitData.unit_size;
    document.getElementById("wnd").value = unitData.wnd;
    document.getElementById("sv").value = unitData.sv;
    document.getElementById("mv").value = unitData.mv;
    document.getElementById("mv_min").value = unitData.mv_min || 0;
    document.getElementById("atk_r").value = unitData.atk_ranged;
    document.getElementById("rng_s").value = unitData.rng_short;
    document.getElementById("rng_l").value = unitData.rng_long;
    document.getElementById("atk_m").value = unitData.atk_melee || 0;
    document.getElementById("override").value = unitData.cost;

    // Reset and set keywords
    document.querySelectorAll(".kw-checkbox").forEach((cb) => (cb.checked = false));
    unitData.keywords.forEach((kw) => {
      const safeId = kw.replace(/ /g, "_"); // Match the sanitization used in populate
      const cb = document.getElementById(`kw_${safeId}`);
      if (cb) cb.checked = true;
    });

    this.runCalc();
  }

  openUnitLibrary() {
    library.open();
  }

  openKeywords() {
    architect.open();
  }

  openSimulator() {
    simulator.open();
  }
}

const ui = new UnitCreatorUI();

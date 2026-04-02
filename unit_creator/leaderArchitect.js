class LeaderArchitect {
  constructor() {
    this.baseCost = 30; // The fixed "Base Tax" for taking a leader slot
    this.viewMode = "json";
    this.selectedLeaderId = null; // Tracks the library selection
  }

  open() {
    document.getElementById("leaderModal").style.display = "flex";
    this.populateFactions();
    if (document.getElementById("ldrEffectsContainer").children.length === 0) {
      this.addEffect();
    }
    this.viewMode = "json";
    this.update();
  }

  close() {
    document.getElementById("leaderModal").style.display = "none";
  }

  populateFactions() {
    const select = document.getElementById("ldrFaction");
    if (!select) return;
    const factionKeys = Object.keys(ui.factions);
    select.innerHTML = factionKeys
      .map((f) => {
        let prefix = "unk";
        if (f.includes("Empire")) prefix = "emp";
        else if (f.includes("Rebel")) prefix = "reb";
        else if (f.includes("Republic")) prefix = "rep";
        else if (f.includes("Separatist")) prefix = "sep";
        else if (f.includes("Gungan")) prefix = "gun";
        return `<option value="${prefix}">${f}</option>`;
      })
      .join("");
  }

  addEffect() {
    const container = document.getElementById("ldrEffectsContainer");
    const rowId = `eff_${Date.now()}`;
    const rowHtml = `
      <div class="effect-row form-section" id="${rowId}" style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-light); margin-bottom: 10px; position: relative; padding: 15px;">
        <span class="close-btn" onclick="leaderArchitect.removeEffect('${rowId}')" style="position: absolute; right: 10px; top: 5px; font-size: 18px; cursor: pointer;">&times;</span>
        
        <div class="form-row" style="margin-bottom: 12px;">
            <label>Category</label>
            <select class="eff-cat" onchange="leaderArchitect.update()">
                <option value="stat_override">Stat & Rule Overrides (Physics)</option>
                <option value="action_econ">Action Economy (Time)</option>
                <option value="status_morale">Status & Morale (Attrition)</option>
                <option value="movement_maneuver">Movement & Maneuver</option>
                <option value="strategic_deploy">Strategic Deployment</option>
                <option value="casualty_attrition">Casualty & Reactionary</option>
                <option value="enemy_disruption">Enemy Disruption (Debuff)</option>
                <option value="meta_game">Meta-Game Manipulation</option>
            </select>
        </div>

        <div class="grid-2">
          <div class="form-col"><label>Potency (PV)</label>
            <select class="eff-pv" onchange="leaderArchitect.update()">
              <option value="10">Minimal (10) - Flavor/Ribbon</option>
              <option value="20">Low-Mid (20) - Standard Buff</option>
              <option value="30">Mid-High (30) - Strong Override</option>
              <option value="40">High (40) - Complex / Systemic</option>
              <option value="50">Legendary (50) - Game Defining</option>
            </select>
          </div>
          <div class="form-col"><label>Projection (PM)</label>
            <select class="eff-pm" onchange="leaderArchitect.update()">
              <option value="1.0">Attached / Self (1.0x)</option>
              <option value="1.2">Tight Aura 4" (1.2x)</option>
              <option value="1.5">Standard Aura 8" (1.5x)</option>
              <option value="1.8">Command Aura 12" (1.8x)</option>
              <option value="2.0">Global / Meta (2.0x)</option>
            </select>
          </div>
        </div>
        <div class="grid-2" style="margin-top: 8px;">
          <div class="form-col"><label>Frequency (FM)</label>
            <select class="eff-fm" onchange="leaderArchitect.update()">
              <option value="1.0">Passive / Always On (1.0x)</option>
              <option value="0.9">Once Per Turn (0.9x)</option>
              <option value="0.8">Phase-Limited (0.8x)</option>
              <option value="0.6">Triggered / Reactive (0.6x)</option>
              <option value="0.3">Once Per Game (0.3x)</option>
            </select>
          </div>
          <div class="form-col"><label>Risk Discount (RD)</label>
            <select class="eff-rd" onchange="leaderArchitect.update()">
              <option value="0">None (0 pts)</option>
              <option value="5">Minor Drawback (-5 pts)</option>
              <option value="12">Moderate Sacrifice (-12 pts)</option>
              <option value="20">Severe Sacrifice (-20 pts)</option>
            </select>
          </div>
        </div>
      </div>`;
    container.insertAdjacentHTML("beforeend", rowHtml);
    this.update();
    return rowId;
  }

  removeEffect(id) {
    document.getElementById(id).remove();
    this.update();
  }

  calculate() {
    let totalAbilityValue = 0;
    let log = "=== LEADER AUDIT LOG ===\n";
    log += `Base Tax: ${this.baseCost}\n`;

    const rows = document.querySelectorAll(".effect-row");
    rows.forEach((row, idx) => {
      const catSelect = row.querySelector(".eff-cat");
      const catName = catSelect.options[catSelect.selectedIndex].text;

      const pv = parseInt(row.querySelector(".eff-pv").value) || 0;
      const pm = parseFloat(row.querySelector(".eff-pm").value) || 1.0;
      const fm = parseFloat(row.querySelector(".eff-fm").value) || 1.0;
      const rd = parseInt(row.querySelector(".eff-rd").value) || 0;

      let effCost = pv * pm * fm - rd;
      effCost = Math.max(0, effCost);

      totalAbilityValue += effCost;
      log += `\nEffect ${idx + 1}: ${catName}\n`;
      log += `  Formula: (PV:${pv} * PM:${pm.toFixed(1)} * FM:${fm.toFixed(1)}) - Risk:${rd}\n`;
      log += `  Subtotal: +${effCost.toFixed(2)} pts\n`;
    });

    let friction = 1.0;
    const reqClass = document.getElementById("ldrReqClass").value;
    const reqSub = document.getElementById("ldrReqSub").value;
    const reqUnit = document.getElementById("ldrReqUnit").value.trim();

    if (reqUnit !== "") {
      friction = 0.7;
      log += `\nAttachment Friction: Specific Unit (${reqUnit}) -> x0.70\n`;
    } else if (reqSub !== "null") {
      friction = 0.8;
      log += `\nAttachment Friction: Subclass (${reqSub}) -> x0.80\n`;
    } else if (reqClass !== "null") {
      friction = 0.9;
      log += `\nAttachment Friction: Class (${reqClass}) -> x0.90\n`;
    } else {
      log += `\nAttachment Friction: Universal -> x1.00\n`;
    }

    const rawTotal = this.baseCost + totalAbilityValue * friction;
    const finalCost = Math.max(50, Math.ceil(rawTotal / 5) * 5);

    log += `------------------------\n`;
    log += `Raw Ability Sum: ${totalAbilityValue.toFixed(2)}\n`;
    log += `Final Mathematical Cost: ${this.baseCost} + (${totalAbilityValue.toFixed(2)} * ${friction.toFixed(2)}) = ${rawTotal.toFixed(2)}\n`;
    log += `Rounded Point Cost (Floor 50): ${finalCost}\n`;

    return { cost: finalCost, log: log };
  }

  update() {
    const calcResult = this.calculate();
    const override = parseInt(document.getElementById("ldrOverridePts").value) || 0;
    const displayCost = override > 0 ? override : calcResult.cost;

    document.getElementById("ldrPointBadge").innerText = `${displayCost} PTS`;

    if (this.viewMode === "log") {
      document.getElementById("ldrPreview").innerText = calcResult.log;
      return;
    }

    const name = document.getElementById("ldrName").value;
    const faction = document.getElementById("ldrFaction").value;
    const overrideId = document.getElementById("ldrOverrideId").value.trim();
    const finalId = overrideId || `ldr_${faction}_${name.toLowerCase().replace(/ /g, "_")}`;

    const rows = document.querySelectorAll(".effect-row");
    const logicStack = Array.from(rows).map((row) => ({
      category: row.querySelector(".eff-cat").value,
      potency_tier: parseInt(row.querySelector(".eff-pv").value),
      projection_multiplier: parseFloat(row.querySelector(".eff-pm").value),
      frequency_multiplier: parseFloat(row.querySelector(".eff-fm").value),
      risk_discount: parseInt(row.querySelector(".eff-rd").value),
    }));

    const reqUnitValue = document.getElementById("ldrReqUnit").value.trim();

    const payload = {
      id: finalId,
      name: name,
      cost: displayCost,
      restriction_text: document.getElementById("ldrRestrText").value,
      requires_class: document.getElementById("ldrReqClass").value === "null" ? null : document.getElementById("ldrReqClass").value,
      requires_subclass: document.getElementById("ldrReqSub").value === "null" ? null : document.getElementById("ldrReqSub").value,
      requires_unit: reqUnitValue === "" ? null : reqUnitValue,
      ability: document.getElementById("ldrAbility").value,
      logic: logicStack,
      tts_image: "",
    };

    document.getElementById("ldrPreview").innerText = JSON.stringify(payload, null, 4);
  }

  preview() {
    this.viewMode = "json";
    this.update();
  }

  generate() {
    this.viewMode = "log";
    this.update();
  }

  // --- LIBRARY MANAGEMENT --- //

  openLibrary() {
    document.getElementById("leaderLibraryModal").style.display = "flex";
    this.selectedLeaderId = null;

    // Reset filters when opening
    document.getElementById("ldrLibSearch").value = "";
    document.getElementById("ldrLibFactionFilter").value = "All";

    this.refreshLibraryTable();
  }

  closeLibrary() {
    document.getElementById("leaderLibraryModal").style.display = "none";
  }

  getAllLeaders() {
    let leaders = [];
    const db = dataManager.data;
    if (!db) return leaders;

    // Supports global leader array
    if (db.leaders && Array.isArray(db.leaders)) {
      leaders = leaders.concat(db.leaders);
    }

    // Supports nested faction leader array
    if (db.factions && Array.isArray(db.factions)) {
      db.factions.forEach((f) => {
        if (f.leaders && Array.isArray(f.leaders)) {
          leaders = leaders.concat(f.leaders);
        }
      });
    }

    return leaders;
  }

  refreshLibraryTable() {
    const search = document.getElementById("ldrLibSearch").value.toLowerCase();
    const factionFilter = document.getElementById("ldrLibFactionFilter").value;
    const tbody = document.getElementById("ldrLibTableBody");
    tbody.innerHTML = "";

    const leaders = this.getAllLeaders();

    // Map prefixes back to readable names for the table
    const prefixToName = {
      emp: "Galactic Empire",
      reb: "Rebel Alliance",
      rep: "Galactic Republic",
      sep: "Separatist Alliance",
      gun: "Gungan Grand Army",
    };

    const filtered = leaders.filter((ldr) => {
      // Extract prefix from ID (e.g., 'ldr_rep_kenobi' -> 'rep')
      const prefix = ldr.id ? ldr.id.split("_")[1] : "unk";

      const matchesSearch = (ldr.name && ldr.name.toLowerCase().includes(search)) || (ldr.id && ldr.id.toLowerCase().includes(search));

      const matchesFaction = factionFilter === "All" || prefix === factionFilter;

      return matchesSearch && matchesFaction;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">No leaders found matching criteria.</td></tr>`;
      return;
    }

    filtered.forEach((ldr) => {
      const prefix = ldr.id ? ldr.id.split("_")[1] : "unk";
      const factionDisplay = prefixToName[prefix] || "Unknown";

      const tr = document.createElement("tr");
      tr.onclick = () => this.selectRow(tr, ldr.id);
      tr.innerHTML = `
        <td>${ldr.name}</td>
        <td style="color: var(--text-muted); font-size: 0.9rem;">${factionDisplay}</td>
        <td style="text-align: center; color: var(--color-purple); font-weight: bold;">${ldr.cost || 0}</td>
        <td style="color: var(--text-muted); font-size: 0.85rem;">${ldr.id}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  selectRow(trElement, leaderId) {
    const rows = document.querySelectorAll("#ldrLibTableBody tr");
    rows.forEach((r) => r.classList.remove("selected-row"));
    trElement.classList.add("selected-row");
    this.selectedLeaderId = leaderId;
  }

  loadSelection() {
    if (!this.selectedLeaderId) {
      alert("Please select a leader from the list first.");
      return;
    }

    const leaders = this.getAllLeaders();
    const selectedLdr = leaders.find((l) => l.id === this.selectedLeaderId);

    if (selectedLdr) {
      this.loadLeaderToUI(selectedLdr);
      this.closeLibrary();
    }
  }

  loadLeaderToUI(leaderData) {
    document.getElementById("ldrName").value = leaderData.name;
    document.getElementById("ldrOverrideId").value = leaderData.id || "";
    document.getElementById("ldrOverridePts").value = leaderData.cost || 0;
    document.getElementById("ldrAbility").value = leaderData.ability || "";
    document.getElementById("ldrRestrText").value = leaderData.restriction_text || "None.";

    document.getElementById("ldrReqClass").value = leaderData.requires_class || "null";
    document.getElementById("ldrReqSub").value = leaderData.requires_subclass || "null";
    document.getElementById("ldrReqUnit").value = leaderData.requires_unit || "";

    const prefix = leaderData.id.split("_")[1];
    const factionSelect = document.getElementById("ldrFaction");
    if (prefix) {
      for (let i = 0; i < factionSelect.options.length; i++) {
        if (factionSelect.options[i].value === prefix) {
          factionSelect.selectedIndex = i;
          break;
        }
      }
    }

    const container = document.getElementById("ldrEffectsContainer");
    container.innerHTML = "";

    if (leaderData.logic && Array.isArray(leaderData.logic)) {
      leaderData.logic.forEach((logicBlock) => {
        const rowId = this.addEffect();
        const row = document.getElementById(rowId);

        if (row) {
          // 1. Set Category
          row.querySelector(".eff-cat").value = logicBlock.category || "stat_override";

          // 2. Sanitize Potency (PV): Maps legacy values like 15 or 25 to the new 10s tiers
          let pv = parseInt(logicBlock.potency_tier) || 10;
          if (![10, 20, 30, 40, 50].includes(pv)) {
            pv = Math.ceil(pv / 10) * 10; // Forces 15->20, 25->30
            if (pv > 50) pv = 50;
          }
          row.querySelector(".eff-pv").value = pv;

          // 3. Sanitize Multipliers (PM & FM): Forces "1.0" string matching
          const pm = Number(logicBlock.projection_multiplier || 1.0).toFixed(1);
          const fm = Number(logicBlock.frequency_multiplier || 1.0).toFixed(1);
          row.querySelector(".eff-pm").value = pm;
          row.querySelector(".eff-fm").value = fm;

          // 4. Sanitize Risk Discount (RD): Maps legacy values to new tiers
          let rd = parseInt(logicBlock.risk_discount) || 0;
          if (![0, 5, 12, 20].includes(rd)) {
            if (rd > 0 && rd <= 5) rd = 5;
            else if (rd > 5 && rd <= 12) rd = 12;
            else rd = 20;
          }
          row.querySelector(".eff-rd").value = rd;
        }
      });
    }

    this.update();
  }

  copyJSON() {
    this.viewMode = "json";
    this.update();
    const content = document.getElementById("ldrPreview").innerText;

    try {
      const payload = JSON.parse(content);
      const db = dataManager.data;

      const prefixToName = {
        emp: "Galactic Empire (6+)",
        reb: "Rebel Alliance (6+)",
        rep: "Galactic Republic (5+)",
        sep: "Separatist Alliance (7+)",
        gun: "Gungan Grand Army (6+)",
      };

      const prefix = payload.id.split("_")[1];
      const factionName = prefixToName[prefix];

      if (factionName && db.factions) {
        const faction = db.factions.find((f) => f.name === factionName);
        if (faction) {
          if (!faction.leaders) faction.leaders = [];
          faction.leaders = faction.leaders.filter((l) => l.id !== payload.id);
          faction.leaders.push(payload);
          dataManager.saveFullDB(db);
        }
      }
    } catch (e) {
      console.error("Could not save leader to local DB: ", e);
    }

    navigator.clipboard.writeText(content).then(() => {
      alert("Leader JSON copied and saved to session library!");
    });
  }
}

const leaderArchitect = new LeaderArchitect();

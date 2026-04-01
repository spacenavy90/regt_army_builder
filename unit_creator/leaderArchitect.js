class LeaderArchitect {
  constructor() {
    this.baseCost = 30; // The fixed "Base Tax" for taking a leader slot
    this.viewMode = "json";
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
            <label>Mechanic Category</label>
            <select class="eff-cat" onchange="leaderArchitect.update()">
                <option value="stat_override">Stat & Rule Overrides (Physics)</option>
                <option value="action_econ">Action Economy & Sequencing (Time)</option>
                <option value="status_morale">Status & Morale Economy (Attrition)</option>
                <option value="meta_game">Meta-Game Manipulation (Player)</option>
            </select>
        </div>

        <div class="grid-2">
          <div class="form-col"><label>Potency Value (PV)</label>
            <select class="eff-pv" onchange="leaderArchitect.update()">
              <option value="15">Low (15) - Minor Stat Buff, Reroll</option>
              <option value="25">Medium (25) - SV Override, Simple Action</option>
              <option value="40">High (40) - Meta-Game, Complex Action</option>
            </select>
          </div>
          <div class="form-col"><label>Projection (PM)</label>
            <select class="eff-pm" onchange="leaderArchitect.update()">
              <option value="1.0">Attached / Self (1.0x)</option>
              <option value="1.5">Aura 6" / Meta-System (1.5x)</option>
              <option value="2.0">Aura 12" / Global (2.0x)</option>
            </select>
          </div>
        </div>
        <div class="grid-2" style="margin-top: 8px;">
          <div class="form-col"><label>Frequency (FM)</label>
            <select class="eff-fm" onchange="leaderArchitect.update()">
              <option value="1.0">Passive / Always On (1.0x)</option>
              <option value="0.9">Once Per Turn (0.9x)</option>
              <option value="0.7">Conditional / Triggered (0.7x)</option>
              <option value="0.4">Once Per Game (0.4x)</option>
            </select>
          </div>
          <div class="form-col"><label>Risk Discount (RD)</label>
            <select class="eff-rd" onchange="leaderArchitect.update()">
              <option value="0">None (0 pts)</option>
              <option value="5">Minor Drawback (-5 pts)</option>
              <option value="10">Major Drawback (-10 pts)</option>
            </select>
          </div>
        </div>
      </div>`;
    container.insertAdjacentHTML("beforeend", rowHtml);
    this.update();
  }

  removeEffect(id) {
    document.getElementById(id).remove();
    this.update();
  }

  toggleLogic() {
    const show = document.getElementById("toggleLdrLogic").checked;
    document.getElementById("ldrLogicGate").style.display = show ? "block" : "none";
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

    // Calculate Attachment Friction (AF) Hierarchy
    let friction = 1.0;
    const reqClass = document.getElementById("ldrReqClass").value;
    const reqSub = document.getElementById("ldrReqSub").value;
    const reqUnit = document.getElementById("ldrReqUnit").value.trim();

    if (reqUnit !== "") {
      friction = 0.7; // Most restrictive: Specific Unit
      log += `\nAttachment Friction: Specific Unit (${reqUnit}) -> x0.70\n`;
    } else if (reqSub !== "null") {
      friction = 0.8; // Subclass restriction
      log += `\nAttachment Friction: Subclass (${reqSub}) -> x0.80\n`;
    } else if (reqClass !== "null") {
      friction = 0.9; // Class restriction
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
    };

    document.getElementById("ldrPreview").innerText = JSON.stringify(payload, null, 4);
  }

  copyJSON() {
    this.viewMode = "json";
    this.update();
    const content = document.getElementById("ldrPreview").innerText;
    navigator.clipboard.writeText(content).then(() => {
      alert("Leader JSON copied!");
    });
  }
}

const leaderArchitect = new LeaderArchitect();

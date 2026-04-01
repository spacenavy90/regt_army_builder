class LeaderArchitect {
  constructor() {
    this.baseCost = 10;
    this.statWeights = { atk: 12, sv: 18, cv: 15, override_sv: 35, action: 25 };
    this.viewMode = "json"; // Tracks what is currently in the right panel
  }

  open() {
    document.getElementById("leaderModal").style.display = "flex";
    this.populateFactions();
    this.populateKeywords();
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

  populateKeywords() {
    const select = document.getElementById("ldrKeyword");
    if (!select) return;
    const kws = Object.keys(ui.keywordsDb).sort();
    select.innerHTML = `<option value="null">None</option>` + kws.map((kw) => `<option value="${kw}">${kw}</option>`).join("");
  }

  addEffect() {
    const container = document.getElementById("ldrEffectsContainer");
    const rowId = `eff_${Date.now()}`;
    const kws = Object.keys(ui.keywordsDb).sort();
    const rowHtml = `
      <div class="effect-row form-section" id="${rowId}" style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-light); margin-bottom: 10px; position: relative;">
        <span class="close-btn" onclick="leaderArchitect.removeEffect('${rowId}')" style="position: absolute; right: 10px; top: 5px; font-size: 18px;">&times;</span>
        <div class="grid-2">
          <div class="form-col"><label>Type</label>
            <select class="eff-type" onchange="leaderArchitect.update()">
              <option value="cv">Command Bonus (+CV)</option>
              <option value="atk">Attack Bonus (+Dice)</option>
              <option value="sv">Save Bonus (+SV)</option>
              <option value="override_sv">Save Override (3+)</option>
              <option value="action">Action Economy</option>
            </select>
          </div>
          <div class="form-col"><label>Value</label><input type="number" class="eff-val" value="1" oninput="leaderArchitect.update()" /></div>
        </div>
        <div class="stat-grid" style="margin-top: 8px;">
          <div class="stat-box"><label>Targeting</label>
            <select class="eff-target" onchange="leaderArchitect.update()">
              <option value="attached">Attached</option>
              <option value="aura">Aura</option>
              <option value="defender">Defender</option>
            </select>
          </div>
          <div class="stat-box"><label>Radius"</label><input type="number" class="eff-radius" value="0" oninput="leaderArchitect.update()" /></div>
          <div class="stat-box"><label>Reliability</label>
            <select class="eff-freq" onchange="leaderArchitect.update()">
              <option value="passive">Passive</option>
              <option value="triggered">Triggered</option>
            </select>
          </div>
        </div>
        <div class="form-row" style="margin-top: 8px;">
          <label style="width: 80px;">Keyword</label>
          <select class="eff-kw" onchange="leaderArchitect.update()">
            <option value="null">None</option>
            ${kws.map((kw) => `<option value="${kw}">${kw}</option>`).join("")}
          </select>
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
    log += `Base Cost: ${this.baseCost}\n`;

    const rows = document.querySelectorAll(".effect-row");
    rows.forEach((row, idx) => {
      const type = row.querySelector(".eff-type").value;
      const val = parseInt(row.querySelector(".eff-val").value) || 0;
      const target = row.querySelector(".eff-target").value;
      const radius = parseInt(row.querySelector(".eff-radius").value) || 0;
      const freq = row.querySelector(".eff-freq").value;
      const kw = row.querySelector(".eff-kw").value;

      let potency = (this.statWeights[type] || 10) * val;
      if (kw !== "null") potency += 20;

      const targetScalar = target === "aura" ? 1 + radius * 0.05 : 1.0;
      const freqScalar = freq === "passive" ? 1.0 : 0.7;
      const effCost = potency * targetScalar * freqScalar;

      totalAbilityValue += effCost;
      log += `Effect ${idx + 1} (${type}): Potency=${potency} x Target(${targetScalar.toFixed(2)}) x Freq(${freqScalar.toFixed(2)}) = +${effCost.toFixed(2)}\n`;
    });

    let friction = 1.0;
    const reqClass = document.getElementById("ldrReqClass").value;
    const reqSub = document.getElementById("ldrReqSub").value;

    if (reqClass !== "null" && reqSub !== "null") friction = 0.75;
    else if (reqSub !== "null") friction = 0.85;
    else if (reqClass !== "null") friction = 0.95;

    const rawTotal = (this.baseCost + totalAbilityValue) * friction;
    const finalCost = Math.max(15, Math.ceil(rawTotal / 5) * 5);

    log += `------------------------\n`;
    log += `Raw Ability Sum: ${totalAbilityValue.toFixed(2)}\n`;
    log += `Restriction Friction: x${friction.toFixed(2)}\n`;
    log += `Final Mathematical Cost: ${rawTotal.toFixed(2)}\n`;
    log += `Rounded Minimum Point Cost: ${finalCost}\n`;

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
    // Overrides happen instantly
    const displayCost = override > 0 ? override : calcResult.cost;

    document.getElementById("ldrPointBadge").innerText = `${displayCost} PTS`;

    if (this.viewMode === "log") {
      document.getElementById("ldrPreview").innerText = calcResult.log;
      return; // Skip JSON generation if we are viewing the log
    }

    const name = document.getElementById("ldrName").value;
    const faction = document.getElementById("ldrFaction").value;
    const overrideId = document.getElementById("ldrOverrideId").value.trim();
    const finalId = overrideId || `ldr_${faction}_${name.toLowerCase().replace(/ /g, "_")}`;

    const rows = document.querySelectorAll(".effect-row");
    const logicStack = Array.from(rows).map((row) => ({
      type: row.querySelector(".eff-type").value,
      value: parseInt(row.querySelector(".eff-val").value) || 0,
      target: row.querySelector(".eff-target").value,
      radius: parseInt(row.querySelector(".eff-radius").value) || null,
      freq: row.querySelector(".eff-freq").value,
      keyword: row.querySelector(".eff-kw").value !== "null" ? row.querySelector(".eff-kw").value : null,
    }));

    const payload = {
      id: finalId,
      name: name,
      cost: displayCost,
      restriction_text: document.getElementById("ldrRestrText").value,
      requires_class: document.getElementById("ldrReqClass").value === "null" ? null : document.getElementById("ldrReqClass").value,
      requires_subclass: document.getElementById("ldrReqSub").value === "null" ? null : document.getElementById("ldrReqSub").value,
      ability: document.getElementById("ldrAbility").value,
      logic: logicStack,
    };

    document.getElementById("ldrPreview").innerText = JSON.stringify(payload, null, 4);
  }

  copyJSON() {
    this.viewMode = "json";
    this.update(); // Force JSON view before copying
    const content = document.getElementById("ldrPreview").innerText;
    navigator.clipboard.writeText(content).then(() => {
      alert("Leader JSON copied!");
    });
  }
}
const leaderArchitect = new LeaderArchitect();

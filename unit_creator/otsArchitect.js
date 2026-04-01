class OTSArchitect {
  constructor() {
    this.availMap = { "3+": 1.0, "4+": 0.95, "5+": 0.85, "6+": 0.75, "7+": 0.6, "8+": 0.45, "9+": 0.3 };
    this.tempMap = {
      'Single Card (3.5" x 2.5")': 1.0,
      'Double Long (7" x 2.5")': 1.75,
      'Double Wide (5" x 3.5")': 1.75,
    };
    this.viewMode = "json";
  }

  open() {
    document.getElementById("otsModal").style.display = "flex";
    this.populateKeywords();
    this.viewMode = "json";
    this.update();
  }

  close() {
    document.getElementById("otsModal").style.display = "none";
  }

  populateKeywords() {
    const container = document.getElementById("otsKeywordList");
    if (!container) return;
    const whitelist = ["Blast", "Anti-Armor", "Ion", "Smoke", "Suppressive", "Incendiary", "Beam", "Concussive"];
    const allKeywords = Object.keys(ui.keywordsDb);
    const applicableKeywords = allKeywords.filter((kw) => whitelist.includes(kw)).sort();

    container.innerHTML = applicableKeywords
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
    let log = "=== OTS AUDIT LOG ===\n";
    const dice = parseInt(document.getElementById("otsDice").value) || 0;
    const avail = document.getElementById("otsAvail").value;
    const temp = document.getElementById("otsTemp").value;
    const context = { atk_r: dice, rng_l: temp.includes("Double") ? 14 : 8, bases: 1, wnd: 1, om_save: 1.0, om_move: 1.0 };

    let kwTotalMult = 1.0;
    let kwTotalFlat = 0;
    const activeNames = Array.from(document.querySelectorAll(".ots-kw-checkbox:checked")).map((cb) => cb.value);

    activeNames.forEach((kwName) => {
      const kw = ui.keywordsDb[kwName];
      if (!kw) return;
      let value = 0;
      if (kw.logic.bal_type === "formula") {
        try {
          const func = new Function(...Object.keys(context), `return ${kw.logic.bal_formula};`);
          value = func(...Object.values(context));
        } catch (e) {
          value = 1.0;
        }
      } else {
        value = kw.logic.bal_val || 0;
      }

      if (kw.logic.is_flat) {
        kwTotalFlat += value;
        log += `Keyword [${kwName}]: Flat +${value}\n`;
      } else {
        kwTotalMult *= value;
        log += `Keyword [${kwName}]: Mult x${value.toFixed(2)}\n`;
      }
    });

    const omAv = this.availMap[avail] || 0.5;
    const omTemp = this.tempMap[temp] || 1.0;
    const rawPotency = dice * 8 * omTemp * omAv;
    const finalCost = Math.ceil(rawPotency * kwTotalMult + kwTotalFlat);

    log += `------------------------\n`;
    log += `Base Action Density: ${dice * 8}\n`;
    log += `Template Scalar: x${omTemp.toFixed(2)}\n`;
    log += `Availability Scalar (${avail}): x${omAv.toFixed(2)}\n`;
    log += `Subtotal Potency: ${rawPotency.toFixed(2)}\n`;
    log += `Final Math: (${rawPotency.toFixed(2)} * ${kwTotalMult.toFixed(2)}) + ${kwTotalFlat}\n`;
    log += `Rounded Cost: ${finalCost}\n`;

    return { cost: finalCost, log: log, activeNames, dice, avail, temp };
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

    const payload = {
      id: finalId,
      name: name,
      cost: displayCost,
      availability: calcResult.avail,
      template: calcResult.temp,
      attack_dice: calcResult.dice,
      keywords: calcResult.activeNames,
      tts_card_front: "",
    };

    document.getElementById("otsPreview").innerText = JSON.stringify(payload, null, 4);
  }

  copyJSON() {
    this.viewMode = "json";
    this.update();
    const content = document.getElementById("otsPreview").innerText;
    navigator.clipboard.writeText(content).then(() => {
      alert("OTS JSON copied!");
    });
  }
}
const otsArchitect = new OTSArchitect();

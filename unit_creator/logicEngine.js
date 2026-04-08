const logicEngine = {
  saveMap: { "3+": 2.5, "4+": 1.66, "5+": 1.25, "6+": 1.0, "-": 0.7 },
  cvMap: { "5+": 1.15, "6+": 1.0, "7+": 0.8 },

  calculateUnitPoints: function (stats, activeKws, keywordsDb) {
    try {
      const uType = stats.type;
      const uSub = stats.sub;
      const unitCourage = stats.courage || 3;

      // --- 1. BODY PILLAR CALCULATIONS ---
      const effectiveWounds = (stats.wnd + unitCourage) / 2.0;
      const baseWndVal = stats.bases * effectiveWounds * 2.22;
      const omSave = this.saveMap[stats.sv] || 1.0;

      // TIERED MOVEMENT & MINIMUM MOVE
      const rawMoveMult = (stats.mv + 6) / 12;
      let speedTax = 1.0;
      if (stats.mv > 12) speedTax = 2.0;
      else if (stats.mv > 10) speedTax = 1.5;
      else if (stats.mv > 8) speedTax = 1.2;

      const mvMin = stats.mv_min || 0;
      const minMvDiscount = 1.0 - mvMin / 30;
      const omMove = rawMoveMult * speedTax * minMvDiscount;

      // --- 2. ACTION PILLAR CALCULATIONS ---
      const actionConstant = 2.4; // Anchors standard infantry at ~40pts
      const omRange = (stats.rng_s * 1.5 + stats.rng_l) / 24;
      const omCv = this.cvMap[stats.cv] || 1.0;

      // Lethality Persistence (The concentration tax)
      const dicePerBase = stats.atk_r;
      const persistenceFactor = Math.pow(Math.max(dicePerBase / 2, 1), 0.2);

      const rsDiceScore = stats.atk_r * stats.bases * omRange;
      const msDiceScore = stats.atk_m * stats.bases * 0.6;
      const baseAvVal = (rsDiceScore + msDiceScore) * actionConstant * persistenceFactor;

      // --- 3. CLASS & TYPE MODIFIERS ---
      let typeBvMod = 1.0;
      if (uType === "Emplacement") {
        typeBvMod = 0.95;
      } else if (uType === "Vehicle" || uType === "Titan") {
        if (uSub === "Aerial") {
          typeBvMod = speedTax > 1.2 ? 1.2 : 1.5;
        } else if (uSub === "Walker" || uSub === "Hover") {
          typeBvMod = 0.9;
        } else {
          typeBvMod = 0.85;
        }
      }

      const typeAvMod = uSub === "Aerial" ? 1.2 : uType === "Vehicle" || uType === "Titan" ? 0.95 : 1.0;
      const emplacementAvMod = uType === "Emplacement" ? 1.25 : 1.0;
      const titanPenalty = uType === "Titan" ? 0.9 : 1.0;

      // --- 4. KEYWORD PROCESSING ---
      let bvMult = 1.0,
        bvFlat = 0;
      let avMult = 1.0,
        avFlat = 0;
      let omArmor = 1.0;
      let kwApplied = [];

      activeKws.forEach((kw) => {
        const entry = keywordsDb[kw];
        if (!entry) return;

        const logic = entry.logic;
        const bType = logic.bal_type;
        const target = logic.target_pillar || "action";

        const formulaContext = {
          ...stats,
          om_save: omSave,
          om_move: omMove,
          om_range: omRange,
          om_courage: unitCourage,
        };

        let modVal = 1.0;
        if (bType === "formula") {
          modVal = this.safeEval(logic.bal_formula || "1.0", formulaContext);
        } else if (bType === "multiplier") {
          modVal = logic.bal_val || 1.0;
        } else if (bType === "flat") {
          modVal = logic.bal_val || 0;
        }

        const useFlat = bType === "flat" || logic.is_flat === true;

        if (logic.effect === "conditional_armor") {
          omArmor = Math.max(omArmor, modVal);
          kwApplied.push(`${kw}: ${modVal.toFixed(2)}x (Max Armor)`);
        } else if (target === "body") {
          if (useFlat) {
            bvFlat += modVal;
            kwApplied.push(`${kw}: +${modVal.toFixed(2)} Flat`);
          } else {
            bvMult *= modVal;
            kwApplied.push(`${kw}: ${modVal.toFixed(2)}x`);
          }
        } else {
          if (useFlat) {
            avFlat += modVal;
            kwApplied.push(`${kw}: +${modVal.toFixed(2)} Flat`);
          } else {
            avMult *= modVal;
            kwApplied.push(`${kw}: ${modVal.toFixed(2)}x`);
          }
        }
      });

      // --- 5. FINAL PILLAR MERGE & SATURATION ---
      const rawBv = baseWndVal * omSave * omMove * omArmor * typeBvMod * bvMult + bvFlat;
      const rawAv = baseAvVal * omCv * typeAvMod * emplacementAvMod * titanPenalty * avMult + avFlat;

      // The universal flattened saturation curve (no more cliffs)
      const bvAnchor = 20.0;
      const avAnchor = 20.0;
      const saturationExponent = 0.08;

      const bvSatMult = Math.pow(Math.max(rawBv, bvAnchor) / bvAnchor, saturationExponent);
      const avSatMult = Math.pow(Math.max(rawAv, avAnchor) / avAnchor, saturationExponent);

      const finalBv = rawBv * bvSatMult;
      const finalAv = rawAv * avSatMult;

      const rawTotal = finalBv + finalAv;
      const rounded = Math.ceil(rawTotal / 5) * 5;

      // --- 6. AUDIT LOG (VERBOSE & CORRECTED) ---
      let log = `AUDIT LOG: ${stats.name.toUpperCase()}\n`;
      log += "=".repeat(50) + "\n";
      log += `1. BODY PILLAR (FINAL BV: ${finalBv.toFixed(2)})\n`;
      log += `   Durability Profile: (${stats.wnd} Wounds + ${unitCourage} Courage) / 2 = ${effectiveWounds.toFixed(2)} Effective Wounds/Base\n`;
      log += `   Wound Pool: ${stats.bases} Bases * ${effectiveWounds.toFixed(2)} Effective Wounds * 2.22 = ${baseWndVal.toFixed(2)}\n`;
      log += `   Defense Modifiers:\n`;
      log += `     - Save (${stats.sv}): ${omSave.toFixed(2)}x\n`;
      log += `     - Base Move Mult ((${stats.mv}"+6)/12): ${rawMoveMult.toFixed(2)}x\n`;
      log += `     - Speed Tax Tier: ${speedTax.toFixed(2)}x\n`;
      log += `     - Min Move Discount (${mvMin}"): ${minMvDiscount.toFixed(2)}x\n`;
      log += `     - Final Movement Factor: ${omMove.toFixed(2)}x\n`;
      log += `     - Armor Override: ${omArmor.toFixed(2)}x\n`;
      log += `     - Class Mod (${uType}/${uSub}): ${typeBvMod.toFixed(2)}x\n`;
      log += `   Keyword Body Mult: ${bvMult.toFixed(2)}x\n`;
      if (bvFlat > 0) log += `   Keyword Body Flat: +${bvFlat.toFixed(2)}\n`;
      log += `   --- Saturation Processing ---\n`;
      log += `   Raw BV Subtotal: ${rawBv.toFixed(2)}\n`;
      log += `   Anchor Ratio (vs ${bvAnchor.toFixed(0)}): ${Math.max(rawBv, bvAnchor).toFixed(2)} / ${bvAnchor.toFixed(2)}\n`;
      log += `   BV Saturation: (Ratio)^${saturationExponent} = ${bvSatMult.toFixed(2)}x\n`;
      log += `   -> BV PILLAR FINAL: ${finalBv.toFixed(2)}\n\n`;

      log += `2. ACTION PILLAR (FINAL AV: ${finalAv.toFixed(2)})\n`;
      log += `   Range Calculation: ((${stats.rng_s}*1.5) + ${stats.rng_l}) / 24 = ${omRange.toFixed(2)}x\n`;
      log += `   Offense Breakdown:\n`;
      log += `     - Persistence Factor (${dicePerBase} dice/base): ${persistenceFactor.toFixed(2)}x\n`;
      log += `     - Ranged Dice Score: (${stats.atk_r} * ${stats.bases}) * ${omRange.toFixed(2)} = ${rsDiceScore.toFixed(2)}\n`;
      log += `     - Melee Dice Score: (${stats.atk_m} * ${stats.bases}) * 0.6 = ${msDiceScore.toFixed(2)}\n`;
      log += `     - Base Action Value: (${rsDiceScore.toFixed(2)} + ${msDiceScore.toFixed(2)}) * ${actionConstant} * ${persistenceFactor.toFixed(2)} = ${baseAvVal.toFixed(2)}\n`;
      log += `   Reliability Modifiers:\n`;
      log += `     - CV (${stats.cv}): ${omCv.toFixed(2)}x\n`;
      log += `     - Class Mod: ${typeAvMod.toFixed(2)}x\n`;
      if (emplacementAvMod !== 1.0) log += `     - Emplacement Offense Bonus: ${emplacementAvMod.toFixed(2)}x\n`;
      if (titanPenalty < 1.0) log += `     - Titan Agility Penalty: ${titanPenalty.toFixed(2)}x\n`;
      log += `   Keyword Action Mult: ${avMult.toFixed(2)}x\n`;
      if (avFlat > 0) log += `   Keyword Action Flat: +${avFlat.toFixed(2)}\n`;
      log += `   --- Saturation Processing ---\n`;
      log += `   Raw AV Subtotal: ${rawAv.toFixed(2)}\n`;
      log += `   Anchor Ratio (vs ${avAnchor.toFixed(0)}): ${Math.max(rawAv, avAnchor).toFixed(2)} / ${avAnchor.toFixed(2)}\n`;
      log += `   AV Saturation: (Ratio)^${saturationExponent} = ${avSatMult.toFixed(2)}x\n`;
      log += `   -> AV PILLAR FINAL: ${finalAv.toFixed(2)}\n\n`;

      if (kwApplied.length > 0) {
        log += "3. KEYWORD CONTRIBUTIONS\n";
        kwApplied.forEach((entry) => (log += `   - ${entry}\n`));
        log += "\n";
      }

      log += "=".repeat(50) + "\n";
      log += `FINAL BODY VALUE: ${finalBv.toFixed(2)} | FINAL ACTION VALUE: ${finalAv.toFixed(2)}\n`;
      log += `RAW TOTAL: ${rawTotal.toFixed(2)}\n`;
      log += `FINAL POINT COST: ${rounded} pts\n`;
      log += "=".repeat(50);

      return { rounded, rawTotal, log };
    } catch (e) {
      return { rounded: 0, rawTotal: 0, log: `Critical Engine Error: ${e.message}` };
    }
  },

  safeEval: function (formula, context) {
    try {
      const keys = Object.keys(context);
      const values = Object.values(context);
      const f = new Function(...keys, `return ${formula}`);
      return f(...values);
    } catch (e) {
      console.error("Formula Error:", formula, e);
      return 1.0;
    }
  },
};

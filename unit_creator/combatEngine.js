class SimulationRunner {
  constructor(unitA, unitB, distance, iterations = 1000) {
    this.unitA = unitA;
    this.unitB = unitB;
    this.dist = distance;
    this.iterations = iterations;
  }

  run() {
    let aWins = 0;
    let bWins = 0;
    let totalAPointsKilled = 0;
    let totalBPointsKilled = 0;

    for (let i = 0; i < this.iterations; i++) {
      const result = this.simulateBout();

      if (result.winner === "A") aWins++;
      else if (result.winner === "B") bWins++;

      totalAPointsKilled += result.bDmg;
      totalBPointsKilled += result.aDmg;
    }

    // Efficiency: Mean points killed per 1 point spent
    const effA = totalAPointsKilled / this.iterations / this.unitA.cost;
    const effB = totalBPointsKilled / this.iterations / this.unitB.cost;

    return {
      aWinRate: (aWins / this.iterations) * 100,
      bWinRate: (bWins / this.iterations) * 100,
      aEff: effA,
      bEff: effB,
    };
  }

  simulateBout() {
    let aWnds = this.unitA.wnd * this.unitA.unit_size;
    let bWnds = this.unitB.wnd * this.unitB.unit_size;

    for (let turn = 0; turn < 6; turn++) {
      // Randomize turn order (Alternating activations)
      let order = [
        { attacker: this.unitA, defender: this.unitB, targetWnd: "B" },
        { attacker: this.unitB, defender: this.unitA, targetWnd: "A" },
      ];

      // Shuffle order
      if (Math.random() > 0.5) order.reverse();

      for (const phase of order) {
        const hits = this.rollAttacks(phase.attacker);
        const actualHits = this.applyArmor(hits, phase.attacker, phase.defender);
        const wounds = this.rollDefense(actualHits, phase.defender);

        if (phase.targetWnd === "B") {
          bWnds -= wounds;
        } else {
          aWnds -= wounds;
        }

        if (aWnds <= 0 || bWnds <= 0) break;
      }
      if (aWnds <= 0 || bWnds <= 0) break;
    }

    const aDead = aWnds <= 0;
    const bDead = bWnds <= 0;

    const maxAWnds = this.unitA.wnd * this.unitA.unit_size;
    const maxBWnds = this.unitB.wnd * this.unitB.unit_size;

    // Calculate value destroyed (points killed)
    const aDmgVal = this.unitA.cost * Math.min(1.0, (maxAWnds - Math.max(0, aWnds)) / maxAWnds);
    const bDmgVal = this.unitB.cost * Math.min(1.0, (maxBWnds - Math.max(0, bWnds)) / maxBWnds);

    if (aDead && !bDead) return { winner: "B", aDmg: this.unitA.cost, bDmg: bDmgVal };
    if (bDead && !aDead) return { winner: "A", aDmg: aDmgVal, bDmg: this.unitB.cost };
    return { winner: "Draw", aDmg: aDmgVal, bDmg: bDmgVal };
  }

  rollAttacks(unit) {
    const dice = unit.atk_ranged * unit.unit_size;
    let toHit = this.dist <= unit.rng_short ? 4 : 5;

    if (unit.keywords.includes("Artillery")) toHit = 4;

    let hits = 0;
    for (let i = 0; i < dice; i++) {
      if (Math.floor(Math.random() * 6) + 1 >= toHit) hits++;
    }
    return hits;
  }

  applyArmor(hits, attacker, defender) {
    if (attacker.keywords.includes("Anti-Armor")) return hits;

    let armorVal = 0;
    defender.keywords.forEach((kw) => {
      if (kw.startsWith("Armor ")) {
        const val = parseInt(kw.split(" ")[1]);
        if (!isNaN(val)) armorVal = val;
      }
    });

    if (defender.keywords.includes("Heavy Armor")) return 0;

    return Math.max(0, hits - armorVal);
  }

  rollDefense(hits, unit) {
    if (unit.sv === "-") return hits;
    const saveVal = parseInt(unit.sv.replace("+", ""));

    let unsaved = 0;
    for (let i = 0; i < hits; i++) {
      if (Math.floor(Math.random() * 6) + 1 < saveVal) unsaved++;
    }
    return unsaved;
  }
}

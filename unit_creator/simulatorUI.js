class SimulatorUI {
  constructor() {
    this.unitList = [];
  }

  open() {
    document.getElementById("simulatorModal").style.display = "flex";
    this.refreshUnitLists();
  }

  close() {
    document.getElementById("simulatorModal").style.display = "none";
  }

  /**
   * Logic from Python __init__: Flatten factions into a searchable list
   */
  refreshUnitLists() {
    const db = dataManager.data;
    this.unitList = [];

    db.factions.forEach((f) => {
      f.units.forEach((u) => {
        // Attach faction name for display consistency
        this.unitList.push({ ...u, factionName: f.name });
      });
    });

    const selectA = document.getElementById("simUnitA");
    const selectB = document.getElementById("simUnitB");

    const optionsHtml = this.unitList
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((u) => `<option value="${u.id}">${u.name} (${u.factionName})</option>`)
      .join("");

    selectA.innerHTML = optionsHtml;
    selectB.innerHTML = optionsHtml;

    // Default B to Rebel Trooper if possible for baseline testing
    const rebIndex = this.unitList.findIndex((u) => u.name.includes("Rebel Trooper"));
    if (rebIndex !== -1) selectB.selectedIndex = rebIndex;
  }

  /**
   * Logic from Python run_sim()
   */
  run() {
    const idA = document.getElementById("simUnitA").value;
    const idB = document.getElementById("simUnitB").value;
    const range = parseInt(document.getElementById("simRange").value) || 8;

    const unitA = this.unitList.find((u) => u.id === idA);
    const unitB = this.unitList.find((u) => u.id === idB);

    if (!unitA || !unitB) return;

    const runner = new SimulationRunner(unitA, unitB, range, 1000);
    const data = runner.run();

    this.displayResults(unitA.name, unitB.name, range, data);
  }

  displayResults(nameA, nameB, range, data) {
    let output = `SIMULATION RESULTS: ${nameA} vs ${nameB}\n`;
    output += "=".repeat(50) + "\n";
    output += `Range: ${range}"\n\n`;
    output += `${nameA} Win Rate: ${data.aWinRate.toFixed(1)}%\n`;
    output += `${nameB} Win Rate: ${data.bWinRate.toFixed(1)}%\n\n`;
    output += `POINT EFFICIENCY (Points killed per point spent):\n`;
    output += `${nameA}: ${data.aEff.toFixed(2)}x\n`;
    output += `${nameB}: ${data.bEff.toFixed(2)}x\n`;
    output += "=".repeat(50) + "\n";

    if (data.aEff > 1.2 || data.bEff > 1.2) {
      output += "\nWARNING: Efficiency > 1.2x indicates a potential point under-costing.";
    }

    document.getElementById("simResults").innerText = output;
  }
}

const simulator = new SimulatorUI();

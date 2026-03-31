class UnitLibrary {
  constructor() {
    this.selectedRow = null;
    this.data = null;
  }

  /**
   * Replaces self.refresh_table() and initial setup
   */
  open() {
    this.data = dataManager.data;
    document.getElementById("libraryModal").style.display = "flex";

    // Populate Faction Dropdown
    const filter = document.getElementById("libFactionFilter");
    filter.innerHTML = '<option value="All">All</option>' + this.data.factions.map((f) => `<option value="${f.name}">${f.name}</option>`).join("");

    this.refreshTable();
  }

  close() {
    document.getElementById("libraryModal").style.display = "none";
    this.selectedRow = null;
  }

  /**
   * Logic from Python refresh_table()
   */
  refreshTable() {
    const tbody = document.getElementById("libTableBody");
    const searchQuery = document.getElementById("libSearch").value.toLowerCase();
    const targetFaction = document.getElementById("libFactionFilter").value;

    tbody.innerHTML = "";

    this.data.factions.forEach((faction) => {
      if (targetFaction !== "All" && faction.name !== targetFaction) return;

      faction.units.forEach((unit) => {
        if (unit.name.toLowerCase().includes(searchQuery)) {
          const row = document.createElement("tr");
          row.innerHTML = `
                        <td>${unit.name}</td>
                        <td>${unit.class}</td>
                        <td style="text-align:center;">${unit.cost}</td>
                        <td>${faction.name}</td>
                    `;

          // Selection logic (mimics Treeview click)
          row.onclick = () => this.selectRow(row, unit, faction.name);
          tbody.appendChild(row);
        }
      });
    });
  }

  selectRow(rowElement, unitData, factionName) {
    // Clear previous selection styling
    if (this.selectedRow) this.selectedRow.element.classList.remove("selected-row");

    // Set new selection
    this.selectedRow = { element: rowElement, unit: unitData, faction: factionName };
    rowElement.classList.add("selected-row");
  }

  /**
   * Logic from Python load_selection()
   */
  loadSelection() {
    if (!this.selectedRow) {
      alert("Please select a unit first.");
      return;
    }

    // Call the main UI's load function (equivalent to on_load_callback)
    ui.loadUnitToUI(this.selectedRow.unit, this.selectedRow.faction);
    this.close();
  }
}

const library = new UnitLibrary();

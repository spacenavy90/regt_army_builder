class DataManager {
  constructor() {
    this.data = { factions: [], definitions: {}, ots: [] };
    this.STORAGE_KEY = "regiment_db_cache";
  }

  /**
   * Replaces load_data().
   * Attempts to load from localStorage first to preserve active edits.
   * Falls back to fetching the static data.json from the root directory.
   */
  async initialize() {
    const cachedData = localStorage.getItem(this.STORAGE_KEY);

    if (cachedData) {
      this.data = JSON.parse(cachedData);
      return this.data;
    }

    try {
      // Fetching from the root directory relative to /unit_creator/
      const response = await fetch("data.json");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      this.data = await response.json();
      this.persist(); // Cache the initial load
      return this.data;
    } catch (error) {
      console.error("Failed to initialize data:", error);
      return this.data;
    }
  }

  /**
   * Replaces save_full_db().
   * Updates the local state and commits it to the browser's localStorage.
   */
  saveFullDB(updatedData) {
    this.data = updatedData;
    this.persist();
  }

  /**
   * Replaces save_keyword().
   * Updates the 'definitions' object within the data structure.
   */
  saveKeyword(name, logic) {
    this.data.definitions[name] = logic;
    this.persist();
  }

  /**
   * Internal helper to commit current state to localStorage.
   */
  persist() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
  }

  /**
   * Generates a formatted JSON string for manual copy-pasting.
   */
  getJsonPreview() {
    return JSON.stringify(this.data, null, 4);
  }

  /**
   * Clears local cache and re-pulls from the source data.json.
   */
  async resetToSource() {
    localStorage.removeItem(this.STORAGE_KEY);
    return await this.initialize();
  }
}

// Export as a singleton instance
const dataManager = new DataManager();

function toggleKeywordModal() {
  // Use the new UNIQUE id
  const modal = document.getElementById("keywordReferenceModal");
  if (!modal) return;

  const isActive = modal.classList.toggle("active");

  if (isActive) {
    renderKeywordDefinitions();
  }
}

function renderKeywordDefinitions() {
  const container = document.getElementById("keywordReferenceDisplay");
  if (!container) return;

  // 1. Try to get definitions from the UI object first,
  // 2. Fall back to the DataManager data if UI isn't ready
  const definitions =
    window.ui && ui.keywordsDb && Object.keys(ui.keywordsDb).length > 0 ? ui.keywordsDb : dataManager.data ? dataManager.data.definitions : null;

  if (!definitions || Object.keys(definitions).length === 0) {
    container.innerHTML = `
      <div style="padding:20px; text-align:center;">
        <p style="color:var(--color-orange);">Keyword database is currently empty.</p>
        <p style="font-size:0.8rem; color:var(--text-muted);">Try clicking 'Refresh DB' in the Architect panel.</p>
      </div>`;
    return;
  }

  const sortedKeys = Object.keys(definitions).sort();

  container.innerHTML = sortedKeys
    .map((key) => {
      const entry = definitions[key];
      // Logic for handling both the "desc" and "description" keys just in case
      const description = entry.desc || entry.description || "No description provided.";

      return `
            <div class="kw-entry" style="margin-bottom: 20px; border-bottom: 1px solid var(--border-light); padding-bottom: 15px;">
                <span class="kw-name" style="color: var(--color-blue); font-weight: bold; font-size: 1.1rem; display: block; margin-bottom: 5px;">
                  ${key.toUpperCase()}
                </span>
                <p class="kw-desc" style="color: var(--text-main); font-size: 0.95rem; line-height: 1.5; margin: 0;">
                  ${description}
                </p>
            </div>
        `;
    })
    .join("");
}

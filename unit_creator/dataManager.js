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
      const response = await fetch("../data.json");
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

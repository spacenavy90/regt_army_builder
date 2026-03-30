# Developer Guide: Star Wars Regiment Army Builder & Simulator

This document outlines the technical structure of the application and provides instructions for maintaining the game database and simulation logic.

## Architecture Overview
* **`data.json`**: The single source of truth. Contains all faction, unit, leader, OTS, and keyword data. This is a pure JSON file and must follow strict JSON syntax (double quotes for all keys and strings).
* **`engine.js`**: The core application logic. It fetches `data.json` asynchronously on load. It handles UI rendering, rules validation, and army exports.
* **`style.css`**: Contains all layout and theme variables.

## The Data Schema (`data.json`)

### 1. Units
Units are housed within their respective faction's `units` array.
* **Movement:** * `mv`: Standard/Maximum movement value (Integer).
    * `mv_min`: Minimum movement requirement (Integer or `null`). Used for Aerial units.
* **Combat Stats:** `unit_size`, `cost`, `atk_ranged`, `atk_melee`, `rng_short`, `rng_long`, `wnd`, `sv`.
* **Limits:** `min_pct` and `max_pct` integers determine list legality based on the points cap.
* **TTS Assets:** * `tts_model`, `tts_texture`, `tts_collider`: Raw URLs for 3D assets.
    * `tts_height`: Float value. Defines the Y-axis spawning offset in Tabletop Simulator.

### 2. Leaders & Keywords (Simulation Logic)
Both Leaders and Keyword Definitions now utilize a **Logic Schema** designed for combat simulations.
* **`ability` / `desc`**: The player-facing string displayed in the builder.
* **`logic`**: An object read by simulation engines:
    * `trigger`: When the ability activates (e.g., `"on_command"`, `"on_combat_melee"`, `"on_move"`).
    * `target`: Who the effect applies to (e.g., `"self"`, `"attached"`, `"aura"`, `"defender"`).
    * `effect`: The type of change (e.g., `"modify"`, `"negate_status"`, `"instant_death"`).
    * `stat` / `value` / `radius`: Specific parameters for the effect.

### 3. Leader Attachment Logic
The engine enforces leader legality using three keys:
1. `requires_class`: String match for unit `class`.
2. `requires_subclass`: String match for unit `subclass`.
3. `requires_unit`: String match for a specific unit `id`.
*If multiple are defined, the engine enforces a strict AND condition.*

---

## Engine Mechanics

### Asynchronous Initialization
Because the database is now an external `.json` file, `engine.js` uses an `async` function on `DOMContentLoaded`. It uses `fetch()` to retrieve the data. No UI rendering will occur until `REGIMENT_DATA` is fully populated.

### State Persistence & Expiry
The application uses `localStorage` for auto-saving. 
* **Timestamping:** Every save includes a `lastUpdated` key (ms).
* **Expiry:** Upon load, the engine compares `Date.now()` to `lastUpdated`. If the difference exceeds **6 hours** (21,600,000 ms), the save is discarded and the user is returned to the home screen.

### TTS Export Trimming
The `generateTTSJSON()` function performs **selective mapping**. To keep the export payload small for Tabletop Simulator:
1. It ignores the `logic` blocks.
2. It ignores builder-only limits (`min_pct`, `max_pct`).
3. It maps the internal `mv` key to `mv_max` for the TTS Lua script's consumption.

---

## Maintenance Workflow
1. **Adding Content:** Update `data.json`. Ensure no trailing commas exist, as strict JSON will fail to fetch.
2. **Testing Logic:** Use the "Detailed TXT" export to verify that new keywords are appearing correctly in the glossary.
3. **Simulation Prep:** When adding new abilities, ensure the `trigger` and `target` keys in the `logic` block match existing simulator conventions to ensure the unit behaves correctly in combat tests.
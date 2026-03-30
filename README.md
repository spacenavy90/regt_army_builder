# Star Wars: Regiment Army Builder

## Overview
The Star Wars: Regiment Army Builder is a dedicated web-based tool designed for the 6mm scale tabletop wargame, **Star Wars: Regiment**. This application streamlines the process of list construction, ensuring all forces adhere to the specific rules of the game while providing various export formats for physical play, digital sharing, and Tabletop Simulator (TTS) integration.

The builder is engineered with a "Single Source of Truth" philosophy. All game data is housed in a central `data.json` file, allowing the engine to dynamically render units, leaders, and off-table support (OTS) assets through asynchronous fetching.

---

## Core Features

### 1. Dynamic Faction Management
The application supports both **Major** and **Minor** factions. Major factions, such as the Galactic Empire and Rebel Alliance, feature high-resolution icon-based selection cards, while Minor factions use a streamlined button interface. Each faction is assigned a unique **Command Value** (e.g., $5+$ for Republic, $6+$ for Empire, $7+$ for Separatists), which is displayed persistently within the builder interface.

### 2. Intelligent Rules Engine
The builder monitors army composition in real-time, providing visual feedback if a list becomes illegal.

* **Point Scaling:** The engine calculates unit minimum and maximum requirements based on the user-defined Points Cap. For example, if a unit has a $min$ percentage of $15\%$, the builder will flag the unit as illegal until the total points spent on that unit type satisfy the requirement.
* **Movement Logic:** Units are tracked with standard movement values ($mv$) and optional minimum movement requirements ($mv\_min$). This is primarily used for Aerial units (like the Snowspeeder) that must move a minimum distance to remain effective.
* **OTS Constraint Logic:** Off-Table Support assets are strictly governed by a dual-limit system. A list is restricted to a maximum of $15\%$ of the total points cap for OTS expenditures and a card count limit of $1$ card per $250$ points.
* **Leader Attachment Validation:** Faction leaders are restricted to one per army. The builder employs an $AND$ logic validation system to ensure leaders are attached to valid units. This validation checks three optional parameters: **Class** (e.g., Infantry), **Subclass** (e.g., Walker), and **Unit ID** (for specific named unit attachments).

### 3. State Persistence and Recovery
The builder utilizes the browser's `localStorage` to execute an **Auto-Save** function. Every modification to a list—including points cap adjustments, unit counts, and faction selection—is cached locally. 

To ensure the interface remains clean and relevant to current sessions, saved lists automatically expire and are cleared if the user does not return to the app within **6 hours**.

---

## Export and Integration

### Tabletop Simulator (TTS) Integration
The builder generates a specialized JSON string designed for use with a Tabletop Simulator Lua importer. 
* **"Dumb Reader" Logic:** The JSON includes all relevant unit statistics, keywords, 3D asset URLs, and a specific `tts_height` value for model elevation. 
* **Trimmed Payload:** While the master database contains complex logic blocks for future unit simulations, the TTS export is "trimmed" to only include the specific data needed for spawning models in-game, keeping the character count manageable for the TTS interface.

### Multi-Format Reporting
* **Simple Text:** A condensed list intended for quick sharing on platforms like Discord or Slack.
* **Detailed Manifest:** A comprehensive breakdown including unit stats, abilities, and a generated glossary of every keyword used in the army, pulling directly from the `definitions` logic.
* **Share Codes:** Base64-encoded strings that allow users to share their exact list state with others.
* **Print Functionality:** A dedicated print system that opens a sanitized, monospace version of the detailed manifest, formatted specifically for physical reference at the tabletop.

---

## Technical Architecture
The application is built using a lightweight stack of HTML5, CSS3, and Vanilla JavaScript. It uses the `fetch` API to load game data asynchronously, ensuring the core engine remains separate from the content database.

### Data Structure
The `data.json` object is categorized into:
* **Factions:** Unit rosters, logic-based leaders, and faction-specific metadata.
* **OTS:** A global pool of off-table support assets.
* **Definitions:** A master glossary containing both descriptive text for players and logic triggers for simulation.

### Validation Flow
Whenever a unit quantity is adjusted, the `updateUI()` function executes the following sequence:
1. Recalculates total points and remaining bid.
2. Checks OTS point and card ceilings.
3. Evaluates unit minimum/maximum percentages.
4. Validates Leader attachment legality.
5. Updates the Manifest panels and the Auto-Save cache with a fresh timestamp.
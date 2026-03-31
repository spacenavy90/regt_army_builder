# STAR WARS: REGIMENT ARMY BUILDER USAGE & DOCUMENTATION GUIDE

---

# SECTION 1: PROJECT OVERVIEW AND EXECUTIVE SUMMARY

## 1.1 MISSION STATEMENT: THE 6MM WARGAMING CHALLENGE

The Star Wars: Regiment Army Builder is a high-performance, web-based architectural framework designed specifically for the "Star Wars: Regiment" tabletop wargame. Unlike traditional 28mm skirmish games which focus on small squads, 6mm wargaming operates at a "Regimental" scale. This necessitates the management of massive formations, diverse vehicle subclasses, and complex off-table support structures.

The mission of this application is to eliminate the mathematical friction inherent in high-scale wargaming. By providing a real-time, reactive interface, the builder allows players to focus entirely on strategic composition rather than manual point-tracking or rule-checking. It serves as the definitive bridge between the conceptual "Order of Battle" and the physical or digital manifestation of the army on the tabletop.

## 1.2 ARCHITECTURAL PHILOSOPHY: THE "SINGLE SOURCE OF TRUTH" (SSOT)

The most significant technical pillar of this project is its strict adherence to the "Single Source of Truth" (SSOT) design pattern. Historically, wargaming tools have suffered from "hardcoded bloat," where unit statistics and rule logic are inextricably linked to the user interface code.

To resolve this, the Regiment Army Builder underwent a critical transition from a script-based data model (`data.js`) to a pure data-exchange format (`data.json`).

- **Separation of Concerns:** The JavaScript engine (`engine.js`) functions as a "Universal Processor." It contains no knowledge of specific Star Wars units or factions. Instead, it defines the _rules of the system_.
- **Asynchronous Data Ingestion:** Upon initialization, the engine utilizes the `fetch` API to asynchronously retrieve the `data.json` file. This allows for a modular ecosystem where the same data file can be pointed at different front-end "skins" or, more importantly, ingested by an independent Unit Simulation Engine for tactical testing.
- **Integrity and Scalability:** Because the data is separated, updating a unit's point cost or adding an entirely new faction requires zero changes to the application's logic. This ensures that the codebase remains lightweight, bug-resistant, and infinitely scalable as the Star Wars: Regiment game evolves.

## 1.3 THE ECOSYSTEM: BUILDER, EXPORTER, AND SIMULATOR

This application is not merely a list-building utility; it is the central hub for a three-tiered digital wargaming ecosystem:

1. **The Builder:** A reactive environment that enforces complex legality rules, such as percentage-based unit limits and leader-to-unit attachment validation.
2. **The Exporter:** A versatile reporting engine that transforms the in-memory army list into multiple human-readable and machine-readable formats. This includes the "Dumb Reader" JSON protocol specifically designed to drive automated 3D model spawning in Tabletop Simulator (TTS).
3. **The Simulator (Beta):** By implementing a standardized "Logic Schema" (utilizing Trigger, Target, and Effect keys) within the unit and keyword definitions, the application prepares the groundwork for automated combat simulations. This allows developers and players to mathematically model unit efficiency and balance before a single miniature is placed on the table.

## 1.4 TECHNICAL CONSTRAINTS AND PERFORMANCE

The application is engineered to be entirely dependency-free. It utilizes Vanilla JavaScript, HTML5, and CSS3 to ensure maximum compatibility across all modern desktop and mobile browsers without the overhead of heavy frameworks. This "Lite-Stack" approach ensures that the builder remains lightning-fast, even when processing hundreds of unit instances and complex validation loops simultaneously.

By utilizing a local web server for development and deployment, the project sidesteps traditional CORS restrictions while maintaining the security and speed benefits of asynchronous data handling. The result is a professional-grade tool that feels like a native application while retaining the accessibility of the open web.

---

# SECTION 2: FACTION DYNAMICS & USER INTERFACE ARCHITECTURE

## 2.1 FACTION TAXONOMY: MAJOR VS. MINOR DESIGNATIONS

The Star Wars: Regiment ecosystem distinguishes between two primary tiers of political entities to reflect the asymmetrical nature of the Star Wars galaxy. This distinction is governed by the "type" property within the "factions" array in `data.json`.

- **Major Factions (e.g., Galactic Empire, Rebel Alliance):** These represent the primary combatants of the galactic timeline. In the UI, they are granted high-visibility "Faction Cards" on the home screen. These cards utilize a dedicated icon directory (`/icons/`) and provide a rich, immersive entry point for the user. These factions typically possess expansive unit rosters covering all classes (Infantry, Vehicle, Titan, etc.).
- **Minor Factions (e.g., Gungan Grand Army):** These represent planetary defense forces or smaller insurgencies. To maintain a clean visual hierarchy, these are rendered as "Minor Buttons" below the primary grid. This prevents the home screen from becoming cluttered while still allowing for a "Major vs. Minor" army list match-up. Minor factions often have specialized unit pools with narrower strategic focuses.

## 2.2 THE DYNAMIC HOME SCREEN: INITIALIZEHOMESCREEN()

The home screen is not a static HTML landing page; it is a dynamically generated portal. When the application initializes, the `initializeHomeScreen()` function executes a high-speed iteration through the fetched `REGIMENT_DATA.factions` array.

- **Grid Injection:** The engine clears the `majorFactionsGrid` and `minorFactionsGrid` DOM elements and rebuilds them using template literals. This ensures that if a developer adds a new faction to the JSON, it appears instantly on the home screen without a single line of HTML modification.
- **Asset Resiliency:** Each Faction Card includes an `onerror` handler in its `<img>` tag. If a specific SVG icon is missing from the server, the engine automatically injects a generic "placeholder" SVG circle. This prevents "broken image" icons from degrading the professional aesthetic of the tool.
- **Event Binding:** Faction Cards are bound to the `loadBuilderView(factionId)` function, passing the unique ID string (e.g., `"rep_all"`) as the primary key for the subsequent roster render.

## 2.3 THE BUILDER VIEW: THE ROSTER PANEL

Once a faction is selected, the interface transitions from the "Home View" to the "Builder View" via CSS display toggles. The core of this view is the Roster Panel, which is controlled by the `renderRoster()` function.

- **Faction Metadata Integration:** The roster title is not static. It pulls the `faction.name` and the critical `faction.command_value` (e.g., 6+) directly from the JSON. The Command Value is rendered in the sub-header to serve as a constant tactical reminder for the player.
- **Sorting Mechanisms:** The UI includes a `sortSelect` dropdown allowing users to sort the roster alphabetically or by points cost (high-to-low). This is handled by a spread-operator clone of the unit array (`[...faction.units]`) to ensure the original JSON data remains unsorted and pure.
- **The Roster Row:** Each unit is rendered as a "Roster Row" containing four distinct data clusters:
  1.  **Identity:** Unit Name and Unit Size (the number of physical models in a stand).
  2.  **Classification:** Primary Class and Subclass (e.g., "Vehicle - Hover").
  3.  **Core Statistics:** Movement (Max and optional Min), Ranged/Melee Attack dice, Short/Long range, Wounds, and Save value.
  4.  **Keywords:** A comma-separated list of active keywords for the unit.

## 2.4 THE PERSISTENT HEADER CONTROLS

The "Builder Controls" bar remains pinned to the top of the screen during list construction, providing global state management and utility functions.

- **The Points Cap (`armyCap`):** An input field that defines the total points allowed for the army. This value is the primary variable for the builder’s math engine, driving the calculation of unit percentage limits and OTS ceilings.
- **The Faction Select Dropdown:** This allows users to jump between factions without returning to the home screen. Changing the faction via this dropdown triggers a safety wipe of the `currentList` object to prevent the illegal mixing of units from different factions (e.g., Stormtroopers in a Gungan army).
- **The Override Toggle:** A "Rule of Cool" feature that bypasses the engine's validation logic. When enabled, it unlocks the "+" stepper buttons regardless of point limits or leader restrictions, allowing for experimental or non-standard game modes.
- **The Bid Display:** A real-time counter showing the difference between the Points Cap and the Total Spent. In Star Wars: Regiment, the "Bid" is used to determine initiative, making this a critical piece of the UI.
- **The OTS Tracker:** A dedicated sub-display in the header that tracks two concurrent limits: the 15% points ceiling for support assets and the "1 card per 250 points" count limit.

## 2.5 THE MANIFEST SIDEBAR (THE "LIVING LIST")

On desktop view, the right side of the screen is occupied by the Manifest Sidebar. As the user clicks the "+" steppers in the roster, the `updateUI()` function dynamically populates this sidebar with "Manifest Items."

- **Categorization:** The sidebar is organized into three groups: **Faction Leader**, **Combat Units**, and **Support Assets**.
- **Immediate Feedback:** If a unit quantity violates its min/max percentage rules or if a leader attachment is missing its required unit, the manifest item is highlighted in "Danger Red" (illegal state). This provides instant visual confirmation that the list needs adjustment.
- **Quick Removal:** Each item in the manifest includes a "×" button, allowing users to instantly delete a unit type from their list without scrolling through the main roster to find the stepper.

---

# SECTION 3: THE INTELLIGENT RULES ENGINE

## 3.1 THE PERCENTAGE-BASED COMPOSITION PROTOCOL

The Star Wars: Regiment ruleset avoids flat "0-3" unit limits in favor of a dynamic, percentage-based scaling system. This ensures that as the total Points Cap of a game increases, the organizational requirements of the army scale proportionally. The engine handles this complexity through two primary data keys in the unit object: `min_pct` and `max_pct`.

- **The Minimum Floor ($min\_pct$):** Defines the "Core" of the army. If a unit (e.g., Rebel Troopers) has a $15\%$ minimum, the player must spend at least $15\%$ of their total cap on that unit type before the list is considered legal.
- **The Maximum Ceiling ($max\_pct$):** Prevents "Spamming" of elite or niche units. If a unit (e.g., Death Troopers) is capped at $15\%$, the player cannot exceed that point value, effectively limiting the quantity based on the unit's individual cost.

## 3.2 MATHEMATICAL ENFORCEMENT: CALCULATELIMITS()

Every time the Points Cap is adjusted or a unit is added, the engine executes the `calculateLimits(unit, cap)` function. This function transforms abstract percentages into concrete unit counts (integers).

$$Ceiling = \lceil Cap \times \frac{max\_pct}{100} \rceil$$
$$Floor = \lceil Cap \times \frac{min\_pct}{100} \rceil$$

- **Rounding Logic:** The engine uses `Math.ceil` to ensure that partial points are rounded up, granting the player the benefit of the doubt when they are within a few points of a threshold.
- **Dynamic Quantity Caps:** The function returns a `min` and `max` unit count. If a unit's individual cost is higher than the calculated ceiling, the `maxUnits` is set to $0$, effectively "locking" the unit out of low-point games.

## 3.3 VARIABLE MOVEMENT LOGIC: THE MAX/MIN PROTOCOL

Unlike standard infantry, certain units in Star Wars: Regiment (specifically Aerial vehicles and high-velocity speeders) are subject to "Momentum Rules." To reflect this, the engine supports a dual-value movement system.

- **Standard Max Move (`mv`):** The primary value representing the maximum distance a unit can travel in a single activation.
- **Minimum Move Floor (`mv_min`):** A specialized constraint. If this value is present (non-null), the unit _must_ move at least this distance to avoid stalling or crashing.
- **The UI Formatter:** The `formatStat()` function detects the presence of `mv_min`. If a unit has $mv: 12$ and $mv\_min: 4$, the UI renders the stat as **4"-12"**. If the unit is stationary (e.g., a Turbolaser Tower), it renders as **0"**.

## 3.4 REAL-TIME VALIDATION AND THE "ILLEGAL" STATE

Validation is not a post-process "Check My List" button; it is a continuous loop triggered by the `updateUI()` function.

- **The CSS "Illegal" Class:** When a unit's quantity falls outside the `min` or `max` range, the engine injects the `.illegal` class into that unit's Roster Row and Manifest Item. This triggers a visual shift (typically a red background or border) and provides a descriptive text update (e.g., "Allowed: 2 to 4").
- **Button Locking:** To prevent users from accidentally clicking into an illegal state, the "+" stepper buttons are automatically disabled once the calculated `maxUnits` is reached.
- **Override Bypass:** If the "Manual Override" toggle is active, the engine continues to calculate and display the legality status but removes the button-lock restriction, allowing for "Open Play" configurations.

## 3.5 OTS (OFF-TABLE SUPPORT) CONSTRAINTS

Support assets (Artillery, Strafing Runs, Orbital Bombardment) are governed by a separate, hardcoded dual-validation logic within the rules engine:

1.  **The 15% Point Cap:** No more than $15\%$ of the total Points Cap can be allocated to the `ots` category.
2.  **The Card Count Ceiling:** Players are limited to $1$ OTS card per full $250$ points of the cap.

The engine tracks these two values concurrently. If _either_ limit is exceeded, all "+" buttons for OTS assets are locked, and the OTS Tracker in the header highlights the violation in red.

---

# SECTION 4: ADVANCED LIST CONSTRAINTS (OTS & BIDDING)

## 4.1 THE OFF-TABLE SUPPORT (OTS) SYSTEM

In Star Wars: Regiment, Off-Table Support (OTS) represents external assets such as orbital strikes, starfighter strafing runs, and long-range artillery. Unlike standard combat units, OTS assets do not occupy a physical space on the roster until they are deployed via card play. To prevent players from over-relying on these high-impact abilities, the engine enforces a specialized dual-limit constraint system.

- **Financial Constraint (The 15% Cap):** The total points spent on OTS assets cannot exceed 15% of the total army Points Cap. This ensures that the bulk of a player's points are invested in "boots on the ground" units.
- **Operational Constraint (The Card Count):** To reflect limited command-and-control resources, the engine restricts the total number of OTS cards allowed in a single manifest. This is calculated as one card per every full 250 points of the total cap.

## 4.2 MATHEMATICAL ENFORCEMENT OF OTS LIMITS

The `updateUI()` function constantly recalculates the OTS ceilings. These values are not static; they shift dynamically if the user adjusts the `armyCap` field in the persistent header.

**Example: A 1000-Point Army List**

1.  **Points Ceiling:** $1000 \times 0.15 = 150$ points available for OTS.
2.  **Card Ceiling:** $\lfloor 1000 / 250 \rfloor = 4$ cards allowed.

If a player selects three "Orbital Bombardment" cards at 50 points each, they have hit their 150-point ceiling, but only used 3 of their 4 card slots. The engine will lock the "+" buttons because the point limit has been reached.

## 4.3 THE INITIATIVE BIDDING PROTOCOL

One of the most critical tactical decisions in Star Wars: Regiment is the "Initiative Bid." In this system, players may choose to spend fewer points than the maximum cap to increase their chances of winning the initiative during the game's setup phase.

- **Bid Calculation:** The engine defines the Bid as: $Bid = Points\ Cap - Total\ Points\ Spent$.
- **The Bid Display:** The `bidDisplay` element in the builder header provides a real-time count of this value. It is highlighted to ensure the player is always aware of their current "buy-in" for initiative.
- **Strategic Trade-off:** A higher bid (leaving more points on the table) increases the probability of choosing the deployment zone or taking the first turn, but results in a physically smaller army on the tabletop.

## 4.4 INTERFACE FEEDBACK: THE OTS TRACKER

To provide clarity, the builder utilizes a dedicated `otsTracker` element. This UI component acts as a specialized "sub-dashboard" within the main header.

- **Dynamic Coloring:** The tracker displays the current state as a ratio (e.g., "120 / 150 pts | 3 / 4 cards").
- **Violation Warning:** If the user attempts to bypass these limits (while the Override Toggle is off), the tracker text shifts to `var(--danger)` (red), providing immediate visual notification of the illegal list state.
- **Stepper Locking:** The engine proactively disables the "add" (`+`) buttons for all OTS assets once the calculated limit is reached, preventing the player from entering an invalid state in the first place.

## 4.5 DATA CATEGORIZATION: THE OTS ARRAY

Unlike combat units, which are faction-locked, OTS assets are housed in a global `ots` array within `data.json`. This architecture allows the developer to define a universal pool of support assets that are accessible to all factions, while the `generateTTSJSON` function ensures that only the specifically selected assets are exported for game play. Each OTS asset includes:

- **Availability:** A dice-roll requirement for successful deployment.
- **Template:** The physical size of the card/effect (e.g., "3.5 x 2.5").
- **Attack Dice:** The raw power of the asset during a combat resolution.

---

# SECTION 5: LEADER ATTACHMENT & LOGIC VALIDATION

## 5.1 THE SINGLE-LEADER DOCTRINE

In the Star Wars: Regiment system, every army is a cohesive fighting force directed by a high-ranking officer or hero. To reflect this command structure, the engine enforces a strict "Single Leader" restriction. While a faction may have multiple available leaders in its `data.json` array (e.g., Vader, Tarkin, and Veers), only one may be active in the manifest at any given time.

- **Dynamic Locking:** When any leader’s quantity reaches 1, the `updateUI()` function scans all other leader entries in the roster. It automatically disables the "+" buttons for all remaining leaders, effectively "locking in" the player's choice.
- **Override Support:** If the "Manual Override" is enabled, this lock is released, allowing users to build "Hero-Heavy" lists for narrative scenarios or testing purposes.

## 5.2 THE TRI-FACTOR ATTACHMENT SCHEMA

Leaders are rarely "lone wolves"; they must be attached to a specific unit type to function. The engine validates this attachment through a specialized $AND$ logic check against three optional parameters found in the leader object:

1.  **`requires_class`**: Validates the leader against a unit's primary category (e.g., "Infantry").
2.  **`requires_subclass`**: Validates against a specific movement or armor type (e.g., "Walker").
3.  **`requires_unit`**: The most restrictive check, requiring a specific unit ID match (e.g., "emp_atat").

If any of these keys are set to `null` in the JSON, the engine treats that specific check as automatically "passed," allowing for flexible attachment rules (e.g., a leader who can join _any_ Infantry unit regardless of subclass).

## 5.3 TECHNICAL VALIDATION: THE $AND$-LOGIC LOOP

The validation process occurs inside the `updateUI()` function. For every leader selected, the engine executes a nested search through the currently purchased units.

- **Cumulative Truth Tracking:** The engine starts with a `hasValidAttachment = false` state.
- **The Match Sequence:**
  - If `requires_unit` is defined, it checks if that specific unit ID exists in `currentList` with a quantity $> 0$.
  - If not restricted by ID, it iterates through all purchased units and checks:
    - `(!l.requires_class || u.class === l.requires_class)`
    - **AND** `(!l.requires_subclass || u.subclass === l.requires_subclass)`
- **The Final Verdict:** If a match is found that satisfies all active conditions, the attachment is marked as "Valid."

## 5.4 INTERFACE FEEDBACK AND ILLEGAL STATES

Because attachment is a prerequisite for a legal list, the UI provides high-visibility feedback for leader status.

- **The Manifest Alert:** Within the manifest sidebar, a leader’s subtext will dynamically switch between **"Attachment Status: Valid"** and **"Attachment Status: Missing Required Unit."**
- **Illegal Highlighting:** If a leader is selected but no valid attachment unit is present in the list, the entire Roster Row for that leader is injected with the `.illegal` class, turning the row red to demand the player's attention.
- **Quantity Limits:** Even with Override active, the engine tracks if a player has more than 1 of a specific named leader. Since these are unique characters, having a quantity $> 1$ will always trigger an illegal state warning.

## 5.5 DATA SCHEMA FOR LEADERS

The following is an example of a leader object within the `data.json` file, demonstrating how the attachment keys are structured:

```json
{
  "id": "ldr_veers",
  "name": "General Veers",
  "cost": 40,
  "restriction_text": "Must be attached to a Walker unit.",
  "requires_class": null,
  "requires_subclass": "Walker",
  "requires_unit": null,
  "ability": "Any friendly unit within 24\" of General Veers gains a +1 bonus to their Command Roll.",
  "logic": {
    "trigger": "on_command",
    "target": "aura",
    "radius": 24,
    "effect": "modify",
    "stat": "cv",
    "value": 1
  },
  "tts_image": "[https://example.com/veers.png](https://example.com/veers.png)"
}
```

---

# SECTION 6: APPLICATION LIFECYCLE & STATE RECOVERY

## 6.1 THE AUTO-SAVE ARCHITECTURE

To provide a modern, resilient user experience, the Star Wars: Regiment Army Builder implements a non-intrusive "Auto-Save" system. This system ensures that a player's progress is preserved across accidental page refreshes, browser crashes, or intentional session breaks. Unlike applications that require manual saving, this engine utilizes a "Reactive Save" pattern.

- **Trigger Mechanism:** The `saveState()` function is positioned as the final operation within the `updateUI()` loop. This means that every single interaction—be it adding a unit, changing the points cap, or toggling an override—triggers an immediate update to the browser's persistent storage.
- **Storage Medium:** The application leverages the `window.localStorage` API. This allows for the storage of key-value pairs locally within the user's browser, requiring no server-side database or user accounts, thus maintaining the builder's lightweight, privacy-focused architecture.

## 6.2 DATA PERSISTENCE SCHEMA

When `saveState()` is invoked, the engine compiles a serialized JavaScript object containing the minimum necessary data to reconstruct the current application state. This object is stored under the key `"regimentBuilderState"` and includes:

1.  **`cap`**: The current user-defined points limit.
2.  **`factionId`**: The unique identifier of the currently active faction.
3.  **`roster`**: A copy of the `currentList` object, mapping unit IDs to quantities.
4.  **`lastUpdated`**: A high-precision Unix timestamp (`Date.now()`) representing the exact moment of the save.

## 6.3 TIME-BASED SESSION EXPIRY

To prevent the application from becoming "locked" into an old, unfinished, or irrelevant army list from a previous day, a 6-hour session expiry logic is enforced. This ensures the workspace remains clean while still allowing for short-term interruptions.

- **The Expiry Constant:** The engine defines an `expiryTime` of $1,800,000$ milliseconds ($30\ minutes \times 60\ seconds \times 1000\ ms$).
- **The Validation Check:** During the `loadState()` sequence, the engine retrieves the `lastUpdated` timestamp from the saved data and compares it against the current time.
  - **IF** $(Now - LastUpdated) > ExpiryTime$: The engine executes `localStorage.removeItem()`, effectively wiping the stale data and forcing the user to the Home Screen.
  - **ELSE**: The data is deemed valid, and the builder proceeds to reconstruct the roster.

## 6.4 ASYNCHRONOUS INITIALIZATION: THE BOOTSTRAP SEQUENCE

Because the application relies on an external `data.json` file, the initialization process follows a strict asynchronous "Bootstrap" sequence. This prevents the UI from attempting to render units that have not yet been fetched from the server.

1.  **Event Listeners:** The `DOMContentLoaded` event triggers an `async` arrow function.
2.  **Data Fetching:** The engine executes `fetch('data.json')`. If the fetch fails (e.g., due to a server error or a syntax error in the JSON), a `try-catch` block catches the error and alerts the user, preventing a silent application failure.
3.  **Global Assignment:** Once the JSON is parsed, it is assigned to the `REGIMENT_DATA` global variable.
4.  **State Loading:** The `loadState()` function is called. If valid data exists, it populates the global `currentList` and `selectedFactionId`.
5.  **View Rendering:** Finally, `loadBuilderView()` is called. If no state was found (or if it expired), the engine defaults to the `initializeHomeScreen()` view.

## 6.5 DATA INTEGRITY AND ROBUSTNESS

The lifecycle management includes several safety checks to prevent "Application Hang" scenarios:

- **JSON Validation:** By using `response.ok` checks during the fetch, the engine ensures it doesn't try to parse a 404 error page as game data.
- **Parsing Safety:** The `loadState()` function is wrapped in a `try-catch` block. If a user manually edits their `localStorage` or if the data becomes corrupted, the engine will gracefully clear the storage and reset to factory defaults rather than crashing the interface.

---

# SECTION 7: EXPORT ECOSYSTEM & INTEROPERABILITY

## 7.1 MULTI-MODAL DATA DISSEMINATION

The Star Wars: Regiment Army Builder is designed with the understanding that an army list must exist in multiple environments: digital chat rooms, physical tabletops, and competitive tournament records. To support this, the engine features a robust "Export Suite" that transforms the internal `currentList` state into four distinct, high-fidelity reporting formats.

## 7.2 THE SIMPLE TEXT GENERATOR: GENERATESIMPLETEXT()

The Simple Text export is a lightweight, markdown-compatible string intended for rapid communication on platforms like Discord, Slack, or forum threads.

- **The Categorization Loop:** The function iterates through the `currentList` object and cross-references each ID against the `REGIMENT_DATA` arrays. It dynamically builds three string buffers: `leaderText`, `unitsText`, and `otsText`.
- **The Condensed Format:** Each entry is reduced to a single line: `[Quantity]x [Name] [[Cost] ea | [Total] pts]`.
- **Final Summary:** The output concludes with the Total Spent and the calculated Initiative Bid, ensuring that a quick glance provides all the essential information needed for a game match-up.

## 7.3 THE DETAILED MANIFEST: GENERATEDETAILEDTEXT()

The Detailed Manifest is a comprehensive tactical document. It is designed to be the definitive reference for a player during a live game, eliminating the need to constantly refer back to the digital builder or a rulebook.

- **Stat Mapping:** Unlike the Simple Text, this function pulls every combat statistic from the JSON ($Mv$, $Atk$, $Rng$, $Wnd$, $Sv$) and formats them using the `formatStat()` helper.
- **Ability Integration:** For Leaders and Units, the function injects the full `ability` or `desc` strings directly into the manifest.
- **The Dynamic Keyword Glossary:** This is the manifest's most advanced feature. As the engine iterates through units, it populates a `usedKeywords` Set. At the end of the process, the engine loops through this set and fetches the corresponding definitions from the `REGIMENT_DATA.definitions` master list. This creates a bespoke "Glossary of Terms" specific only to the keywords present in that particular army.

## 7.4 BASE64 SHARE CODES: PORTABLE STATE STRINGS

Share Codes allow users to transmit their exact list configuration without a centralized database. This is achieved through a three-step serialization process:

1.  **State Capture:** The `generateShareCode()` function creates a "Mini-State" object containing the Faction ID, Points Cap, and the Roster object.
2.  **Serialization:** This object is converted into a JSON string via `JSON.stringify()`.
3.  **Encoding:** The string is encoded into a Base64 string using the `btoa()` API.

The resulting alphanumeric string is URL-safe and can be pasted into the "Load Code" input field. The `loadFromShareCode()` function reverses this process, decoding the Base64 and re-initializing the `currentList` and `selectedFactionId` variables, followed by a full UI re-render.

## 7.5 THE PRINT ARCHITECTURE: PRINTDETAILEDLIST()

For players who prefer physical media, the builder includes a dedicated print sub-system. This function bypasses the standard browser "Print Page" command (which often includes UI buttons and sidebars) in favor of a sanitized, document-only output.

- **Sandboxed Window:** The engine utilizes `window.open()` to create a temporary, blank browser instance.
- **CSS Injection:** A specialized `<style>` block is injected into the new window's head, enforcing a **monospaced font** (e.g., Courier) and `white-space: pre-wrap`. This ensures the manifest retains its indented, "computer terminal" aesthetic.
- **Asynchronous Dialog:** The function uses a 250ms `setTimeout()` before calling `printWindow.print()`. This slight delay ensures that the DOM has fully rendered the text content before the print dialog interrupts the browser's execution thread.

## 7.6 THE CLIPBOARD UTILITY: COPYTOCLIPBOARD()

To bridge the gap between the builder and external apps, the `copyToClipboard()` function utilizes the modern `navigator.clipboard.writeText()` API.

- **UI Validation:** Upon a successful copy, the function temporarily changes the source button's text to "Copied!" and applies a `.btn-success` (green) class.
- **Self-Reverting State:** A 2-second timer is initiated to automatically revert the button to its original state, providing a polished and responsive "App-like" feel for the user.

---

# SECTION 8: TABLETOP SIMULATOR (TTS) "DUMB READER" PROTOCOL

## 8.1 THE INTEGRATION PHILOSOPHY: THE "DUMB" EXTERNAL READER

The Star Wars: Regiment Army Builder is designed to function as the "Brain" for digital play. To minimize the complexity and maintenance of Tabletop Simulator (TTS) Lua scripts, the engine employs a "Dumb Reader" protocol. In this architecture, the TTS Lua script does not perform any math, validation, or stat lookups. Instead, it simply "reads" a pre-processed JSON string generated by the web builder and spawns objects accordingly.

This approach ensures that if a unit's stats change, the developer only needs to update the central `data.json` file. The TTS environment will automatically reflect these changes the next time a list is imported, requiring zero changes to the in-game Lua code.

## 8.2 THE SELECTIVE MAPPING PROCESS: GENERATETTSJSON()

The `generateTTSJSON()` function is the most computationally "opinionated" exporter in the suite. While other exporters (like the Detailed Manifest) dump as much data as possible, the TTS exporter intentionally filters the data to optimize for performance and character limits within the TTS UI text fields.

- **Logic Stripping:** The complex "Simulation Logic" blocks (triggers, targets, effects) used by the web-simulator are completely stripped from the TTS export. These blocks are irrelevant to the physical movement of models in a 3D sandbox.
- **Builder-Limit Removal:** Metadata such as `min_pct` and `max_pct` is discarded. By the time a user is exporting to TTS, the list is assumed to be legal or intentionally overridden.
- **Key Explicit Mapping:** Instead of using a spread operator (`...unit`), the function manually maps specific keys. This ensures that even if the internal JSON structure changes, the output to TTS remains consistent with what the Lua script expects.

## 8.3 DATA ATTRIBUTE MAPPING (JSON TO LUA)

The exported JSON object is structured into three primary arrays: `metadata`, `units`, and `ots`. The TTS Lua script iterates through these to populate model descriptions and spawn parameters.

- **`mv` and `mv_min`**: These are passed as raw integers. The Lua script then appends the inch symbol (`"`) during the description-building phase.
- **Combat Stats**: `atk_ranged`, `atk_melee`, `rng_short`, `rng_long`, `wnd`, and `sv` are passed as explicit keys.
- **`unit_size`**: Critical for the spawning loop. If a unit has a `unit_size` of 3, the Lua script will execute its `spawnObject` loop three times for every one unit entry in the JSON.

## 8.4 ASSET HANDLING AND 3D MAPPING

Tabletop Simulator requires specific raw URLs to render custom 3D models. The builder ensures these are delivered in a format the `spawnObject` function can digest via the `setCustomObject` method.

- **The URL Trio:** `tts_model` (the .obj mesh), `tts_texture` (the .jpg or .png skin), and `tts_collider` (the simplified collision mesh).
- **The `tts_height` Attribute:** This is a specialized float value unique to the TTS integration. It defines the vertical offset (Y-axis) for the model's UI and buttons. For standard infantry, this is typically `1.0`. For "Floating" or "Aerial" units like Snowspeeders, this value is increased (e.g., `2.5`) to ensure the wound trackers and "Shaken" buttons hover correctly above the flying model rather than inside its mesh.

## 8.5 THE UNIT INSTANCE ID SYSTEM

To support advanced in-game features like wound tracking and "Shaken" status syncing across multiple models in a squad, the builder generates a unique `unitInstanceId`.

- **The Format:** `[UnitID]_[QuantityIndex]`. For example, if a player has two squads of Stormtroopers, the first squad's models will all share the ID `emp_strmt_1`, while the second squad shares `emp_strmt_2`.
- **Sync Logic:** When a player clicks a "Wound" button on one model in TTS, the Global Lua script uses this shared ID to update all other models in that specific instance, ensuring the squad's health remains synchronized as a single game entity.

## 8.6 MINIFIED VS. PRETTY-PRINT JSON

While the engine is capable of producing a minified, single-line string for maximum efficiency, the default `generateTTSJSON` output retains whitespace indentation (`null, 2`).

- **Human Readability:** This allows players to manually inspect the JSON if a model fails to spawn, making it easy to spot a broken URL or a missing bracket.
- **The Clipboard Bridge:** The string is returned directly to the `copyToClipboard()` utility, allowing the user to move from the web builder to the TTS "Import" text box in two clicks.

---

# SECTION 9: TECHNICAL ARCHITECTURE & DATA SCHEMA

## 9.1 THE LIGHTWEIGHT "VANILLA" STACK

The Star Wars: Regiment Army Builder is engineered using a "Lite-Stack" architecture, utilizing only native Web APIs (HTML5, CSS3, and Vanilla JavaScript). This decision was made to ensure zero external dependencies, eliminating the "Dependency Hell" often associated with modern frameworks like React or Vue. By staying close to the browser's metal, the application maintains sub-millisecond response times for complex validation loops and provides 100% compatibility across desktop and mobile browsers without the need for a build step or transpilation.

## 9.2 THE ASYCHRONOUS BOOTSTRAP: FETCH AND AWAIT

The most significant architectural shift in the project was the transition from a script-based data model (`data.js`) to a data-request model (`data.json`). Because the engine cannot render the UI without the database, the initialization sequence is strictly asynchronous.

- **The DOMContentLoaded Trigger:** The application waits for the browser to parse the HTML structure before executing the `async` initialization arrow function.
- **The Fetch Protocol:** The engine uses the `fetch()` API to request `data.json` from the local server.
- **The Await Pattern:** By using `await response.json()`, the engine pauses its execution thread specifically for the data retrieval. This prevents the "Race Condition" where the `renderRoster()` function might attempt to iterate through an empty `REGIMENT_DATA` object before the file has finished downloading.
- **Error Boundary:** The entire bootstrap is wrapped in a `try-catch` block. If the JSON is malformed (e.g., a missing comma) or the file is missing, the engine catches the error and alerts the user, providing a professional "fail-soft" experience.

## 9.3 DIRECTORY STRUCTURE AND FILE MANIFEST

The project is organized into a flat, transparent directory structure, making it easily maintainable by a single developer or a small team.

- `index.html`: The structural skeleton. It contains the entry points for the three primary views (Home, Builder, and Print) and the hidden UI elements for the TTS and Share Code overlays.
- `style.css`: The "Theme Engine." It utilizes CSS Variables (`--accent`, `--danger`, `--bg-color`) to allow for rapid UI re-skinning. It handles the responsive grid layout for the faction selection and the roster rows.
- `engine.js`: The "Brain." It contains all the math, validation logic, export generators, and event listeners.
- `data.json`: The "Memory." The centralized repository of all game facts, logic triggers, and asset links.
- `/icons/`: A dedicated folder containing SVG files named exactly after the `faction_id` (e.g., `reb_all.svg`).
- `/assets/`: (Optional) Local storage for 3D meshes or textures if not being hosted via an external CDN.

## 9.4 THE DATA.JSON SCHEMA HIERARCHY

The `data.json` file follows a strict, hierarchical tree structure. This allows the engine to access specific unit data via simple dot notation (e.g., `REGIMENT_DATA.factions[0].units[5].mv`).

1.  **Factions Array:** The top-level container for all playable groups.
    - **Metadata:** `id`, `name`, `type`, `command_value`.
    - **Leaders Array:** Sub-objects containing the Tri-Factor attachment logic and simulation keys.
    - **Units Array:** The primary combat unit objects, including stats, limits, and TTS URLs.
2.  **OTS Array:** A global pool of Off-Table Support assets available to all factions.
3.  **Definitions Object:** A key-value pair map where the key is the Keyword (e.g., "Anti-Armor") and the value is an object containing both the `desc` (string) and the `logic` (object).

## 9.5 DATA INTEGRITY AND JSON STRICTNESS

Because the application has moved to a pure JSON format, the developer must adhere to the RFC 8259 standard:

- **Double Quotes Only:** All keys and string values must be wrapped in `"`, not `'`.
- **No Trailing Commas:** The last item in an array or object must not be followed by a comma.
- **Null Handling:** Optional fields (like `mv_min` or `requires_unit`) should be explicitly set to `null` rather than omitted, ensuring the `engine.js` mapping functions always find a consistent key structure.

## 9.6 THE GLOBAL VARIABLE: REGIMENT_DATA

Once the JSON is successfully fetched and parsed, it is assigned to the `REGIMENT_DATA` global variable. From this point forward, the engine no longer communicates with the server; all unit lookups, cost calculations, and keyword definitions are performed against this in-memory object, resulting in the builder's signature "instant-feedback" user experience.

---

# SECTION 10: DEVELOPER MAINTENANCE & WORKFLOW

## 10.1 DATABASE STANDARDIZATION: THE DATA.JSON GUARDIAN

As the "Single Source of Truth," the `data.json` file is the most sensitive component of the Star Wars: Regiment ecosystem. Maintaining this file requires a disciplined approach to data entry to ensure the `engine.js` processing loops do not encounter "Undefined" or "Null Pointer" exceptions.

- **Strict Syntax Compliance:** Because the application has transitioned from JavaScript objects to pure JSON, all developers must strictly follow the RFC 8259 standard. Every key and string value must be wrapped in double quotes (`"`). Trailing commas at the end of arrays or objects are strictly prohibited and will cause the `fetch()` initialization to fail.
- **Key Consistency:** The engine expects a specific set of keys for every unit and leader. Even if a value is not applicable (e.g., a unit without a `mv_min` or a leader without `requires_unit`), the key must remain present and set to `null`. This prevents the "Dumb Reader" logic in the TTS exporter from breaking during object mapping.

## 10.2 ADDING NEW UNITS AND FACTIONS

Expanding the game roster is a purely additive process that requires no changes to the HTML or JavaScript files.

1.  **Unique ID Assignment:** Every new unit must be assigned a unique `id` string (e.g., `rep_delta_squad`). This ID acts as the primary key for `localStorage`, the TTS instance tracker, and the Base64 share codes.
2.  **Asset Linking:** When adding new models, the `tts_model`, `tts_texture`, and `tts_collider` fields must point to direct, raw URLs. If using Steam Cloud or a personal CDN, ensure the links do not point to "Viewer" pages, but to the raw files themselves.
3.  **UI Feedback:** Use the `unit_size` attribute to tell the engine how many models are in the stand; this directly controls the spawning loop in the Tabletop Simulator Lua script.

## 10.3 LEADER AND KEYWORD INTEGRATION

When adding a new Leader or Keyword, the developer must balance the player-facing description with the machine-readable simulation logic.

- **Glossary Entry:** When a new keyword is added to a unit’s `keywords` array, a matching entry must be created in the `definitions` object. The `desc` field should be written in clear, concise language for the Detailed Manifest's glossary.
- **Logic Schema Mapping:** Even if the simulation engine is not currently in use, new leaders should be defined with `trigger`, `target`, and `effect` keys. This ensures that the database remains "Sim-Ready" for future tactical testing modules.

## 10.4 THE VERIFICATION WORKFLOW

Before pushing updates to a live local server, a developer should perform a three-step "Sanity Check":

1.  **Console Verification:** Open the browser's Developer Tools (F12). If the builder loads to a blank screen, the console will pinpoint the exact line number of any JSON syntax errors.
2.  **Legality Testing:** Load the new faction and add units to check if the `min_pct` and `max_pct` math is rendering correctly. Verify that the "+" buttons lock as expected when limits are hit.
3.  **Manifest Audit:** Generate a "Detailed Manifest" and a "Print List." Check the bottom of the document to ensure the new keywords have been successfully parsed into the glossary. If a keyword appears as "[Definition Pending]," there is a typo mismatch between the unit's keyword array and the `definitions` object.

## 10.5 LOCAL SERVER AND CORS CONSIDERATIONS

Because the application uses the `fetch()` API for data ingestion, it cannot be run by simply double-clicking `index.html` (the `file://` protocol).

- **Development Environment:** Developers must use a local web server (e.g., VS Code "Live Server" extension, Python `http.server`, or Node.js `http-server`).
- **Production Deployment:** When moving the builder to a public host (GitHub Pages, Vercel, etc.), the `fetch('data.json')` path should remain relative to ensure portability.

## 10.6 VERSIONING AND THE "FORCE CLEAR" PROTOCOL

When significant changes are made to the `data.json` structure (e.g., renaming a key or changing a faction ID), older `localStorage` saves may become incompatible.

- **Manual Reset:** During development, the developer can clear a "stuck" state by typing `localStorage.clear()` into the browser console.
- **Session Expiry:** In production, the 6-hour expiry logic acts as an automated "Version Control" system, clearing out older, potentially incompatible list states from the user's cache after a short period of inactivity.

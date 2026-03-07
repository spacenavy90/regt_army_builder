# Star Wars: Regiment - Army Builder

A lightweight, browser-based list-building tool for the 6mm scale tabletop wargame **Star Wars: Regiment**. Designed for speed, ease of use, and quick sharing of army manifests.

## Features
- **Faction Management:** Support for Major (Empire, Rebels, Republic, Separatists) and Minor factions.
- **Rules Enforcement:** Dynamic points cap scaling, unit minimum/maximum percentages, and leader attachment validation.
- **OTS Support:** Integrated Off-Table Support (OTS) logic with card limits and point ceilings (15% of TPV).
- **Export Options:** - **Simple/Detailed TXT:** For Discord or printing.
  - **Share Codes:** Base64 encoded strings to save/load lists.
  - **TTS Integration:** (Coming Soon) Ready for Tabletop Simulator JSON importing.

## Local Setup
1. Clone the repository.
2. Ensure your faction icons (SVG) are in the `/icons` folder.
3. Open `index.html` in any modern web browser.

## Game Mechanics
* **Command Value:** Unique to each faction (Republic: 5+, Rebels/Empire/Gungans: 6+, Separatists: 7+).
* **OTS Limits:** Max 15% of total points and 1 card per 250 points.
* **Leaders:** Limit 1 per army. Must satisfy specific attachment restrictions (e.g., General Veers requires a Walker).

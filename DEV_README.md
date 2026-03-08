# Developer Guide: Star Wars Regiment Army Builder

This document outlines how to maintain and expand the underlying dataset for the builder without altering the engine logic.

## Architecture Overview
* `data.js`: The single source of truth for all game data. Contains the `REGIMENT_DATA` object.
* `engine.js`: Handles UI rendering, math, and validation. Never hardcode faction or unit data here.

## Adding or Editing Units
Units are housed within their respective faction's `units` array inside `REGIMENT_DATA.factions`.

**Required Unit Keys:**
* `id`: String. Must be entirely unique (e.g., `"emp_stormtroopers"`).
* `class`: String (`"Infantry"`, `"Emplacement"`, `"Vehicle"`, `"Titan"`, etc.).
* `subclass`: String or `null` (`"Aerial"`, `"Walker"`, `"Hover"`, `"Ground"`, etc.).
* `min_pct` / `max_pct`: Integer representing the percentage of the points cap required/allowed (e.g., `25`, `50`). Use `0` or `null` if no limit applies.
* **TTS Keys:** `tts_model`, `tts_texture`, `tts_collider` must exist as strings, even if empty for units. `"tts_image"`, and `"tts_card_front"` exist for new faction leaders and off-table support assets.

## Adding or Editing Leaders
Leaders are housed in the `leaders` array of their specific faction. A faction is restricted to 1 leader by the engine.

**Attachment Logic:**
The engine reads three specific keys to determine if a leader can be legally added to the army based on purchased units:
1.  `requires_class`: Looks for a matching primary class (e.g., `"Infantry"`).
2.  `requires_subclass`: Looks for a matching subclass (e.g., `"Walker"`).
3.  `requires_unit`: Looks for a strict unit `id` match (e.g., `"emp_stormtroopers"`).

If a key is set to `null`, the engine ignores that specific check. If multiple are defined, the engine enforces an strict AND condition (the unit must match all defined parameters).

## Adding Keyword Definitions
When adding a new keyword to a unit or OTS asset, append it to the `REGIMENT_DATA.definitions` object at the bottom of `data.js`. The Detailed Export function scans this object to generate the glossary.
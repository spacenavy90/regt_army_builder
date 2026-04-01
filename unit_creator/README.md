# Star Wars: Regiment Unit Architect and Balancing

## 1. Overview & Balancing Philosophy

The Regiment Balancing Algorithm (v3.4) is a high-fidelity mathematical framework designed to ensure competitive parity within a platoon-scale tabletop wargame. The core philosophy centers on "The Rebel Trooper Constant"—a fixed point of reference that dictates the value of every other unit in the galaxy.

Version 3.4 introduces a fundamental shift from static multipliers to a dynamic **Saturation-Weighted Engine**. This addresses the "Deathstar Effect," where hyper-elite units previously became too efficient by stacking high-impact keywords. By applying exponential taxes to high-value pillars, the engine enforces a diminishing return on investment, ensuring that a single 500-point unit cannot mathematically out-value three 150-point units of comparable role.

---

## 2. Mathematical Foundation: Anchor Units

Anchors are the immutable "truth" of the system. If the math for an anchor fails, the entire ecosystem drifts into imbalance.

### The Infantry Anchor: Rebel Troopers

- **Calculated Cost:** 40 pts
- **The "Golden Ratio":** This unit is designed to have an exactly equal split between durability and lethality.
- **Base Stats:** 3 Bases | 3 Wounds/Base | Move 6" | Save 6+ | CV 6+
- **Weaponry:** 2 Ranged Dice (8"/12") | 3 Melee Dice
- **Pillar Result:** BV (20.00) + AV (20.00) = 40.00 pts.

### The Vehicle Anchor: AT-ST Scout Walker

- **Calculated Cost:** 85 pts
- **Role:** Calibration of the "Armor 1" keyword and large-scale durability.
- **Base Stats:** 2 Bases | 4 Wounds/Base | Move 8" | Save 5+ | CV 6+
- **Weaponry:** 5 Ranged Dice (8"/16") | 3 Melee Dice
- **Keywords:** Armor 1 (Body)
- **Pillar Result:** BV (56.93) + AV (25.37) = ~82.30 raw (Standardized to 85).

---

## 3. The Logic Engine (Pillar Architecture)

The algorithm parses data through two distinct pillars: The **Body Value (BV)** and the **Action Value (AV)**. This separation prevents "cross-contamination," where a unit's high movement speed might accidentally inflate the value of its ranged weapons beyond logical limits.

### A. Pillar 1: Body Value (BV) - The Durability Metric

The BV calculates how much effort an opponent must exert to remove the unit from the board.

$$BV_{final} = Raw~BV \times \left(\frac{\max(Raw~BV, 20)}{20}\right)^{0.15}$$

#### Components of Raw BV:

1. **The Wound Pool:** (Total Bases × Wounds per Base) × 2.22. The 2.22 scalar is the "Infantry Wound Constant."
2. **Save Multipliers ($\Omega_{save}$):** \* `-` (No Save): 0.70x
   - `6+`: 1.00x (Baseline)
   - `5+`: 1.25x
   - `4+`: 1.66x
   - `3+`: 2.50x
3. **Maneuverability Factor ($\Omega_{move}$):**
   - **Base Mult:** $(Move + 6) / 12$. A standard 6" move is 1.0x.
   - **Speed Tax:** Tiered penalties for units that can outpace standard response times:
     - $Move > 8"$: 1.20x
     - $Move > 10"$: 1.50x
     - $Move > 12"$: 2.00x
   - **Restriction Discount:** High-speed flyers with $Move\_Min > 0$ receive a discount $(1.0 - (Move\_Min / 30))$ to compensate for forced movement paths.
4. **Armor Override ($\Omega_{armor}$):** If the `conditional_armor` effect is triggered via keywords (e.g., Armor X), the engine applies the highest multiplier found. Armor 1 is calculated as $1.1 + (0.2 \times \Omega_{save})$.

### B. Pillar 2: Action Value (AV) - The Lethality Metric

The AV calculates the unit's potential to degrade the enemy's army across varying ranges.

$$AV_{final} = Raw~AV \times \left(\frac{\max(Raw~AV, 20)}{20}\right)^{0.25}$$

#### Components of Raw AV:

1. **Range Projection ($\Omega_{range}$):** $((Short~Range \times 1.5) + Long~Range) / 24$. This weights the versatility of weapons that can hit targets at both point-blank and mid-range.
2. **Dice Score:**
   - **Ranged:** $(Total~Ranged~Dice \times \Omega_{range})$.
   - **Melee:** $(Total~Melee~Dice \times 0.6)$. Melee is discounted due to the "Approach Tax" (the risk of getting into range).
   - **Base AV:** $(Ranged~Score + Melee~Score) \times 1.75$.
3. **Reliability ($\Omega_{cv}$):** \* `7+` (Poor): 0.80x
   - `6+` (Average): 1.00x
   - `5+` (Elite): 1.15x
4. **Saturation Tax:** The AV pillar uses a 0.25 exponent, making it significantly more sensitive to over-stacking than the BV pillar. Lethality is always more unbalancing than survivability.

---

## 4. The Keyword Lexicon (Dynamic Formulas)

Keywords utilize the `formula_context` to scale based on unit stats. The logic engine uses a `eval()` wrapper to process these strings.

### Key Variables for Formulas:

- `bases`, `wnd`, `mv`, `mv_min`, `rng_s`, `rng_l`, `atk_r`, `atk_m`, `om_save`, `om_move`, `om_range`.

### Primary Logic Strings:

| Keyword         | Target | Formula / Logic             | Rationale                                                        |
| :-------------- | :----- | :-------------------------- | :--------------------------------------------------------------- |
| **Anti-Armor**  | Action | `1.35 + (atk_r * 0.08)`     | Specialist tax for degrading Armor X and saves.                  |
| **Blast**       | Action | `1.50 + (atk_r * 0.10)`     | Premium for ignoring cover; scales with volume of fire.          |
| **Indirect**    | Action | `1.0 + (rng_l / 24)`        | Scales with the area of the board threatened by arcing fire.     |
| **Omnipresent** | Body   | `1.25 + (om_save * 0.25)`   | 360-degree fire/flank immunity is worth more to high-save units. |
| **Scout**       | Body   | `10 * om_move`              | (Flat) Forward deployment is worth more to fast-moving units.    |
| **Droid**       | Body   | `1.05 + ((bases*wnd)*0.01)` | Suppression immunity via wound sacrifice; scales with health.    |

---

## 5. Class & Type Scaling Table

Before finalization, the pillars are multiplied by Type Modifiers to reflect universal class traits.

| Class / Sub-Type     | BV Mod | AV Mod | Logic                                                        |
| :------------------- | :----- | :----- | :----------------------------------------------------------- |
| **Infantry**         | 1.00   | 1.00   | The baseline for all calculations.                           |
| **Emplacement**      | 0.85   | 1.00   | Penalty for static positioning and lack of maneuver.         |
| **Vehicle (Walker)** | 0.90   | 0.95   | Built-in maneuverability vs. bulk of the chassis.            |
| **Vehicle (Aerial)** | 1.20   | 1.20   | Massive mobility/height premium (further speed taxes apply). |
| **Titan**            | 1.00   | 0.90   | Agility penalty; cannot utilize Dash or Cower rules.         |

---

## 6. Implementation & JSON Schema

Units and Keywords must adhere to the following schema for the `dataManager.js` to parse them into the library.

```json
{
  "id": "reb_trp",
  "name": "Rebel Troopers",
  "unit_size": 3,
  "cost": 40,
  "min_pct": 10,
  "max_pct": 30,
  "class": "Infantry",
  "subclass": null,
  "mv": 6,
  "mv_min": null,
  "atk_ranged": 2,
  "atk_melee": 3,
  "rng_short": 8,
  "rng_long": 12,
  "wnd": 3,
  "sv": "6+",
  "keywords": [],
  "tts_height": 1.0,
  "tts_model": "",
  "tts_texture": "",
  "tts_collider": ""
}
```

## 7. Development & Validation Workflow

### Phase 1: Structural Definition and Initial Calculation

The developer begins by defining the unit's raw attributes in the unit architect or directly within the data.json schema. This includes setting the base counts, wounds, movement, and offensive dice. Once defined, the unitCreatorUI calls the logicEngine. This initiates the first pass of the engine, which parses the unit's sub-type modifiers and keyword logic. The engine outputs a "Raw Total," representing the mathematical sum of the Body and Action pillars before saturation taxes are applied. This stage is purely data-driven and provides the baseline "Fair Value" for the unit’s physical presence on the board.

### Phase 2: The Saturation Audit

After the initial calculation, the developer must review the Verbose Audit Log in the right-hand panel. This document provides a line-by-line breakdown of how every point was generated. The critical focus here is the Saturation Processing section. If a unit's Action Value or Body Value has a high Anchor Ratio (typically above 3.0), the saturation exponents (0.15 for Body, 0.25 for Action) will begin to drive the cost up exponentially. The developer must determine if the unit is "Over-Stacked." If a unit carries too many high-multiplier keywords like Anti-Armor, Blast, and Indirect simultaneously, the resulting point cost may make the unit unplayable in a standard match. This audit phase is essential for identifying "Deathstar" units that look good on paper but are mathematically inefficient due to the saturation tax.

### Phase 3: Subjective Override and Role Refinement

While the logic engine is highly accurate for direct combatants, certain units possess utility that the math cannot fully capture. Examples include dedicated suicide units, pure logistics/transport vehicles, or units with highly situational rule-breaking keywords. In these instances, the developer utilizes the Override Points field in the Architect. This field allows for manual point adjustments based on playtest feel or specific tactical roles that fall outside the standard damage/durability curve. Overrides should be used sparingly and always documented with a rationale in the unit's metadata to prevent balance drift over time.

### Phase 4: Monte Carlo Simulation and Validation

The final stage involves the integrated Combat Simulator. The unit is subjected to 1,000 iterations of combat against the Rebel Trooper Anchor. The simulator calculates the "Point Efficiency" rating by comparing the unit's performance against its cost relative to the anchor. A perfectly balanced unit should maintain a Point Efficiency rating between 0.95x and 1.05x. If the unit consistently over-performs or under-performs beyond these margins, the developer must return to Phase 1 to adjust stats or Phase 3 to refine the point override. This simulation ensures that the unit is not only mathematically sound but also performs as intended in the "chaos" of a dice-driven environment.

### Phase 5: JSON Export and Integration

Once the unit passes the simulation phase, the developer clicks the COPY JSON button. This action performs three tasks: it formats the unit into a valid JSON object, updates the temporary local storage so the unit is immediately usable in the Unit Library, and copies the code to the system clipboard. The developer then navigates to the master data.json file in their repository and pastes the new unit into the appropriate faction array. This manual merge step ensures that only validated, simulated units are committed to the project's permanent database.

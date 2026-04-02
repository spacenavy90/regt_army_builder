# Leader Architect Manual: The Point Buy System

The **Leader Architect** is a precision tool designed to balance unique, rule-breaking commanders within the _Regiment_ 1000-point ecosystem. Inspired by the "Commander" philosophy of _Star Wars: Armada_, this system moves away from flat stat-padding and instead prices leaders based on their **Tier of Influence** and **Attachment Friction**.

---

## 1. Core Philosophy: The 50–100 Bracket

In _Regiment_, a leader is an "Army Philosophy" attached to a single unit. To maintain game balance:

- **The Floor (50 pts):** No leader, regardless of how specialized, costs less than 5% of a standard army.
- **The Ceiling (100 pts):** No leader should exceed 10% of the army cost, ensuring they remain force multipliers rather than the army itself.

---

## 2. The "Point Buy" Algorithm

The Architect uses a modular formula to determine the cost of an ability before applying a "Base Tax" and "Attachment Friction" discount.

$$Cost = \text{BaseTax} + \lceil (\sum \text{AbilityValue} \times \Omega_{AF}) \rceil$$

### A. Base Tax (30 pts)

This is the "entry fee" for any unique character. It represents the intrinsic value of having a Leader on the board (Morale, character keywords, and tactical flexibility).

### B. Ability Value Calculation

Each ability in the **Effect Stacker** is calculated using three variables and one discount:

1.  **Potency Value (PV):** Represents the raw "weight" of the rule being introduced.
    - **Minimal (10):** "Ribbon" abilities or minor flavor (e.g., ignoring specific rare terrain).
    - **Low-Mid (20):** Standard utility (e.g., +1 CV, simple rerolls).
    - **Mid-High (30):** Strong rule-breakers (e.g., +1 SV, most free Simple Actions).
    - **High (40):** Complex mechanics (e.g., multi-unit coordination, guaranteed successes).
    - **Legendary (50):** Game-defining (e.g., massive out-of-sequence actions or system-wide overrides).

2.  **Projection Multiplier (PM):** Represents the area of influence.
    - **Attached / Self (1.0x):** Only affects the leader's unit.
    - **Tight Aura 4" (1.2x):** Requires base-to-base or very close support.
    - **Standard Aura 8" (1.5x):** The baseline for most battlefield commanders.
    - **Command Aura 12" (1.8x):** Massive zone of influence.
    - **Global / Meta (2.0x):** Affects the entire board or game-wide systems (Initiative/Morale).

3.  **Frequency Multiplier (FM):** Represents how often the ability triggers.
    - **Passive / Always On (1.0x):** Constant benefit.
    - **Once Per Turn (0.9x):** High reliability with a hard cap.
    - **Phase-Limited (0.8x):** Only works in specific contexts (e.g., only in Close Combat).
    - **Triggered / Reactive (0.6x):** Conditional (e.g., "When this unit takes a wound").
    - **Once Per Game (0.3x):** Significant discount for "one-shot" powers.

4.  **Risk Discount (RD):** A rebate for abilities that require a sacrifice.
    - **None (0):** Safe leadership.
    - **Minor Drawback (5):** Opponent gains a slight edge or information.
    - **Moderate Sacrifice (12):** Requires taking a Wound or Shaken token to activate.
    - **Severe Sacrifice (20):** Requires destroying a friendly base or permanent stat reduction.

---

## 3. Step-by-Step Architecture

### Step 1: Identity & Restrictions

Fill out the **Leader Name** and **Faction**. Before adding abilities, define the **Attachment Friction (AF)**. The more you restrict a leader, the more you discount their abilities:

- **Universal:** No discount (1.0x multiplier).
- **Class (e.g., Infantry):** 10% discount (0.9x multiplier).
- **Subclass (e.g., Walker):** 20% discount (0.8x multiplier).
- **Specific Unit:** 30% discount (0.7x multiplier).

### Step 2: The Effect Stacker

Click **+ ADD NEW EFFECT** for every distinct rule the leader possesses. Use the **Category** dropdown to define the mechanical intent:

- **Stat & Rule Overrides:** Mathematical buffs to SV, ATK, or dice results.
- **Action Economy:** Granting free actions or altering the 2d6 command logic.
- **Status & Morale:** Manipulating Shaken tokens or Morale Tracker scoring.
- **Movement & Maneuver:** Breaking the physics of pivots or speed.
- **Strategic Deployment:** Reserved for Ambush, Infiltrate, or redeployment rules.
- **Casualty & Reactionary:** Effects that trigger when units are destroyed.
- **Enemy Disruption:** Targeted debuffs or "taxes" placed on the opponent.
- **Meta-Game Manipulation:** Direct interaction with the Initiative bag or Stratagem cards.

### Step 3: Generation & Auditing

- **Generate Point Cost:** Outputs a detailed **Audit Log** to the right panel. Check this to see the raw math behind your PV, PM, and FM choices.
- **Preview JSON:** Check the data structure to ensure all logic blocks are present.
- **Overrides:** Use the **Override Pts** field to manually set a cost if the lore warrants a specific price not captured by the math.

---

## 4. Case Study Walkthroughs

### The "Soresu Master" (Obi-Wan Kenobi)

- **Setup:** Restricted to **Infantry** ($0.9x$ AF).
- **Effect 1:** PV 30 (Mid-High), Attached (1.0x), Passive (1.0x).
- **Math:** $30_{base} + (30 \times 0.9) = 57$
- **Result:** **60 PTS** (Rounded up).

### The "Grand Strategist" (Thrawn)

- **Setup:** Universal ($1.0x$ AF).
- **Effect 1:** PV 40 (High), Meta/Global (1.5x), Once Per Turn (0.9x), Risk (5).
- **Math:** $30_{base} + (40 \times 1.5 \times 0.9) - 5 = 79$
- **Result:** **80 PTS** (Rounded up).

---

## 5. UI Tips

- **ID Overrides:** Always use a unique ID (e.g., `ldr_rep_rex_501`) if creating variants of the same character to prevent library overwrites.
- **Floor Check:** The Architect strictly enforces a **50 PT** minimum to ensure even "weak" leaders represent a meaningful investment.
- **Independent Scrolling:** The left panel scrolls independently from the JSON/Audit preview, allowing you to add unlimited effects without losing sight of the output.

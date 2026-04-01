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

1.  **Potency Value (PV):** \* **Low (15):** Minor stat buffs (e.g., +1 CV, simple rerolls).
    - **Medium (25):** Primary stat overrides (e.g., 3+ Save), or granting a free Simple Action.
    - **High (40):** System breakers (e.g., Meta-game manipulation, guaranteed Complex Actions).
2.  **Projection Multiplier (PM):** \* **Attached (1.0x):** Only affects the leader's unit.
    - **Aura 6" (1.5x):** Affects nearby units (encourages clumping).
    - **Global/Meta (2.0x):** Affects the entire board or the game's initiative system.
3.  **Frequency Multiplier (FM):**
    - **Passive (1.0x):** Always on.
    - **Once Per Turn (0.9x):** High reliability but limited.
    - **Triggered (0.7x):** Situational (e.g., "When Charged").
    - **Once Per Game (0.4x):** Minimal consistency tax.
4.  **Risk Discount (RD):** \* Reduces the cost by **5** or **10** points if the player must suffer a penalty (e.g., taking a wound or a Shaken token) to use the power.

---

## 3. Step-by-Step Architecture

### Step 1: Identity & Restrictions

Fill out the **Leader Name** and **Faction**. Before adding abilities, define the **Attachment Friction (AF)**. The more you restrict a leader, the more you discount their abilities:

- **Universal:** No discount (1.0x multiplier).
- **Class (e.g., Infantry):** 10% discount (0.9x multiplier).
- **Subclass (e.g., Walker):** 20% discount (0.8x multiplier).
- **Specific Unit:** 30% discount (0.7x multiplier).

### Step 2: The Effect Stacker

Click **+ ADD NEW EFFECT** for every distinct rule the leader possesses.

- _Example:_ If Vader has a "Fearless" keyword aura and a "Force Choke" attack bonus, these should be two separate rows in the stacker.
- Use the **Category** dropdown to label the ability for the JSON export (Physics, Time, Attrition, or Player).

### Step 3: Generation & Auditing

- **Generate Point Cost:** This is your debugging tool. It outputs a detailed "Audit Log" to the right panel, showing exactly how the PV, PM, and FM interacted to reach the final number.
- **Preview JSON:** Use this to check the raw data structure before copying.
- **Overrides:** If the math feels "off" for a specific lore reason, use the **Override Pts** field. The badge and JSON will update instantly.

---

## 4. Case Study Walkthroughs

### The "Soresu Master" (Obi-Wan Kenobi)

- **Setup:** Restricted to **Infantry** ($0.9x$ AF).
- **Effect 1:** PV 25 (Medium), Attached (1.0x), Passive (1.0x).
- **Math:** $30_{base} + (25 \times 0.9) = 52.5$
- **Result:** **55 PTS** (Rounded up).

### The "Grand Strategist" (Thrawn)

- **Setup:** Universal ($1.0x$ AF).
- **Effect 1:** PV 40 (High), Meta (1.5x), Once Per Turn (0.9x).
- **Math:** $30_{base} + (40 \times 1.5 \times 0.9) = 30 + 54 = 84$
- **Result:** **85 PTS** (Rounded up).

---

## 5. UI Tips

- **ID Overrides:** If you are making multiple versions of the same character (e.g., "Anakin (Padawan)" vs "Anakin (Knight)"), use the **Override ID** field to ensure they don't overwrite each other in your library.
- **Floor Check:** If your math results in a 35-point leader, the Architect will automatically bump them to **50 PTS** to respect the minimum power threshold.

const REGIMENT_DATA = {
  factions: [
    {
      id: "reb_all",
      name: "Rebel Alliance",
      type: "Major",
      units: [
        { 
          id: "reb_trp", 
          name: "Rebel Troopers", 
          unit_size: 3,
          cost: 40, 
          min_pct: 15, 
          max_pct: null, 
          class: "Infantry",
          subclass: null,
          mv: 6, mv_max: null,
          atk_ranged: 2, atk_melee: 3,
          rng_short: 8, rng_long: 12,
          wnd: 3, sv: "6+",
          keywords: [] 
        },
        { 
          id: "reb_pth", 
          name: "Rebel Pathfinders", 
          unit_size: 2,
          cost: 75, 
          min_pct: 0, 
          max_pct: 30, 
          class: "Infantry",
          subclass: null,
          mv: 6, mv_max: null,
          atk_ranged: 2, atk_melee: 3,
          rng_short: 10, rng_long: 12,
          wnd: 3, sv: "5+",
          keywords: ["Clone"] 
        },
        { 
          id: "reb_tau", 
          name: "Tauntaun Riders", 
          unit_size: 2,
          cost: 90, 
          min_pct: 0, 
          max_pct: 40, 
          class: "Vehicle",
          subclass: "Ground",
          mv: 10, mv_max: null,
          atk_ranged: 2, atk_melee: 2,
          rng_short: 8, rng_long: 12,
          wnd: 2, sv: "5+",
          keywords: [] 
        },
        { 
          id: "reb_aa5", 
          name: "A-A5 Transport", 
          unit_size: 1,
          cost: 100, 
          min_pct: 0, 
          max_pct: 40, 
          class: "Vehicle",
          subclass: "Hover",
          mv: 8, mv_max: null,
          atk_ranged: 2, atk_melee: 2,
          rng_short: 8, rng_long: 12,
          wnd: 2, sv: "4+",
          keywords: ["Transport"] 
        },
        { 
          id: "reb_ptw", 
          name: "P-Tower", 
          unit_size: 1,
          cost: 150, 
          min_pct: 0, 
          max_pct: 60, 
          class: "Emplacement",
          subclass: null,
          mv: 0, mv_max: null,
          atk_ranged: 5, atk_melee: 1,
          rng_short: 14, rng_long: 24,
          wnd: 3, sv: "4+",
          keywords: ["Anti-Armor"] 
        },
        { 
          id: "reb_snw", 
          name: "Snowspeeder", 
          unit_size: 1,
          cost: 110, 
          min_pct: 0, 
          max_pct: 35, 
          class: "Vehicle",
          subclass: "Aerial",
          mv: 4, mv_max: 14,
          atk_ranged: 3, atk_melee: null,
          rng_short: 10, rng_long: 16,
          wnd: 4, sv: "4+",
          keywords: ["Tow-Cable"] 
        }
      ]
    },
    {
      id: "emp_all",
      name: "Galactic Empire",
      type: "Major",
      units: [
        { 
          id: "emp_stm", 
          name: "Stormtroopers", 
          unit_size: 3,
          cost: 50, 
          min_pct: 15, 
          max_pct: null, 
          class: "Infantry",
          subclass: null,
          mv: 6, mv_max: null,
          atk_ranged: 2, atk_melee: 3,
          rng_short: 8, rng_long: 12,
          wnd: 3, sv: "5+",
          keywords: [] 
        },
        { 
          id: "emp_dth", 
          name: "Death Troopers", 
          unit_size: 2,
          cost: 75, 
          min_pct: 0, 
          max_pct: 15, 
          class: "Infantry",
          subclass: null,
          mv: 6, mv_max: null,
          atk_ranged: 3, atk_melee: 3,
          rng_short: 10, rng_long: 12,
          wnd: 3, sv: "5+",
          keywords: ["Fearless"] 
        },
        { 
          id: "emp_hvy", 
          name: "Heavy Weapons Teams", 
          unit_size: 2,
          cost: 90, 
          min_pct: 0, 
          max_pct: 40, 
          class: "Infantry",
          subclass: null,
          mv: 4, mv_max: null,
          atk_ranged: 4, atk_melee: 2,
          rng_short: 12, rng_long: 20,
          wnd: 3, sv: "5+",
          keywords: ["Anti-Armor"] 
        },
        { 
          id: "emp_trp", 
          name: "Imperial Transport", 
          unit_size: 1,
          cost: 100, 
          min_pct: 0, 
          max_pct: 60, 
          class: "Vehicle",
          subclass: "Hover",
          mv: 8, mv_max: null,
          atk_ranged: 2, atk_melee: 2,
          rng_short: 8, rng_long: 12,
          wnd: 2, sv: "4+",
          keywords: ["Transport"] 
        },
        { 
          id: "emp_ats", 
          name: "AT-ST", 
          unit_size: 2,
          cost: 150, 
          min_pct: 0, 
          max_pct: 75, 
          class: "Vehicle",
          subclass: "Walker",
          mv: 8, mv_max: null,
          atk_ranged: 3, atk_melee: 3,
          rng_short: 10, rng_long: 14,
          wnd: 3, sv: "4+",
          keywords: [] 
        },
        { 
          id: "emp_tbo", 
          name: "Turbolaser Tower", 
          unit_size: 1,
          cost: 110, 
          min_pct: 0, 
          max_pct: 35, 
          class: "Emplacement",
          subclass: null,
          mv: 0, mv_max: null,
          atk_ranged: 6, atk_melee: null,
          rng_short: 14, rng_long: 24,
          wnd: 3, sv: "4+",
          keywords: ["Anti-Armor"] 
        },
        { 
          id: "emp_ata", 
          name: "AT-AT", 
          unit_size: 1,
          cost: 300, 
          min_pct: 0, 
          max_pct: 60, 
          class: "Titan",
          subclass: "Walker",
          mv: 6, mv_max: null,
          atk_ranged: 5, atk_melee: 6,
          rng_short: 12, rng_long: 24,
          wnd: 6, sv: "3+",
          keywords: ["Anti-Armor", "Heavy Armor", "Towering", "Transport"] 
        }
      ]
    }
  ],

  ots: [
    { 
      id: "ots_mortar", 
      name: "Mortar Attack", 
      cost: 20, 
      availability: "4+", 
      template: "Single Card (3.5\" x 2.5\")",
      attack_dice: 3,
      keywords: []
    },
    { 
      id: "ots_strafing", 
      name: "Strafing Run", 
      cost: 35, 
      availability: "5+", 
      template: "Double Card - Long (7\" x 2.5\")",
      attack_dice: 4,
      keywords: ["Anti-Armor"]
    },
    { 
      id: "ots_artillery", 
      name: "Artillery Barrage", 
      cost: 50, 
      availability: "6+", 
      template: "Double Card - Wide (5\" x 3.5\")",
      attack_dice: 6,
      keywords: ["Anti-Armor"]
    },
    { 
      id: "ots_orbital", 
      name: "Orbital Bombardment", 
      cost: 75, 
      availability: "7+", 
      template: "Single Card (3.5\" x 2.5\")",
      attack_dice: 8,
      keywords: ["Anti-Armor"]
    }
  ],
  
  definitions: {}
};
let currentList = {};
let selectedFactionId = "reb_all";

document.addEventListener('DOMContentLoaded', () => {
    // Top-nav listeners
    document.getElementById('armyCap').addEventListener('input', updateUI);
    document.getElementById('sortSelect').addEventListener('change', renderRoster);
    document.getElementById('factionSelect').addEventListener('change', (e) => {
        loadBuilderView(e.target.value);
    });
    document.getElementById('overrideToggle').addEventListener('change', updateUI);
    
    // Export & Clear listeners
    document.getElementById('btnClearList').addEventListener('click', clearArmy);
    
    document.getElementById('btnCopySimple').addEventListener('click', () => {
        copyToClipboard(generateSimpleText(), 'btnCopySimple');
    });
    
    document.getElementById('btnCopyDetailed').addEventListener('click', () => {
        copyToClipboard(generateDetailedText(), 'btnCopyDetailed');
    });
    
    document.getElementById('btnCopyCode').addEventListener('click', () => {
        const cap = document.getElementById('armyCap').value;
        const listState = { f: selectedFactionId, c: cap, l: currentList };
        copyToClipboard(btoa(JSON.stringify(listState)), 'btnCopyCode');
    });

    document.getElementById('btnCopyTTS').addEventListener('click', () => {
        copyToClipboard(generateTTSJSON(), 'btnCopyTTS');
    });

    document.getElementById('btnLoadCode').addEventListener('click', () => {
        const code = document.getElementById('shareCodeInput').value.trim();
        if (code) loadFromShareCode(code);
    });

    initializeHomeScreen();

    if (loadState()) {
        loadBuilderView(selectedFactionId, currentList);
    }
});

// View Switching Functions
function initializeHomeScreen() {
    const majorGrid = document.getElementById('majorFactionsGrid');
    const minorGrid = document.getElementById('minorFactionsGrid');
    const selectDropdown = document.getElementById('factionSelect');

    // Clear initial HTML
    majorGrid.innerHTML = '';
    minorGrid.innerHTML = '';
    selectDropdown.innerHTML = '';

    REGIMENT_DATA.factions.forEach(f => {
        // Populate the dropdown in the header dynamically
        selectDropdown.innerHTML += `<option value="${f.id}">${f.name}</option>`;

        // Populate the Home Screen grids
        if (f.type === "Major") {
            majorGrid.innerHTML += `
                <div class="faction-card" onclick="loadBuilderView('${f.id}')">
                    <img src="icons/${f.id}.svg" alt="${f.name} Icon" class="faction-icon" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'100\\' height=\\'100\\'><circle cx=\\'50\\' cy=\\'50\\' r=\\'40\\' stroke=\\'#333\\' stroke-width=\\'3\\' fill=\\'none\\'/></svg>'">
                    <span class="faction-card-name">${f.name}</span>
                </div>
            `;
        } else {
            minorGrid.innerHTML += `
                <button class="minor-btn" onclick="loadBuilderView('${f.id}')">${f.name}</button>
            `;
        }
    });
}

function loadBuilderView(factionId, listData = null) {
    selectedFactionId = factionId;
    document.getElementById('factionSelect').value = factionId;
    
    if (listData) {
        currentList = listData;
    } else {
        currentList = {}; 
    }
    
    document.getElementById('homeView').style.display = 'none';
    document.getElementById('builderControls').style.display = 'flex';
    document.getElementById('builderView').style.display = 'grid';

    renderRoster();
}

function goHome() {
    // Return to faction select
    document.getElementById('homeView').style.display = 'flex';
    document.getElementById('builderControls').style.display = 'none';
    document.getElementById('builderView').style.display = 'none';
}

function formatStat(val1, val2, unitSuffix = "") {
    if (val1 === null && val2 === null) return "-";
    const s1 = val1 !== null ? val1 + unitSuffix : "-";
    const s2 = val2 !== null ? val2 + unitSuffix : "-";
    return val2 !== null ? `${s1}/${s2}` : s1;
}

function calculateLimits(unit, cap) {
    const ceil = Math.ceil(cap * ((unit.max_pct || 100) / 100));
    const floor = Math.ceil(cap * ((unit.min_pct || 0) / 100));
    const maxUnits = unit.cost > ceil ? 0 : Math.floor(ceil / unit.cost);
    const minUnits = Math.floor(floor / unit.cost);
    return { min: minUnits, max: maxUnits };
}

function renderRoster() {
    const container = document.getElementById('unitList');
    const otsContainer = document.getElementById('otsList');
    const sortType = document.getElementById('sortSelect').value;
    const faction = REGIMENT_DATA.factions.find(f => f.id === selectedFactionId);
    
    // Dynamically update the roster title with icon and faction name
    document.getElementById('rosterTitle').innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
            <img src="icons/${faction.id}.svg" class="title-icon" onerror="this.style.display='none'">
            ${faction.name} Unit Roster
        </div>
        <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 5px; text-transform: none;">
            Command Value: ${faction.command_value}
        </div>
    `;
    
    let units = [...faction.units];
    
    if (sortType === "alpha") units.sort((a,b) => a.name.localeCompare(b.name));
    if (sortType === "cost-high") units.sort((a,b) => b.cost - a.cost);

    container.innerHTML = units.map(u => `
        <div class="roster-row" id="row-${u.id}">
            <div class="row-info">
                <div class="unit-name">${u.name} (${u.unit_size})</div>
                <div class="unit-type">${u.class}${u.subclass ? ' - ' + u.subclass : ''}</div>
                <div class="unit-stats">
                    Mv: ${formatStat(u.mv, u.mv_min, '"')} | Atk: ${formatStat(u.atk_ranged, u.atk_melee)} | Rng: ${formatStat(u.rng_short, u.rng_long, '"')} | Wnd: ${u.wnd} | Sv: ${u.sv}
                </div>
                <div class="unit-keywords">${u.keywords.join(', ')}</div>
            </div>
            <div class="row-controls">
                <div class="cost-limit">
                    <span class="cost">${u.cost} pts</span>
                    <span class="limit" id="limit-text-${u.id}">Limit: 0-0</span>
                </div>
                <div class="stepper">
                    <button class="btn-step" onclick="adjust('${u.id}', -1)">-</button>
                    <span class="qty" id="qty-${u.id}">0</span>
                    <button class="btn-step" id="add-${u.id}" onclick="adjust('${u.id}', 1)">+</button>
                </div>
            </div>
        </div>
    `).join('');

    const leaderContainer = document.getElementById('leaderList');
    
    if (faction.leaders && faction.leaders.length > 0) {
        leaderContainer.innerHTML = faction.leaders.map(l => `
            <div class="roster-row" id="row-${l.id}">
                <div class="row-info">
                    <div class="unit-name">${l.name}</div>
                    <div class="unit-type">Leader</div>
                    <div class="unit-stats" style="color: var(--text-muted); font-size: 0.85rem; margin-top: 2px;">Restriction: ${l.restriction_text}</div>
                    <div class="unit-keywords" style="margin-top: 6px; font-style: italic;">${l.ability}</div>
                </div>
                <div class="row-controls">
                    <div class="cost-limit"><span class="cost">${l.cost} pts</span></div>
                    <div class="stepper">
                        <button class="btn-step" onclick="adjust('${l.id}', -1)">-</button>
                        <span class="qty" id="qty-${l.id}">0</span>
                        <button class="btn-step" id="add-${l.id}" onclick="adjust('${l.id}', 1)">+</button>
                    </div>
                </div>
            </div>
        `).join('');
    } else {
        leaderContainer.innerHTML = `<div style="padding: 15px; color: var(--text-muted); font-style: italic;">No leaders available for this faction.</div>`;
    }
    
    otsContainer.innerHTML = REGIMENT_DATA.ots.map(o => `
        <div class="roster-row" id="row-${o.id}">
            <div class="row-info">
                <div class="unit-name">${o.name}</div>
                <div class="unit-type">Support Asset</div>
                <div class="unit-stats">Avail: ${o.availability} | Atk: ${o.attack_dice} | Template: ${o.template}</div>
                <div class="unit-keywords">${o.keywords && o.keywords.length > 0 ? o.keywords.join(', ') : ''}</div>
            </div>
            <div class="row-controls">
                <div class="cost-limit"><span class="cost">${o.cost} pts</span></div>
                <div class="stepper">
                    <button class="btn-step" onclick="adjust('${o.id}', -1)">-</button>
                    <span class="qty" id="qty-${o.id}">0</span>
                    <button class="btn-step" id="add-${o.id}" onclick="adjust('${o.id}', 1)">+</button>
                </div>
            </div>
        </div>
    `).join('');

    updateUI();
}

function updateUI() {
    const cap = parseInt(document.getElementById('armyCap').value) || 0;
    const isOverride = document.getElementById('overrideToggle').checked;
    const faction = REGIMENT_DATA.factions.find(f => f.id === selectedFactionId);
    
    let totalSpent = 0;
    let otsSpent = 0;
    let otsCards = 0;
    
    const maxOtsPoints = Math.floor(cap * 0.15);
    const maxOtsCards = Math.floor(cap / 250);

    const manifestContainer = document.getElementById('manifestList');
    const manifestOtsContainer = document.getElementById('manifestOtsList');
    manifestContainer.innerHTML = '';
    manifestOtsContainer.innerHTML = '';
    
    let hasUnits = false;
    let hasOts = false;

    let leaderCount = 0;
    const manifestLeaderContainer = document.getElementById('manifestLeaderList');
    manifestLeaderContainer.innerHTML = '';

    // Process Combat Units
    faction.units.forEach(u => {
        const qty = currentList[u.id] || 0;
        const limits = calculateLimits(u, cap);
        
        document.getElementById(`limit-text-${u.id}`).textContent = `Limit: ${limits.min}-${limits.max}`;
        document.getElementById(`qty-${u.id}`).textContent = qty;
        document.getElementById(`add-${u.id}`).disabled = !isOverride && (qty >= limits.max);
        
        const isIllegal = (qty < limits.min && qty > 0) || (qty > limits.max);
        document.getElementById(`row-${u.id}`).classList.toggle('illegal', isIllegal);

        if (qty > 0) {
            hasUnits = true;
            totalSpent += (qty * u.cost);
            manifestContainer.innerHTML += buildManifestItem(u.id, u.name, qty, u.cost, `Allowed: ${limits.min} to ${limits.max}`);
        }
    });

    // Count leaders first to establish the lock
    if (faction.leaders) {
        faction.leaders.forEach(l => {
            if (currentList[l.id] > 0) leaderCount += currentList[l.id];
        });

        // Process Leader UI Locks and Restrictions
        faction.leaders.forEach(l => {
            const qty = currentList[l.id] || 0;
            document.getElementById(`qty-${l.id}`).textContent = qty;
            
            const isLocked = !isOverride && (leaderCount >= 1 && qty === 0);
            document.getElementById(`add-${l.id}`).disabled = isLocked;

            let isIllegal = (qty > 1 && !isOverride);

            // Trigger validation if the leader has ANY requirement
            if (qty > 0 && (l.requires_class || l.requires_subclass || l.requires_unit)) {
                let hasValidAttachment = false;

                // Check for a specific unit ID requirement first
                if (l.requires_unit) {
                    if (currentList[l.requires_unit] > 0) {
                        hasValidAttachment = true;
                    }
                } else {
                    // Otherwise, check class and subclass requirements
                    faction.units.forEach(u => {
                        if (currentList[u.id] > 0) {
                            const classMatch = !l.requires_class || u.class === l.requires_class;
                            const subclassMatch = !l.requires_subclass || u.subclass === l.requires_subclass;
                            
                            if (classMatch && subclassMatch) {
                                hasValidAttachment = true;
                            }
                        }
                    });
                }
                
                if (!hasValidAttachment) isIllegal = true;
            }

            document.getElementById(`row-${l.id}`).classList.toggle('illegal', isIllegal);

            if (qty > 0) {
                totalSpent += (qty * l.cost);
                manifestLeaderContainer.innerHTML += buildManifestItem(l.id, l.name, qty, l.cost, `Attachment Status: ${isIllegal ? 'Missing Required Unit' : 'Valid'}`);
            }
        });
    }

    if (leaderCount > 0) manifestLeaderContainer.insertAdjacentHTML('afterbegin', '<div style="color:var(--accent); font-weight:bold; margin-bottom:8px; border-bottom:1px solid var(--border-color); padding-bottom:5px;">FACTION LEADER</div>');

    // Process OTS Logic
    REGIMENT_DATA.ots.forEach(o => {
        const qty = currentList[o.id] || 0;
        
        if (qty > 0) {
            hasOts = true;
            otsSpent += (qty * o.cost);
            otsCards += qty;
            totalSpent += (qty * o.cost);
            manifestOtsContainer.innerHTML += buildManifestItem(o.id, o.name, qty, o.cost, `Support Asset`);
        }
    });
    
    // Process OTS UI Locks
    REGIMENT_DATA.ots.forEach(o => {
        const qty = currentList[o.id] || 0;
        document.getElementById(`qty-${o.id}`).textContent = qty;
        
        const canAffordPoints = (otsSpent + o.cost) <= maxOtsPoints;
        const canAffordCards = (otsCards + 1) <= maxOtsCards;
        
        document.getElementById(`add-${o.id}`).disabled = !isOverride && (!canAffordPoints || !canAffordCards);
    });

    if (hasUnits) manifestContainer.insertAdjacentHTML('afterbegin', '<div style="color:var(--accent); font-weight:bold; margin-bottom:8px;">COMBAT UNITS</div>');
    if (hasOts) manifestOtsContainer.insertAdjacentHTML('afterbegin', '<div style="color:var(--accent); font-weight:bold; margin-bottom:8px; border-top:1px solid var(--border-color); padding-top:10px;">SUPPORT ASSETS</div>');

    const totalDisp = document.getElementById('totalSpent');
    totalDisp.textContent = `${totalSpent} / ${cap}`;
    totalDisp.classList.toggle('over-limit', totalSpent > cap);
    
    const otsTracker = document.getElementById('otsTracker');
    otsTracker.textContent = `${otsSpent} / ${maxOtsPoints} pts | ${otsCards} / ${maxOtsCards} cards`;
    otsTracker.style.color = (otsSpent > maxOtsPoints || otsCards > maxOtsCards) ? 'var(--danger)' : 'var(--text-muted)';
    
    const bidValue = cap - totalSpent;
    document.getElementById('bidDisplay').textContent = bidValue > 0 ? bidValue : 0;

    saveState();
}

function buildManifestItem(id, name, qty, cost, subtext) {
    return `
        <div class="manifest-item">
            <div class="manifest-header">
                <div class="manifest-title">
                    <span class="manifest-name">${name}</span>
                    <span class="manifest-qty">x${qty}</span>
                </div>
                <button class="btn-remove" onclick="removeUnit('${id}')" title="Remove unit">×</button>
            </div>
            <div class="manifest-details">Cost: ${cost} pts ea / ${qty * cost} pts total</div>
            <div class="manifest-details">${subtext}</div>
        </div>
    `;
}

function adjust(id, amt) {
    currentList[id] = (currentList[id] || 0) + amt;
    if (currentList[id] <= 0) delete currentList[id];
    updateUI();
}

function clearArmy() {
    currentList = {};
    updateUI();
}

function removeUnit(id) {
    delete currentList[id];
    updateUI();
}

function generateSimpleText() {
    const cap = parseInt(document.getElementById('armyCap').value) || 0;
    const faction = REGIMENT_DATA.factions.find(f => f.id === selectedFactionId);
    let text = `REGIMENT ARMY LIST\nFaction: ${faction.name}\nCommand Value: ${faction.command_value}\nPoints Cap: ${cap}\n\n`;

    let total = 0;
    let leaderText = "";
    let unitsText = "";
    let otsText = "";

    for (const [id, qty] of Object.entries(currentList)) {
        const unit = faction.units.find(u => u.id === id);
        const ots = REGIMENT_DATA.ots.find(o => o.id === id);
        const leader = faction.leaders ? faction.leaders.find(l => l.id === id) : null;
        
        if (leader && qty > 0) {
            const cost = qty * leader.cost;
            leaderText += `${qty}x ${leader.name} [${leader.cost} ea | ${cost} pts]\n`;
            total += cost;
        } else if (unit && qty > 0) {
            const cost = qty * unit.cost;
            unitsText += `${qty}x ${unit.name} [${unit.cost} ea | ${cost} pts]\n`;
            total += cost;
        } else if (ots && qty > 0) {
            const cost = qty * ots.cost;
            otsText += `${qty}x ${ots.name} [${ots.cost} ea | ${cost} pts]\n`;
            total += cost;
        }
    }

    if (leaderText) text += `FACTION LEADER\n${leaderText}\n`;
    if (unitsText) text += `COMBAT UNITS\n${unitsText}\n`;
    if (otsText) text += `SUPPORT ASSETS\n${otsText}\n`;

    const bid = cap - total > 0 ? cap - total : 0;
    text += `TOTAL SPENT: ${total} | BID: ${bid}\n`;
    return text;
}

function generateDetailedText() {
    const cap = parseInt(document.getElementById('armyCap').value) || 0;
    const faction = REGIMENT_DATA.factions.find(f => f.id === selectedFactionId);
    let text = `REGIMENT BATTLE MANIFEST\nFaction: ${faction.name}\nCommand Value: ${faction.command_value}\nPoints Cap: ${cap}\n\n`;

    let total = 0;
    let leaderText = "";
    let unitsText = "";
    let otsText = "";
    let usedKeywords = new Set();

    for (const [id, qty] of Object.entries(currentList)) {
        const unit = faction.units.find(u => u.id === id);
        const ots = REGIMENT_DATA.ots.find(o => o.id === id);
        const leader = faction.leaders ? faction.leaders.find(l => l.id === id) : null;
        
        if (leader && qty > 0) {
            const cost = qty * leader.cost;
            leaderText += `${qty}x ${leader.name} [${leader.cost} ea | ${cost} pts]\n`;
            leaderText += `    Ability: ${leader.ability}\n\n`;
            total += cost;
        } else if (unit && qty > 0) {
            const cost = qty * unit.cost;
            unitsText += `${qty}x ${unit.name} [${unit.cost} ea | ${cost} pts]\n`;
            unitsText += `    Mv: ${formatStat(unit.mv, unit.mv_min, '"')} | Atk: ${formatStat(unit.atk_ranged, unit.atk_melee)} | Rng: ${formatStat(unit.rng_short, unit.rng_long, '"')} | Wnd: ${unit.wnd} | Sv: ${unit.sv}\n`;
            if (unit.keywords && unit.keywords.length > 0) {
                unitsText += `    Keywords: ${unit.keywords.join(', ')}\n`;
                unit.keywords.forEach(kw => usedKeywords.add(kw));
            }
            unitsText += `\n`;
            total += cost;
        } else if (ots && qty > 0) {
            const cost = qty * ots.cost;
            otsText += `${qty}x ${ots.name} [${ots.cost} ea | ${cost} pts]\n`;
            otsText += `    Avail: ${ots.availability} | Atk: ${ots.attack_dice} | Template: ${ots.template}\n`;
            if (ots.keywords && ots.keywords.length > 0) {
                otsText += `    Keywords: ${ots.keywords.join(', ')}\n`;
                ots.keywords.forEach(kw => usedKeywords.add(kw));
            }
            otsText += `\n`;
            total += cost;
        }
    }

    if (leaderText) text += `FACTION LEADER\n${leaderText}`;
    if (unitsText) text += `COMBAT UNITS\n${unitsText}`;
    if (otsText) text += `SUPPORT ASSETS\n${otsText}`;

    if (usedKeywords.size > 0) {
        text += `KEYWORD DEFINITIONS\n`;
        usedKeywords.forEach(kw => {
            const def = REGIMENT_DATA.definitions[kw] || "[Definition Pending]";
            text += `${kw}: ${def}\n`;
        });
        text += `\n`;
    }

    const bid = cap - total > 0 ? cap - total : 0;
    text += `TOTAL SPENT: ${total} | BID: ${bid}\n`;
    return text;
}

function copyToClipboard(text, btnId) {
    const btn = document.getElementById(btnId);
    const originalText = btn.textContent;

    navigator.clipboard.writeText(text).then(() => {
        btn.textContent = "Copied!";
        btn.classList.add('btn-success'); // Optional: add a green class in CSS
        
        setTimeout(() => {
            btn.textContent = originalText;
            btn.classList.remove('btn-success');
        }, 2000);
    }).catch(err => {
        console.error("Failed to copy text: ", err);
    });
}

function generateTTSJSON() {
    const cap = parseInt(document.getElementById('armyCap').value) || 0;
    const faction = REGIMENT_DATA.factions.find(f => f.id === selectedFactionId);
    
    const output = {
        metadata: {
            faction_id: faction.id,
            faction_name: faction.name,
            command_value: faction.command_value,
            points_cap: cap,
            total_points: 0, // Calculated below
            bid: 0
        },
        leader: null,
        units: [],
        ots: []
    };

    let totalSpent = 0;

    for (const [id, qty] of Object.entries(currentList)) {
        const unit = faction.units.find(u => u.id === id);
        const ots = REGIMENT_DATA.ots.find(o => o.id === id);
        const leader = faction.leaders ? faction.leaders.find(l => l.id === id) : null;

        if (leader) {
            output.leader = {
                ...leader,
                quantity: qty,
                total_cost: qty * leader.cost
            };
            totalSpent += (qty * leader.cost);
        } else if (unit) {
            output.units.push({
                ...unit,
                quantity: qty,
                total_cost: qty * unit.cost
            });
            totalSpent += (qty * unit.cost);
        } else if (ots) {
            output.ots.push({
                ...ots,
                quantity: qty,
                total_cost: qty * ots.cost
            });
            totalSpent += (qty * ots.cost);
        }
    }

    output.metadata.total_points = totalSpent;
    output.metadata.bid = Math.max(0, cap - totalSpent);

    // null, 2 provides the indented formatting for debug readability
    return JSON.stringify(output, null, 2);
}

function generateShareCode() {
    const cap = document.getElementById('armyCap').value;
    const listState = {
        f: selectedFactionId,
        c: cap,
        l: currentList
    };
    
    // Convert object to JSON string, then encode to Base64
    const jsonStr = JSON.stringify(listState);
    const base64Code = btoa(jsonStr);
    
    copyToClipboard(base64Code);
}

function loadFromShareCode(base64Code) {
    try {
        // Decode Base64 back to JSON string, then parse object
        const jsonStr = atob(base64Code);
        const listState = JSON.parse(jsonStr);
        
        // Apply the loaded state
        document.getElementById('armyCap').value = listState.c || 1000;
        
        // Pass the faction and the unit list to the view loader
        loadBuilderView(listState.f, listState.l);
        
        // Clear the input field for next time
        document.getElementById('shareCodeInput').value = '';
        
    } catch (e) {
        alert("Invalid share code. Please check the code and try again.");
        console.error("Failed to parse share code:", e);
    }
}

function saveState() {
    const state = {
        cap: document.getElementById('armyCap').value,
        factionId: selectedFactionId,
        roster: currentList
    };
    localStorage.setItem('regimentBuilderState', JSON.stringify(state));
}

function loadState() {
    const saved = localStorage.getItem('regimentBuilderState');
    if (saved) {
        try {
            const state = JSON.parse(saved);
            document.getElementById('armyCap').value = state.cap;
            selectedFactionId = state.factionId;
            document.getElementById('factionSelect').value = selectedFactionId;
            currentList = state.roster || {};
            return true;
        } catch (e) {
            console.error("Failed to parse saved state.");
            return false;
        }
    }
    return false;
}

function printDetailedList() {
    const text = generateDetailedText();
    const printWindow = window.open('', '', 'height=800,width=800');
    
    printWindow.document.write('<html><head><title>Regiment Battle Manifest</title>');
    printWindow.document.write('<style>body { font-family: monospace; font-size: 14px; white-space: pre-wrap; padding: 20px; }</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write(text);
    printWindow.document.write('</body></html>');
    
    printWindow.document.close();
    printWindow.focus();
    
    // Slight delay ensures the DOM is fully written before invoking the print dialog
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 250);
}
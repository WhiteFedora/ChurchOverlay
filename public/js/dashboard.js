function updateLists(lists) {
    console.log('updateLists called with:', lists);
    localLists = lists;

    // Dropdowns
    const pSel = document.getElementById('sel-person');
    const tSel = document.getElementById('sel-task');
    console.log('pSel:', pSel, 'tSel:', tSel);
    if (pSel) { // Only on dashboard
        const pVal = pSel.value; const tVal = tSel.value;
        pSel.innerHTML = '<option value="">-- Select --</option>' + lists.people.map(p => `<option>${p}</option>`).join('');
        tSel.innerHTML = '<option value="">-- Select --</option>' + lists.tasks.map(t => `<option>${t}</option>`).join('');
        // Defaults: Select first item if nothing selected
        if (pVal) pSel.value = pVal;
        else if (lists.people.length > 0) pSel.selectedIndex = 1;

        if (tVal) tSel.value = tVal;
        else if (lists.tasks.length > 0) tSel.selectedIndex = 1;

        // Manage Lists UI
        document.getElementById('list-people').innerHTML = lists.people.map((p, i) => `<li class="flex justify-between">${p} <span onclick="remItem('people',${i})" class="cursor-pointer text-red-500 font-bold">x</span></li>`).join('');
        document.getElementById('list-tasks').innerHTML = lists.tasks.map((t, i) => `<li class="flex justify-between">${t} <span onclick="remItem('tasks',${i})" class="cursor-pointer text-red-500 font-bold">x</span></li>`).join('');

        // Slates Grid
        const grid = document.getElementById('slates-grid');
        console.log('grid:', grid, 'slates:', lists.slates);
        grid.innerHTML = lists.slates.map((s, i) => {
            const isActive = localStatus.active_slate_index === i;
            const content = s.type === 'image' ? `<img src="${s.src}">` : `<div class="text-center p-2"><b class="text-white text-lg font-serif">${s.title}</b><div class="text-yellow-500 text-xs">${s.sub}</div></div>`;
            return `
            <div class="group relative">
                <div onclick="emitSlate(${i})" class="preview-box ${isActive ? 'active' : ''}">${content}
                    <div class="preview-actions">
                        ${i > 0 ? `<button onclick="moveSlate(${i},-1);event.stopPropagation()" class="action-btn">←</button>` : ''}
                        <button onclick="delSlate(${i});event.stopPropagation()" class="action-btn bg-red-600">×</button>
                        ${i < lists.slates.length - 1 ? `<button onclick="moveSlate(${i},1);event.stopPropagation()" class="action-btn">→</button>` : ''}
                    </div>
                </div>
                <p class="text-center text-xs font-bold mt-2 text-slate-500 group-hover:text-blue-600">${s.type === 'image' ? s.label : s.title}</p>
            </div>`;
        }).join('');
    }
}

// --- DASHBOARD ACTIONS ---
function emitSlate(idx) {
    if (localStatus.active_slate_index === idx) {
        emitStatus({ slate_active: false, active_slate_index: null });
    } else {
        const s = localLists.slates[idx];
        emitStatus({ slate_active: true, slate_type: s.type, slate_title: s.title, slate_sub: s.sub, slate_src: s.src, active_slate_index: idx });
    }
}
function setCountdown() {
    const val = document.getElementById('inp-target-time').value;
    if (!val) return;
    const now = new Date();
    const [h, m] = val.split(':');
    const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0).getTime();
    emitStatus({ timer_target: target });
}
function getVal(id) { return document.getElementById(id).value; }

// --- NEW FUNCTIONS ---
function updateStatus(status) {
    console.log('updateStatus called with:', status);
    localStatus = status;
    // Update active states
    const ltSection = document.getElementById('lt-section');
    const timerSection = document.getElementById('timer-section');
    if (ltSection) {
        const btn = document.getElementById('btn-toggle-lt');
        if (status.lt_active) {
            ltSection.classList.add('lt-active');
            if (btn) btn.innerText = 'HIDE LOWER THIRD';
        } else {
            ltSection.classList.remove('lt-active');
            if (btn) btn.innerText = 'SHOW LOWER THIRD';
        }
    }
    if (timerSection) {
        const btn = document.getElementById('btn-toggle-timer');
        if (status.timer_visible) {
            timerSection.classList.add('timer-active');
            if (btn) btn.innerText = 'HIDE TIMER';
        } else {
            timerSection.classList.remove('timer-active');
            if (btn) btn.innerText = 'SHOW TIMER';
        }
    }
}
function updateTransitions() {
    const ltDur = parseFloat(document.getElementById('lt-duration').value);
    const slateDur = parseFloat(document.getElementById('slate-duration').value);
    emitStatus({ lt_transition_duration: ltDur, slate_transition_duration: slateDur });
}

function toggleLowerThird() {
    console.log('toggleLowerThird called');
    const isActive = localStatus.lt_active;
    console.log('isActive:', isActive);
    if (isActive) {
        emitStatus({ lt_active: false });
    } else {
        emitStatus({ lt_active: true, lt_name: getVal('sel-person'), lt_role: getVal('sel-task') });
    }
}

function toggleTimer() {
    console.log('toggleTimer called');
    const isVisible = localStatus.timer_visible;
    console.log('isVisible:', isVisible);
    const showStart = document.getElementById('timer-show-start').checked;
    const clockOffset = parseInt(document.getElementById('timer-clock-offset').value);
    const textOffset = parseInt(document.getElementById('timer-text-offset').value);
    emitStatus({ timer_visible: !isVisible, timer_show_start_message: showStart, timer_clock_offset: clockOffset, timer_text_offset: textOffset });
}
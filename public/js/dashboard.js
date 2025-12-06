function updateLists(lists) {
    console.log('updateLists called with:', lists);
    localLists = lists;

    // Dropdowns
    const pSel = document.getElementById('sel-person');
    const tSel = document.getElementById('sel-task');
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
        const genListHtml = (items, type) => items.map((item, i) => `
            <li class="flex justify-between items-center group p-1 hover:bg-slate-100 dark:hover:bg-slate-600 rounded transition-colors">
                <span class="truncate flex-1">${item}</span>
                <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity items-center">
                    ${i > 0 ? `<button onclick="moveListItem('${type}', ${i}, -1)" class="text-slate-400 hover:text-blue-600 font-bold px-1" title="Move Up">↑</button>` : '<span class="w-6"></span>'}
                    ${i < items.length - 1 ? `<button onclick="moveListItem('${type}', ${i}, 1)" class="text-slate-400 hover:text-blue-600 font-bold px-1" title="Move Down">↓</button>` : '<span class="w-6"></span>'}
                    <button onclick="editItem('${type}', ${i})" class="text-slate-400 hover:text-blue-600 font-bold px-1" title="Edit">✎</button>
                    <button onclick="remItem('${type}', ${i})" class="text-slate-400 hover:text-red-500 font-bold px-1" title="Delete">×</button>
                </div>
            </li>`).join('');

        document.getElementById('list-people').innerHTML = genListHtml(lists.people, 'people');
        document.getElementById('list-tasks').innerHTML = genListHtml(lists.tasks, 'tasks');

        // Slates Grid
        const grid = document.getElementById('slates-grid');
        grid.innerHTML = lists.slates.map((s, i) => {
            const isActive = localStatus.active_slate_index === i;
            const content = s.type === 'image' ? `<img src="${s.src}">` : `<div class="text-center p-2"><b class="text-slate-900 dark:text-white text-lg font-serif">${s.title}</b><div class="text-yellow-600 dark:text-yellow-500 text-xs">${s.sub}</div></div>`;
            return `
            <div class="group relative">
                <div onclick="emitSlate(${i})" class="preview-box ${isActive ? 'active' : ''}">${content}
                    <div class="preview-actions">
                        ${i > 0 ? `<button onclick="moveSlate(${i},-1);event.stopPropagation()" class="action-btn">←</button>` : ''}
                        <button onclick="delSlate(${i});event.stopPropagation()" class="action-btn bg-red-600">×</button>
                        ${i < lists.slates.length - 1 ? `<button onclick="moveSlate(${i},1);event.stopPropagation()" class="action-btn">→</button>` : ''}
                    </div>
                </div>
                <p class="text-center text-xs font-bold mt-2 text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400">${s.type === 'image' ? s.label : s.title}</p>
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
        const btnMsg = document.getElementById('btn-toggle-msg');
        if (status.timer_visible) {
            timerSection.classList.add('timer-active');
            if (btn) btn.innerText = 'HIDE TIMER';
        } else {
            timerSection.classList.remove('timer-active');
            if (btn) btn.innerText = 'SHOW TIMER';
        }

        if (status.timer_show_start_message) {
            if (btnMsg) {
                btnMsg.innerText = 'HIDE START MESSAGE';
                btnMsg.classList.add('bg-blue-200');
            }
        } else {
            if (btnMsg) {
                btnMsg.innerText = 'SHOW START MESSAGE';
                btnMsg.classList.remove('bg-blue-200');
            }
        }
    }

    // Update Active States for Transitions UI
    const elDur = document.getElementById('lt-duration');
    const elType = document.getElementById('lt-trans-type');
    const elDir = document.getElementById('lt-trans-dir');
    const elEase = document.getElementById('lt-trans-ease');
    const elSlateDur = document.getElementById('slate-duration');

    if (elDur && status.lt_transition_duration) elDur.value = status.lt_transition_duration;
    if (elType && status.lt_transition_type) elType.value = status.lt_transition_type;
    if (elDir && status.lt_transition_direction) elDir.value = status.lt_transition_direction;
    if (elEase && status.lt_transition_easing) elEase.value = status.lt_transition_easing;
    if (elSlateDur && status.slate_transition_duration) elSlateDur.value = status.slate_transition_duration;


    // Update Slates Grid Active State
    const slateBoxes = document.querySelectorAll('#slates-grid .preview-box');
    slateBoxes.forEach((box, index) => {
        if (status.slate_active && status.active_slate_index === index) {
            box.classList.add('active');
        } else {
            box.classList.remove('active');
        }
    });
}

function updateTransitions() {
    const ltDur = parseFloat(document.getElementById('lt-duration').value);
    const slateDur = parseFloat(document.getElementById('slate-duration').value);
    const ltType = document.getElementById('lt-trans-type').value;
    const ltDir = document.getElementById('lt-trans-dir').value;
    const ltEase = document.getElementById('lt-trans-ease').value;

    emitStatus({
        lt_transition_duration: ltDur,
        slate_transition_duration: slateDur,
        lt_transition_type: ltType,
        lt_transition_direction: ltDir,
        lt_transition_easing: ltEase
    });
}

// Timeout timer
var ltTimeoutTimer = null;

function toggleLtMode() {
    const isTimeout = document.querySelector('input[name="lt-mode"][value="timeout"]').checked;
    const inp = document.getElementById('inp-lt-timeout');
    if (isTimeout) {
        inp.classList.remove('hidden');
    } else {
        inp.classList.add('hidden');
        // If switched to Forever while active, clear any pending timer
        if (ltTimeoutTimer) {
            clearTimeout(ltTimeoutTimer);
            ltTimeoutTimer = null;
            console.log('Switched to Forever - timer cancelled');
        }
    }
}

function toggleLowerThird() {
    console.log('toggleLowerThird called');
    const isActive = localStatus.lt_active;
    console.log('isActive:', isActive);

    // Always clear existing timer on toggle
    if (ltTimeoutTimer) {
        clearTimeout(ltTimeoutTimer);
        ltTimeoutTimer = null;
    }

    if (isActive) {
        emitStatus({ lt_active: false });
    } else {
        emitStatus({ lt_active: true, lt_name: getVal('sel-person'), lt_role: getVal('sel-task') });

        // Handle Timeout
        const isTimeout = document.querySelector('input[name="lt-mode"][value="timeout"]').checked;
        if (isTimeout) {
            const sec = parseFloat(document.getElementById('inp-lt-timeout').value) || 10;
            console.log(`Lower Third will auto-hide in ${sec} seconds`);
            ltTimeoutTimer = setTimeout(() => {
                console.log('Timeout fired - hiding Lower Third');
                emitStatus({ lt_active: false });
                ltTimeoutTimer = null;
            }, sec * 1000);
        }
    }
}

function toggleTimer() {
    console.log('toggleTimer called');
    const isVisible = localStatus.timer_visible;
    emitStatus({ timer_visible: !isVisible });
}

function toggleStartMessage() {
    const isVisible = localStatus.timer_show_start_message;
    emitStatus({ timer_show_start_message: !isVisible });
}
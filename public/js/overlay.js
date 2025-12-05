function updateOverlay(status) {
    // Update local status
    localStatus = status;

    // Greenscreen background
    document.body.style.setProperty('--greenscreen-color', status.greenscreen_color || '#00FF00');

    // Transition settings
    document.documentElement.style.setProperty('--lt-duration', `${status.lt_transition_duration || 0.8}s`);
    document.documentElement.style.setProperty('--slate-duration', `${status.slate_transition_duration || 0.5}s`);
    // Easing can be added similarly if needed

    // Lower Third styles
    if (status.lt_bg_image) {
        document.documentElement.style.setProperty('--lt-bg', `url(${status.lt_bg_image})`);
    } else {
        document.documentElement.style.setProperty('--lt-bg', `linear-gradient(to right, ${status.lt_bg_color || '#0f172a'}, #1e293b)`);
    }

    // Lower Third
    const lt = document.getElementById('comp-lt');
    document.getElementById('el-name').innerText = status.lt_name || "";
    document.getElementById('el-role').innerText = status.lt_role || "";
    
    // Position
    const offX = status.lt_offset_x || 0;
    const offY = status.lt_offset_y || 0;
    lt.style.setProperty('--lt-x', `${offX}vw`);
    lt.style.setProperty('--lt-y', `${-offY}vh`);
    status.lt_active ? lt.classList.add('active') : lt.classList.remove('active');

    // Slates
    const slate = document.getElementById('comp-slate');
    const img = document.getElementById('slate-img-bg');
    const txt = document.getElementById('slate-content');
    if(status.slate_type === 'image') {
        img.src = status.slate_src; img.classList.remove('hidden'); txt.classList.add('hidden');
    } else {
        img.classList.add('hidden'); txt.classList.remove('hidden');
        document.getElementById('slate-main').innerText = status.slate_title || "";
        document.getElementById('slate-sub').innerText = status.slate_sub || "";
    }
    status.slate_active ? slate.classList.add('active') : slate.classList.remove('active');

    // Timer
    const clock = document.getElementById('comp-clock');
    const startTimeEl = document.getElementById('el-start-time');
    const startMessageEl = document.getElementById('el-start-message');
    status.timer_visible ? clock.classList.add('active') : clock.classList.remove('active');
    document.documentElement.style.setProperty('--timer-clock-top', `${40 + (status.timer_clock_offset || 0)}px`);
    timerTarget = status.timer_target;
    if (timerTarget && status.timer_show_start_message) {
        const startDate = new Date(timerTarget);
        const startStr = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        startMessageEl.innerText = `Service starts at ${startStr}`;
        startMessageEl.classList.remove('hidden');
        startMessageEl.style.top = `${60 + (status.timer_text_offset || 0)}px`;
    } else {
        startMessageEl.classList.add('hidden');
    }
    if (timerTarget) {
        const startDate = new Date(timerTarget);
        const startStr = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        startTimeEl.innerText = `Start: ${startStr}`;
        startTimeEl.classList.remove('hidden');
        document.getElementById('el-countdown').classList.remove('hidden');
    } else {
        startTimeEl.classList.add('hidden');
        document.getElementById('el-countdown').classList.add('hidden');
    }
}
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
    if (status.slate_type === 'image') {
        img.src = status.slate_src; img.classList.remove('hidden'); txt.classList.add('hidden');
    } else {
        img.classList.add('hidden'); txt.classList.remove('hidden');
        document.getElementById('slate-main').innerText = status.slate_title || "";
        document.getElementById('slate-sub').innerText = status.slate_sub || "";
    }
    status.slate_active ? slate.classList.add('active') : slate.classList.remove('active');

    // Timer
    const clock = document.getElementById('comp-clock');
    const startMessageEl = document.getElementById('el-start-message');
    status.timer_visible ? clock.classList.add('active') : clock.classList.remove('active');
    document.documentElement.style.setProperty('--timer-clock-top', `${40 + (status.timer_clock_offset || 0)}px`);
    timerTarget = status.timer_target;
    if (timerTarget) {
        const startDate = new Date(timerTarget);
        const startStr = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        startMessageEl.innerText = `Service starts at ${startStr}`;
    }

    if (timerTarget && status.timer_show_start_message) {
        startMessageEl.classList.add('active');
    } else {
        startMessageEl.classList.remove('active');
    }

    // Apply Theme if valid
    if (window.currentThemeConfig) {
        applyTheme(window.currentThemeConfig);
    }
}

// --- THEME ENGINE ---
window.currentThemeConfig = null;

function updateThemeConfig(config) {
    console.log("Applying Theme Config:", config);
    window.currentThemeConfig = config;
    applyTheme(config);
}

function applyTheme(config) {
    if (!config) return;

    const lt = document.getElementById('comp-lt');
    const nameEl = document.getElementById('el-name');
    const roleEl = document.getElementById('el-role');

    // Box Styles
    lt.style.width = `${config.box.width}px`;
    lt.style.height = `${config.box.height}px`;
    lt.style.left = `${config.box.x}%`;
    lt.style.top = `${config.box.y}%`;
    // We must reset bottom/right to auto to allow top/left to work, and override the CSS defaults
    lt.style.bottom = 'auto';
    lt.style.right = 'auto';

    // Match Designer centering
    lt.style.setProperty('--lt-base-transform', 'translate(-50%, -50%)');

    // Background
    if (config.box.bg_color.startsWith('#')) {
        // Hex to RGB for opacity
        const hex = config.box.bg_color;
        let c;
        if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
            c = hex.substring(1).split('');
            if (c.length == 3) {
                c = [c[0], c[0], c[1], c[1], c[2], c[2]];
            }
            c = '0x' + c.join('');
            const r = (c >> 16) & 255;
            const g = (c >> 8) & 255;
            const b = c & 255;
            lt.style.background = `rgba(${r},${g},${b},${config.box.opacity})`;
            lt.style.setProperty('--lt-bg', `rgba(${r},${g},${b},${config.box.opacity})`); // helper for other css
        }
    } else {
        lt.style.background = config.box.bg_color;
    }

    lt.style.borderRadius = `${config.box.radius}px`;
    lt.style.borderLeft = `${config.box.border_left}px solid ${config.box.border_color}`;

    // Layout
    lt.style.display = 'flex';
    lt.style.flexDirection = 'column';
    lt.style.justifyContent = 'center'; // Vertical centering

    if (config.layout.align === 'start') {
        lt.style.alignItems = 'flex-start';
        lt.style.textAlign = 'left';
    } else if (config.layout.align === 'end') {
        lt.style.alignItems = 'flex-end';
        lt.style.textAlign = 'right';
    } else {
        lt.style.alignItems = 'center';
        lt.style.textAlign = 'center';
    }

    lt.style.gap = `${config.layout.gap}px`;
    lt.style.paddingLeft = `${config.layout.padding_x}px`;
    lt.style.paddingRight = `${config.layout.padding_x}px`;

    // Name styles
    nameEl.style.fontFamily = config.name.font;
    nameEl.style.fontSize = `${config.name.size}px`;
    nameEl.style.color = config.name.color;
    nameEl.style.fontWeight = config.name.weight;
    nameEl.style.textTransform = config.name.transform;
    nameEl.style.textShadow = config.name.shadow ? '2px 2px 4px rgba(0,0,0,0.5)' : 'none';

    // Role styles
    roleEl.style.fontFamily = config.role.font;
    roleEl.style.fontSize = `${config.role.size}px`;
    roleEl.style.color = config.role.color;
    roleEl.style.fontWeight = config.role.weight;
    roleEl.style.textTransform = config.role.transform;
}
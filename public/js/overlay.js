// --- HELPER FUNCTIONS ---
function hexToRgba2(hex, alpha) {
    let c;
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
        c = hex.substring(1).split('');
        if (c.length == 3) {
            c = [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c = '0x' + c.join('');
        return `rgba(${[(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',')},${alpha})`;
    }
    return hex;
}

function resolveColor(val, palette) {
    if (!palette) return val;
    if (val === 'primary') return palette.primary;
    if (val === 'secondary') return palette.secondary;
    if (val === 'accent') return palette.accent;
    if (val === 'bg') return palette.bg;
    if (val === 'video-white') return '#ffffff';
    return val;
}

// --- TRANSFORM LOGIC ---
function getBaseTransform(layer) {
    let xMap = { 'left': '0%', 'center': '-50%', 'right': '-100%' };
    // Default to center if undefined
    let tx = xMap[layer.align] || '-50%';
    let ty = '-50%'; // Always center vertically on the anchor point
    return `translate(${tx}, ${ty})`;
}

function getEnterTransform(layer) {
    const base = getBaseTransform(layer);
    const enter = layer.enterFrom || 'bottom';

    // We append the entrance offset to the base transform
    if (enter === 'bottom') return `${base} translateY(100vh)`; // Move down offscreen
    if (enter === 'top') return `${base} translateY(-100vh)`;
    if (enter === 'left') return `${base} translateX(-100vw)`;
    if (enter === 'right') return `${base} translateX(100vw)`;
    if (enter === 'fade') return base; // Position stays same, opacity handles it

    return base;
}

// --- MAIN UPDATE FUNCTION ---
// localStatus is already defined in main.js

function updateOverlay(status) {
    // Update local status
    localStatus = status;

    // Greenscreen background
    document.body.style.setProperty('--greenscreen-color', status.greenscreen_color || '#00FF00');

    // Global Transition settings (legacy support or global override)
    document.documentElement.style.setProperty('--lt-duration', `${status.lt_transition_duration || 0.8}s`);
    document.documentElement.style.setProperty('--slate-duration', `${status.slate_transition_duration || 0.5}s`);
    document.documentElement.style.setProperty('--lt-easing', status.lt_transition_easing || 'cubic-bezier(0.16, 1, 0.3, 1)');

    // Safe Guides
    const guides = document.getElementById('safe-guides');
    if (guides) {
        if (status.safe_guides_visible) guides.classList.add('visible');
        else guides.classList.remove('visible');
    }

    // Lower Third Container
    const lt = document.getElementById('comp-lt');

    // --- LEGACY/DEFAULT SUPPORT ---
    // Legacy Content Update via ID
    let nameEl = lt.querySelector('[data-layer-id="l_name"]');
    if (!nameEl) nameEl = document.getElementById('el-name');
    if (nameEl) nameEl.innerText = status.lt_name || "";

    let roleEl = lt.querySelector('[data-layer-id="l_role"]');
    if (!roleEl) roleEl = document.getElementById('el-role');
    if (roleEl) roleEl.innerText = status.lt_role || "";

    // Global Offsets
    const offX = status.lt_offset_x || 0;
    const offY = status.lt_offset_y || 0;

    // We apply offsets differently for legacy vs designer
    lt.style.setProperty('--lt-x', `${offX}vw`);
    lt.style.setProperty('--lt-y', `${-offY}vh`);

    // Check mode
    const isDesignerMode = lt.querySelectorAll('.lt-layer').length > 0;

    if (isDesignerMode) {
        lt.style.transform = `translate(${offX}vw, ${-offY}vh)`;
    }

    // Active State
    if (status.lt_active) {
        lt.classList.add('active');

        // Trigger layer entrances (Designer Mode)
        const layers = lt.querySelectorAll('.lt-layer');
        layers.forEach(el => {
            const layer = {
                align: el.dataset.align,
                enterFrom: el.dataset.enter
            };
            el.style.transform = getBaseTransform(layer);
            el.style.opacity = '1';
        });

    } else {
        lt.classList.remove('active');

        // Reset layer entrances (Designer Mode)
        const layers = lt.querySelectorAll('.lt-layer');
        layers.forEach(el => {
            const layer = {
                align: el.dataset.align,
                enterFrom: el.dataset.enter
            };
            el.style.transform = getEnterTransform(layer);
            el.style.opacity = '0';
        });
    }

    // Slates (Cross-fade Logic)
    try {
        handleSlateUpdate(status);
    } catch (e) { console.error("Slate Error", e); }

    // Timer logic
    try {
        updateTimer(status);
    } catch (e) { console.error("Timer Error", e); }
}

function applyTheme(config) {
    if (!config || !config.layers) return;

    const lt = document.getElementById('comp-lt');
    lt.innerHTML = ''; // Clear old

    // Designer Mode: Full Screen Container to allow absolute positioning of layers anywhere
    lt.className = '';
    lt.style.position = 'absolute';
    lt.style.top = '0';
    lt.style.left = '0';
    lt.style.width = '100%';
    lt.style.height = '100%';
    lt.style.pointerEvents = 'none';
    lt.style.zIndex = '10';

    config.layers.forEach(layer => {
        const el = document.createElement('div');
        el.dataset.layerId = layer.id;
        el.dataset.enter = layer.enterFrom || 'bottom';
        el.dataset.align = layer.align || 'center';
        // el.dataset.origOpacity = layer.opacity; // No longer needed as we use 0 or 1

        // Base Transition Class
        el.className = 'lt-layer absolute transition-all will-change-transform';

        // Styles
        el.style.left = layer.x + '%';
        el.style.top = layer.y + '%';

        // Initial Transform (Hidden)
        el.style.transform = getEnterTransform(layer);

        const bg = hexToRgba2(resolveColor(layer.color, config.palette), layer.opacity);

        if (layer.type === 'shape') {
            el.style.width = layer.width + 'px';
            el.style.height = layer.height + 'px';
            el.style.backgroundColor = bg;
            el.style.borderRadius = layer.radius + 'px';
            if (layer.border > 0) {
                el.style.border = `${layer.border}px solid ${resolveColor(layer.borderColor, config.palette) || '#000'}`;
            }
        } else if (layer.type === 'text') {
            el.innerText = layer.content;
            el.style.whiteSpace = 'nowrap';
            el.style.fontFamily = layer.font;
            el.style.fontSize = layer.size + 'px';
            el.style.color = bg;
            el.style.fontWeight = layer.weight;
            el.style.textAlign = layer.align;
            if (layer.transform) el.style.textTransform = layer.transform;
            if (layer.shadow) el.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';

            el.style.display = 'flex';
            el.style.alignItems = 'center';
            el.style.justifyContent = layer.align === 'left' ? 'flex-start' : (layer.align === 'right' ? 'flex-end' : 'center');
        }

        // Animation Props
        if (layer.delay) el.style.transitionDelay = `${layer.delay}ms`;
        if (layer.duration) el.style.transitionDuration = `${layer.duration}s`;
        else el.style.transitionDuration = '0.8s';

        if (layer.easing) el.style.transitionTimingFunction = layer.easing;
        else el.style.transitionTimingFunction = 'cubic-bezier(0.16, 1, 0.3, 1)';

        // Initial State (Hidden)
        el.style.opacity = '0';

        lt.appendChild(el);
    });
}

// Alias for socket.js
// const updateThemeConfig = applyTheme; 
window.updateThemeConfig = applyTheme;

// --- SLATE CROSS-FADE LOGIC ---
let activeSlateBuffer = null; // 'slate-1' or 'slate-2'
let lastSlateHash = '';

function handleSlateUpdate(status) {
    const s1 = document.getElementById('slate-1');
    const s2 = document.getElementById('slate-2');

    // If not active, hide all
    if (!status.slate_active) {
        s1.classList.remove('active');
        s2.classList.remove('active');
        activeSlateBuffer = null;
        lastSlateHash = '';
        return;
    }

    // Generate hash
    const hash = `${status.slate_type}|${status.slate_title}|${status.slate_sub}|${status.slate_src}`;

    // If same content is already active, ensure it stays active
    if (activeSlateBuffer && hash === lastSlateHash) {
        document.getElementById(activeSlateBuffer).classList.add('active');
        return;
    }

    // Prepare transition: If no buffer active, start with 1. Else swap.
    const nextBufferId = (activeSlateBuffer === 'slate-1') ? 'slate-2' : 'slate-1';
    const nextEl = document.getElementById(nextBufferId);
    const currEl = activeSlateBuffer ? document.getElementById(activeSlateBuffer) : null;

    // Populate Next
    const img = nextEl.querySelector('.slate-img-fs');
    const txt = nextEl.querySelector('.slate-content-wrapper');
    const title = nextEl.querySelector('.slate-title');
    const sub = nextEl.querySelector('.slate-subtitle');

    if (status.slate_type === 'image') {
        img.src = status.slate_src;
        img.classList.remove('hidden');
        txt.classList.add('hidden');
    } else {
        img.classList.add('hidden');
        txt.classList.remove('hidden');
        title.innerText = status.slate_title || "";
        sub.innerText = status.slate_sub || "";
    }

    // Stack: Next on Top
    nextEl.style.zIndex = 51;
    if (currEl) currEl.style.zIndex = 50;

    // Show Next (Fade In)
    nextEl.classList.add('active');

    // Update State
    activeSlateBuffer = nextBufferId;
    lastSlateHash = hash;

    // Cleanup Old (delayed)
    if (currEl) {
        const durStyle = getComputedStyle(document.documentElement).getPropertyValue('--slate-duration');
        const durSec = parseFloat(durStyle) || 0.5;
        const ms = durSec * 1000 + 50;

        setTimeout(() => {
            if (activeSlateBuffer !== currEl.id) {
                currEl.classList.remove('active');
                currEl.style.zIndex = '';
            }
        }, ms);
    }
}

// --- TIMER LOGIC ---
let timerInterval = null;

function updateTimer(status) {
    const clock = document.getElementById('comp-clock');
    const timeEl = document.getElementById('el-clock');
    const msgEl = document.getElementById('el-start-message');

    // Visibility
    if (status.timer_visible) clock.classList.add('active');
    else clock.classList.remove('active');

    // Message Visibility
    if (status.timer_show_start_message) {
        msgEl.classList.remove('hidden');
        // Small delay to allow display:block to apply before transition
        requestAnimationFrame(() => msgEl.classList.add('active'));
    } else {
        msgEl.classList.remove('active');
        // Wait for transition then hide
        setTimeout(() => { if (!status.timer_show_start_message) msgEl.classList.add('hidden'); }, 500);
    }

    // Message Text
    // TODO: Add status.timer_message_text support later if needed

    // Countdown Logic
    if (status.timer_target) {
        // Start or continue countdown
        if (!timerInterval) {
            timerInterval = setInterval(() => {
                const dest = new Date(status.timer_target).getTime();
                const now = new Date().getTime();
                const diff = dest - now;

                if (diff > 0) {
                    const h = Math.floor(diff / (1000 * 60 * 60));
                    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                    const s = Math.floor((diff % (1000 * 60)) / 1000);

                    let txt = "";
                    if (h > 0) txt = `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
                    else txt = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

                    timeEl.innerText = txt;
                    timeEl.classList.add('countdown-display');
                } else {
                    // Timer finished: Return to clock
                    if (timerInterval) {
                        clearInterval(timerInterval);
                        timerInterval = null;
                    }
                    timeEl.classList.remove('countdown-display');
                    // Force immediate clock update so we don't wait 1s for main.js
                    timeEl.innerText = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                }
            }, 200);
        }
    } else {
        // Stop countdown
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        timeEl.classList.remove('countdown-display');
        // main.js interval takes over for regular clock
    }

    // Styling
    const tFont = status.timer_font; // Note: check variable name in dashboard.js
    const tTC = status.timer_text_color;
    const tTO = status.timer_text_opacity; // Might be integrated into color hex or separate
    const tBC = status.timer_bg_color;
    const tBO = status.timer_bg_opacity;

    const displays = document.querySelectorAll('.time-display');
    displays.forEach(d => {
        if (tFont) d.style.fontFamily = tFont;

        // We use hexToRgba2 but we need to check if these props exist
        if (tTC) {
            // If opacity is in status separately, use it
            const op = (status.timer_text_opacity !== undefined) ? status.timer_text_opacity : 1;
            d.style.color = hexToRgba2(tTC, op);
        }
        if (tBC) {
            const op = (status.timer_bg_opacity !== undefined) ? status.timer_bg_opacity : 0.4;
            d.style.background = hexToRgba2(tBC, op);
        }
    });

    // Positioning
    const tX = status.timer_x !== undefined ? status.timer_x : 2; // Default 2%
    const tY = status.timer_y !== undefined ? status.timer_y : 4; // Default 4%
    clock.style.right = `${tX}%`;
    clock.style.top = `${tY}%`;
}
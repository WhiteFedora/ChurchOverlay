const socket = io();

// Initial Default State
const DEFAULT_STATE = {
    box: {
        width: 800,
        height: 150,
        x: 50, // Percent
        y: 85, // Percent
        bg_color: "#0f172a",
        opacity: 0.95,
        radius: 0,
        border_left: 0,
        border_color: "#3b82f6"
    },
    name: {
        font: "Cinzel",
        size: 42,
        color: "#ffffff",
        weight: "700",
        transform: "none",
        shadow: true
    },
    role: {
        font: "Lato",
        size: 24,
        color: "#fbbf24", // church gold
        weight: "300",
        transform: "uppercase"
    },
    layout: {
        align: "center", // flex-start, center, flex-end
        gap: 5,
        padding_x: 40
    }
};

let designState = JSON.parse(JSON.stringify(DEFAULT_STATE)); // Deep copy

// --- DOM ELEMENTS ---
const previewLt = document.getElementById('preview-lt');
const previewName = document.getElementById('preview-name');
const previewRole = document.getElementById('preview-role');
const previewBg = document.getElementById('preview-bg');
const safeGuides = document.getElementById('safe-guides');

// View Options
const chkGrid = document.getElementById('chk-grid');
const chkSafe = document.getElementById('chk-safe');

// Reset
const btnReset = document.getElementById('btn-reset');

const inputs = {
    // Box
    box_width: document.getElementById('inp-box-width'),
    num_box_width: document.getElementById('num-box-width'),
    box_height: document.getElementById('inp-box-height'),
    num_box_height: document.getElementById('num-box-height'),
    box_x: document.getElementById('inp-box-x'),
    num_box_x: document.getElementById('num-box-x'),
    box_y: document.getElementById('inp-box-y'),
    num_box_y: document.getElementById('num-box-y'),
    box_bg_color: document.getElementById('inp-box-bg-color'),
    box_bg_color_text: document.getElementById('inp-box-bg-color-text'),
    box_opacity: document.getElementById('inp-box-opacity'),
    num_box_opacity: document.getElementById('num-box-opacity'),
    box_radius: document.getElementById('inp-box-radius'),
    num_box_radius: document.getElementById('num-box-radius'),
    border_left: document.getElementById('inp-border-left'),
    num_border_left: document.getElementById('num-border-left'),
    border_color: document.getElementById('inp-border-color'),

    // Name
    name_font: document.getElementById('inp-name-font'),
    name_size: document.getElementById('inp-name-size'),
    num_name_size: document.getElementById('num-name-size'),
    name_color: document.getElementById('inp-name-color'),
    name_weight: document.getElementById('inp-name-weight'),
    name_transform: document.getElementById('inp-name-transform'),
    name_shadow: document.getElementById('inp-name-shadow'),

    // Role
    role_font: document.getElementById('inp-role-font'),
    role_size: document.getElementById('inp-role-size'),
    num_role_size: document.getElementById('num-role-size'),
    role_color: document.getElementById('inp-role-color'),
    role_weight: document.getElementById('inp-role-weight'),
    role_transform: document.getElementById('inp-role-transform'),

    // Layout
    layout_gap: document.getElementById('inp-layout-gap'),
    num_layout_gap: document.getElementById('num-layout-gap'),
    padding_x: document.getElementById('inp-padding-x'),
    num_padding_x: document.getElementById('num-padding-x'),
    layout_align: document.getElementById('inp-layout-align')
};

// --- INITIALIZATION ---

socket.on('init_state', (state) => {
    if (state.theme_config) {
        designState = { ...designState, ...state.theme_config };
        updateUIValues();
        renderPreview();
    }
});

// --- EVENT LISTENERS ---

// Helper to attach listener to dual inputs (slider + number)
function attachDual(rangeEl, numEl, key, subkey) {
    if (!rangeEl || !numEl) return;

    // Range changes Number
    rangeEl.addEventListener('input', (e) => {
        let val = parseFloat(e.target.value);
        numEl.value = val;
        designState[key][subkey] = val;
        renderPreview();
    });

    // Number changes Range
    numEl.addEventListener('input', (e) => {
        let val = parseFloat(e.target.value);
        rangeEl.value = val;
        designState[key][subkey] = val;
        renderPreview();
    });
}

// Helper for single inputs
function attach(el, key, subkey, type = 'input') {
    if (!el) return;
    el.addEventListener(type, (e) => {
        let val = e.target.value;
        if (e.target.type === 'checkbox') val = e.target.checked;
        if (e.target.type === 'range') val = parseFloat(val);

        designState[key][subkey] = val;
        renderPreview();
    });
}

// Box Inputs
attachDual(inputs.box_width, inputs.num_box_width, 'box', 'width');
attachDual(inputs.box_height, inputs.num_box_height, 'box', 'height');
attachDual(inputs.box_x, inputs.num_box_x, 'box', 'x');
attachDual(inputs.box_y, inputs.num_box_y, 'box', 'y');
attachDual(inputs.box_opacity, inputs.num_box_opacity, 'box', 'opacity');
attachDual(inputs.box_radius, inputs.num_box_radius, 'box', 'radius');
attachDual(inputs.border_left, inputs.num_border_left, 'box', 'border_left');

// Colors
inputs.box_bg_color.addEventListener('input', (e) => {
    inputs.box_bg_color_text.value = e.target.value;
    designState.box.bg_color = e.target.value;
    renderPreview();
});
inputs.box_bg_color_text.addEventListener('change', (e) => {
    inputs.box_bg_color.value = e.target.value;
    designState.box.bg_color = e.target.value;
    renderPreview();
});
attach(inputs.border_color, 'box', 'border_color');

// Name Inputs
attach(inputs.name_font, 'name', 'font', 'change');
attachDual(inputs.name_size, inputs.num_name_size, 'name', 'size');
attach(inputs.name_color, 'name', 'color');
attach(inputs.name_weight, 'name', 'weight', 'change');
attach(inputs.name_transform, 'name', 'transform', 'change');
attach(inputs.name_shadow, 'name', 'shadow', 'change');

// Role Inputs
attach(inputs.role_font, 'role', 'font', 'change');
attachDual(inputs.role_size, inputs.num_role_size, 'role', 'size');
attach(inputs.role_color, 'role', 'color');
attach(inputs.role_weight, 'role', 'weight', 'change');
attach(inputs.role_transform, 'role', 'transform', 'change');

// Layout Inputs
attachDual(inputs.layout_gap, inputs.num_layout_gap, 'layout', 'gap');
attachDual(inputs.padding_x, inputs.num_padding_x, 'layout', 'padding_x');

// View Options
chkGrid.addEventListener('change', (e) => {
    if (e.target.checked) previewBg.classList.add('bg-checkered');
    else previewBg.classList.remove('bg-checkered');
});
chkSafe.addEventListener('change', (e) => {
    if (e.target.checked) safeGuides.classList.remove('hidden');
    else safeGuides.classList.add('hidden');
});

// Reset
btnReset.addEventListener('click', () => {
    if (confirm("Are you sure you want to reset to defaults?")) {
        designState = JSON.parse(JSON.stringify(DEFAULT_STATE));
        updateUIValues();
        renderPreview();
        showToast("Reset to Defaults");
    }
});

// Button Save
document.getElementById('btn-save').addEventListener('click', () => {
    socket.emit('update_theme_config', designState);
    showToast("Design Applied!");
});

// --- LOGIC ---

function setAlign(align) {
    designState.layout.align = align;
    inputs.layout_align.value = align;
    renderPreview();
}

function updateUIValues() {
    // Helper
    const setDual = (range, num, val) => {
        if (range) range.value = val;
        if (num) num.value = val;
    }

    // Box
    setDual(inputs.box_width, inputs.num_box_width, designState.box.width);
    setDual(inputs.box_height, inputs.num_box_height, designState.box.height);
    setDual(inputs.box_x, inputs.num_box_x, designState.box.x);
    setDual(inputs.box_y, inputs.num_box_y, designState.box.y);
    setDual(inputs.box_opacity, inputs.num_box_opacity, designState.box.opacity);
    setDual(inputs.box_radius, inputs.num_box_radius, designState.box.radius);
    setDual(inputs.border_left, inputs.num_border_left, designState.box.border_left);

    inputs.box_bg_color.value = designState.box.bg_color;
    inputs.box_bg_color_text.value = designState.box.bg_color;
    inputs.border_color.value = designState.box.border_color;

    // Name
    inputs.name_font.value = designState.name.font;
    setDual(inputs.name_size, inputs.num_name_size, designState.name.size);
    inputs.name_color.value = designState.name.color;
    inputs.name_weight.value = designState.name.weight;
    inputs.name_transform.value = designState.name.transform;
    inputs.name_shadow.checked = designState.name.shadow;

    // Role
    inputs.role_font.value = designState.role.font;
    setDual(inputs.role_size, inputs.num_role_size, designState.role.size);
    inputs.role_color.value = designState.role.color;
    inputs.role_weight.value = designState.role.weight;
    inputs.role_transform.value = designState.role.transform;

    // Layout
    setDual(inputs.layout_gap, inputs.num_layout_gap, designState.layout.gap);
    setDual(inputs.padding_x, inputs.num_padding_x, designState.layout.padding_x);
}


function renderPreview() {
    // We render on a 960x540 box (1/2 scale of 1080p)
    const scale = 0.5;

    // Box Styles
    previewLt.style.width = (designState.box.width * scale) + 'px';
    previewLt.style.minHeight = (designState.box.height * scale) + 'px';

    // Positioning
    previewLt.style.left = designState.box.x + '%';
    previewLt.style.top = designState.box.y + '%';
    previewLt.style.transform = 'translate(-50%, -50%)';

    // Background
    const hex = designState.box.bg_color;
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
        previewLt.style.backgroundColor = `rgba(${r},${g},${b},${designState.box.opacity})`;
    } else {
        previewLt.style.backgroundColor = hex;
    }

    previewLt.style.borderRadius = designState.box.radius + 'px';
    previewLt.style.borderLeft = `${designState.box.border_left * scale}px solid ${designState.box.border_color}`;

    // Layout
    previewLt.style.alignItems = designState.layout.align === 'start' ? 'flex-start' : (designState.layout.align === 'end' ? 'flex-end' : 'center');
    previewLt.style.textAlign = designState.layout.align === 'start' ? 'left' : (designState.layout.align === 'end' ? 'right' : 'center');
    previewLt.style.gap = (designState.layout.gap * scale) + 'px';
    previewLt.style.paddingLeft = (designState.layout.padding_x * scale) + 'px';
    previewLt.style.paddingRight = (designState.layout.padding_x * scale) + 'px';

    // Name Styles
    previewName.style.fontFamily = designState.name.font;
    previewName.style.fontSize = (designState.name.size * scale) + 'px';
    previewName.style.color = designState.name.color;
    previewName.style.fontWeight = designState.name.weight;
    previewName.style.textTransform = designState.name.transform;
    previewName.style.textShadow = designState.name.shadow ? '2px 2px 4px rgba(0,0,0,0.5)' : 'none';

    // Role Styles
    previewRole.style.fontFamily = designState.role.font;
    previewRole.style.fontSize = (designState.role.size * scale) + 'px';
    previewRole.style.color = designState.role.color;
    previewRole.style.fontWeight = designState.role.weight;
    previewRole.style.textTransform = designState.role.transform;
}

function showToast(msg) {
    // Simple toast
    const el = document.createElement('div');
    el.innerText = msg;
    el.className = "fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow-lg animate-bounce z-50";
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2000);
}

// Initial Render
renderPreview();

window.setAlign = setAlign; // Expose to global for HTML onclick

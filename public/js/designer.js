const socket = io();

// --- STATE ---
const DEFAULT_LAYERS = [
    { id: 'l_box', type: 'shape', name: 'Main Box', x: 50, y: 85, width: 800, height: 150, color: 'primary', opacity: 0.95, radius: 0, border: 0, borderColor: 'secondary', duration: 0.8, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
    { id: 'l_name', type: 'text', name: 'Name Text', x: 50, y: 83, content: 'Rev. John Doe', font: 'Cinzel', size: 42, color: 'video-white', align: 'center', weight: '700', shadow: true, delay: 100, duration: 0.8, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
    { id: 'l_role', type: 'text', name: 'Role Text', x: 50, y: 88, content: 'Senior Pastor', font: 'Lato', size: 24, color: 'accent', align: 'center', weight: '300', transform: 'uppercase', shadow: false, delay: 200, duration: 0.8, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }
];

let designState = {
    themeMode: 'standard',
    baseColor: '#3b82f6',
    palette: {}, // Generated
    layers: JSON.parse(JSON.stringify(DEFAULT_LAYERS))
};

let selectedLayerId = null;

// --- DOM ---
const layersListEl = document.getElementById('layers-list');
const propertiesPanelEl = document.getElementById('properties-panel');
const previewContainer = document.getElementById('preview-container');
const inpThemeBase = document.getElementById('inp-theme-base');
const inpThemeBaseText = document.getElementById('inp-theme-base-text');
const selThemeMode = document.getElementById('sel-theme-mode');
const palettePreview = document.getElementById('palette-preview');

// --- INITIALIZATION ---
function init() {
    updatePalette(); // Generate initial palette
    renderLayersList();
    renderPreview();
    setupInteractions();

    // Theme Inputs
    inpThemeBase.addEventListener('input', (e) => {
        inpThemeBaseText.value = e.target.value;
        designState.baseColor = e.target.value;
        updatePalette();
    });
    inpThemeBaseText.addEventListener('change', (e) => {
        inpThemeBase.value = e.target.value;
        designState.baseColor = e.target.value;
        updatePalette();
    });
    selThemeMode.addEventListener('change', (e) => {
        designState.themeMode = e.target.value;
        updatePalette();
    });

    // View Options
    document.getElementById('chk-grid').addEventListener('change', (e) => {
        document.getElementById('preview-bg').classList.toggle('bg-checkered', e.target.checked);
    });
    document.getElementById('chk-lines').addEventListener('change', (e) => {
        document.getElementById('grid-overlay').classList.toggle('visible', e.target.checked);
    });
    document.getElementById('chk-safe').addEventListener('change', (e) => {
        const guides = document.getElementById('safe-guides');
        if (e.target.checked) guides.classList.remove('hidden');
        else guides.classList.add('hidden');
    });

    document.getElementById('btn-auto-theme').addEventListener('click', () => {
        const rand = '#' + Math.floor(Math.random() * 16777215).toString(16);
        designState.baseColor = rand;
        inpThemeBase.value = rand;
        inpThemeBaseText.value = rand;
        updatePalette();
    });

    document.getElementById('btn-reset').addEventListener('click', () => {
        if (confirm('Reset all layers?')) {
            designState.layers = JSON.parse(JSON.stringify(DEFAULT_LAYERS));
            selectedLayerId = null;
            renderLayersList();
            renderPreview();
            renderProperties();
        }
    });

    document.getElementById('btn-save').addEventListener('click', () => {
        // Send full state including palette
        socket.emit('update_theme_config', designState);
        alert('Design Applied!');
    });
}

// --- LOGIC ---

function updatePalette() {
    const pal = generatePalette(designState.baseColor, designState.themeMode);
    if (pal) {
        designState.palette = pal;
        // visual update
        palettePreview.innerHTML = `
            <div class="flex-1 h-full" style="background:${pal.primary}" title="Primary"></div>
            <div class="flex-1 h-full" style="background:${pal.secondary}" title="Secondary"></div>
            <div class="flex-1 h-full" style="background:${pal.accent}" title="Accent"></div>
            <div class="flex-1 h-full" style="background:${pal.bg}" title="Background"></div>
        `;
        renderPreview(); // Colors changed
    }
}

function getLayer(id) { return designState.layers.find(l => l.id === id); }

function selectLayer(id) {
    selectedLayerId = id;
    renderLayersList(); // Update active state
    renderProperties();

    // Highlight in preview
    document.querySelectorAll('.preview-element').forEach(el => el.classList.remove('ring-2', 'ring-blue-500'));
    const el = document.getElementById(`prev-${id}`);
    if (el) el.classList.add('ring-2', 'ring-blue-500');
}

function addLayer(type) {
    const id = 'l_' + Date.now();
    let layer = {
        id,
        type,
        name: type === 'shape' ? 'New Shape' : 'New Text',
        x: 50,
        y: 50,
        color: 'primary',
        opacity: 1
    };

    if (type === 'shape') {
        layer = { ...layer, width: 200, height: 50, radius: 0 };
    } else if (type === 'text') {
        layer = { ...layer, content: 'Text', font: 'Lato', size: 24, align: 'center', weight: '400' };
    }

    designState.layers.push(layer);
    renderLayersList();
    renderPreview();
    selectLayer(id);
}

function deleteLayer(id) {
    if (!confirm('Delete layer?')) return;
    designState.layers = designState.layers.filter(l => l.id !== id);
    if (selectedLayerId === id) selectedLayerId = null;
    renderLayersList();
    renderPreview();
    renderProperties();
}

// --- RENDERING UI ---

function renderLayersList() {
    layersListEl.innerHTML = '';
    designState.layers.forEach((layer, idx) => {
        const li = document.createElement('li');
        li.className = `flex items-center gap-2 p-2 rounded cursor-pointer border mb-1 ${selectedLayerId === layer.id ? 'bg-blue-900/40 border-blue-500' : 'bg-gray-700 border-transparent hover:bg-gray-600'}`;
        li.innerHTML = `
            <i class="fas fa-grip-lines text-gray-500 text-xs handle cursor-move"></i>
            <i class="fas ${layer.type === 'shape' ? 'fa-square' : 'fa-font'} text-gray-400 text-xs w-4 text-center"></i>
            <span class="text-xs flex-1 truncate select-none">${layer.name}</span>
            <i class="fas fa-trash text-gray-500 hover:text-red-400 text-xs px-2" data-action="delete" data-id="${layer.id}"></i>
        `;
        li.onclick = (e) => {
            if (e.target.dataset.action === 'delete') {
                deleteLayer(e.target.dataset.id);
            } else {
                selectLayer(layer.id);
            }
        };
        layersListEl.appendChild(li);
    });
}

function renderProperties() {
    propertiesPanelEl.innerHTML = '';
    if (!selectedLayerId) {
        propertiesPanelEl.innerHTML = '<p class="text-xs text-gray-500 text-center italic mt-4">Select a layer to edit properties</p>';
        return;
    }

    const layer = getLayer(selectedLayerId);
    if (!layer) return;

    // Helper for input creation
    const createInput = (label, type, key, props = {}) => {
        const items = props.options ? props.options.map(o => `<option value="${o.val}" ${o.val == layer[key] ? 'selected' : ''}>${o.label}</option>`).join('') : '';
        let inputHtml = '';

        if (type === 'select') {
            inputHtml = `<select class="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs" data-key="${key}">${items}</select>`;
        } else if (type === 'color') {
            // Smart Color Picker
            const isPaletteRef = ['primary', 'secondary', 'accent', 'bg', 'video-white'].includes(layer[key]);
            const customVal = isPaletteRef ? '#ffffff' : layer[key];

            inputHtml = `
                <div class="flex flex-col gap-1">
                    <select class="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs mb-1" id="sel-color-type-${key}">
                        <option value="custom" ${!isPaletteRef ? 'selected' : ''}>Custom</option>
                        <option value="primary" ${layer[key] === 'primary' ? 'selected' : ''}>Theme Primary</option>
                        <option value="secondary" ${layer[key] === 'secondary' ? 'selected' : ''}>Theme Secondary</option>
                        <option value="accent" ${layer[key] === 'accent' ? 'selected' : ''}>Theme Accent</option>
                        <option value="bg" ${layer[key] === 'bg' ? 'selected' : ''}>Theme Background</option>
                        <option value="video-white" ${layer[key] === 'video-white' ? 'selected' : ''}>White</option>
                    </select>
                    <div class="flex gap-1 ${isPaletteRef ? 'hidden' : ''}" id="grp-custom-color-${key}">
                        <input type="color" class="w-6 h-6 rounded cursor-pointer border-0" value="${customVal}" data-key="${key}">
                        <input type="text" class="flex-1 bg-gray-700 border border-gray-600 rounded px-2 text-xs" value="${customVal}" data-key="${key}">
                    </div>
                </div>
             `;
        } else if (type === 'range') {
            inputHtml = `
                <div class="flex gap-2 items-center">
                    <input type="range" class="flex-1" min="${props.min}" max="${props.max}" step="${props.step || 1}" value="${layer[key]}" data-key="${key}">
                    <input type="number" class="w-12 bg-gray-700 border border-gray-600 rounded px-1 text-xs text-center py-1" value="${layer[key]}" data-key="${key}">
                </div>
             `;
        } else {
            inputHtml = `<input type="${type}" class="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs" value="${layer[key]}" data-key="${key}">`;
        }

        const div = document.createElement('div');
        div.className = "mb-3";
        div.innerHTML = `<label class="block text-[10px] text-gray-400 font-bold uppercase mb-1">${label}</label>${inputHtml}`;
        return div;
    };

    // Generic Props
    propertiesPanelEl.appendChild(createInput('Name', 'text', 'name'));
    propertiesPanelEl.appendChild(createInput('X Position (%)', 'range', 'x', { min: 0, max: 100 }));
    propertiesPanelEl.appendChild(createInput('Y Position (%)', 'range', 'y', { min: 0, max: 100 }));
    propertiesPanelEl.appendChild(createInput('Color', 'color', 'color'));
    propertiesPanelEl.appendChild(createInput('Opacity', 'range', 'opacity', { min: 0, max: 1, step: 0.01 }));

    // Animation Props
    const animGroup = document.createElement('div');
    animGroup.className = "mt-4 border-t border-gray-700 pt-2";
    animGroup.innerHTML = '<h4 class="text-[10px] font-bold uppercase text-blue-400 mb-2">Animation</h4>';
    propertiesPanelEl.appendChild(animGroup);

    propertiesPanelEl.appendChild(createInput('Duration (s)', 'range', 'duration', { min: 0.1, max: 5, step: 0.1 }));
    propertiesPanelEl.appendChild(createInput('Delay (ms)', 'range', 'delay', { min: 0, max: 2000, step: 100 }));
    propertiesPanelEl.appendChild(createInput('Easing', 'select', 'easing', {
        options: [
            { val: 'ease-out', label: 'Ease Out' }, { val: 'ease-in', label: 'Ease In' }, { val: 'ease-in-out', label: 'Ease In Out' }, { val: 'linear', label: 'Linear' },
            { val: 'cubic-bezier(0.16, 1, 0.3, 1)', label: 'Smooth (Spring)' }, { val: 'cubic-bezier(0.68, -0.55, 0.27, 1.55)', label: 'Bounce' }
        ]
    }));
    propertiesPanelEl.appendChild(createInput('Enter From', 'select', 'enterFrom', {
        options: [
            { val: 'bottom', label: 'Bottom' }, { val: 'top', label: 'Top' }, { val: 'left', label: 'Left' }, { val: 'right', label: 'Right' }, { val: 'fade', label: 'Fade Only' }
        ]
    }));

    // Type Specific
    if (layer.type === 'shape') {
        const shapeGroup = document.createElement('div');
        shapeGroup.className = "mt-4 border-t border-gray-700 pt-2";
        shapeGroup.innerHTML = '<h4 class="text-[10px] font-bold uppercase text-gray-500 mb-2">Shape Specs</h4>';
        propertiesPanelEl.appendChild(shapeGroup);

        propertiesPanelEl.appendChild(createInput('Width (px)', 'range', 'width', { min: 10, max: 1920 }));
        propertiesPanelEl.appendChild(createInput('Height (px)', 'range', 'height', { min: 10, max: 500 }));
        propertiesPanelEl.appendChild(createInput('Border Radius', 'range', 'radius', { min: 0, max: 100 }));
        propertiesPanelEl.appendChild(createInput('Border Width', 'range', 'border', { min: 0, max: 20 }));
        propertiesPanelEl.appendChild(createInput('Border Color', 'color', 'borderColor'));
    }

    if (layer.type === 'text') {
        const textGroup = document.createElement('div');
        textGroup.className = "mt-4 border-t border-gray-700 pt-2";
        textGroup.innerHTML = '<h4 class="text-[10px] font-bold uppercase text-gray-500 mb-2">Text Specs</h4>';
        propertiesPanelEl.appendChild(textGroup);

        propertiesPanelEl.appendChild(createInput('Font', 'select', 'font', {
            options: [
                { val: 'Cinzel', label: 'Cinzel' }, { val: 'Lato', label: 'Lato' }, { val: 'Roboto', label: 'Roboto' },
                { val: 'Montserrat', label: 'Montserrat' }, { val: 'Open Sans', label: 'Open Sans' }, { val: 'Playfair Display', label: 'Playfair' }
            ]
        }));
        propertiesPanelEl.appendChild(createInput('Size (px)', 'range', 'size', { min: 10, max: 200 }));
        propertiesPanelEl.appendChild(createInput('Weight', 'select', 'weight', {
            options: [
                { val: '300', label: 'Light' }, { val: '400', label: 'Normal' }, { val: '700', label: 'Bold' }, { val: '900', label: 'Heavy' }
            ]
        }));
        propertiesPanelEl.appendChild(createInput('Align', 'select', 'align', {
            options: [
                { val: 'left', label: 'Left' }, { val: 'center', label: 'Center' }, { val: 'right', label: 'Right' }
            ]
        }));
        // Shadow checkbox manually
        const sDiv = document.createElement('div');
        sDiv.innerHTML = `<label class="flex items-center gap-2 cursor-pointer text-xs"><input type="checkbox" ${layer.shadow ? 'checked' : ''} id="chk-shadow"> Drop Shadow</label>`;
        sDiv.querySelector('input').addEventListener('change', (e) => {
            layer.shadow = e.target.checked;
            renderPreview();
        });
        propertiesPanelEl.appendChild(sDiv);
    }

    // Attach Listeners
    propertiesPanelEl.querySelectorAll('input, select').forEach(el => {
        if (el.id === 'chk-shadow') return; // handled manually

        // Special logic for the Color Type Select dropdown
        if (el.id.startsWith('sel-color-type-')) {
            el.addEventListener('change', (e) => {
                const key = el.id.replace('sel-color-type-', '');
                const grp = document.getElementById(`grp-custom-color-${key}`);

                if (e.target.value === 'custom') {
                    grp.classList.remove('hidden');
                    // Use whatever is in the text box
                    layer[key] = grp.querySelector('input[type=text]').value;
                } else {
                    grp.classList.add('hidden');
                    layer[key] = e.target.value;
                }
                renderPreview();
            });
            return;
        }

        // Generic Listener
        const handler = (e) => {
            const key = el.dataset.key;
            if (!key) return;
            let val = e.target.value;
            if (e.target.type === 'number' || e.target.type === 'range') val = parseFloat(val);

            // Sync dual inputs
            if (e.target.type === 'range') {
                const num = propertiesPanelEl.querySelector(`input[type=number][data-key="${key}"]`);
                if (num) num.value = val;
            }
            if (e.target.type === 'number') {
                const rng = propertiesPanelEl.querySelector(`input[type=range][data-key="${key}"]`);
                if (rng) rng.value = val;
            }

            layer[key] = val;

            // If Text Name update, redraw list
            if (key === 'name') renderLayersList();

            renderPreview();
        };
        el.addEventListener('input', handler);
    });
}

// --- RENDER PREVIEW ---

function resolveColor(val) {
    if (val === 'primary') return designState.palette.primary;
    if (val === 'secondary') return designState.palette.secondary;
    if (val === 'accent') return designState.palette.accent;
    if (val === 'bg') return designState.palette.bg;
    if (val === 'video-white') return '#ffffff';
    return val;
}

function renderPreview() {
    // 50% scale container
    const scale = 0.5;
    previewContainer.innerHTML = '';

    designState.layers.forEach(layer => {
        const el = document.createElement('div');
        el.id = `prev-${layer.id}`;
        el.className = 'preview-element absolute transition-colors duration-200 cursor-move';
        el.dataset.id = layer.id;

        // Common Styles
        el.style.left = layer.x + '%';
        el.style.top = layer.y + '%';

        let tx = '-50%';
        if (layer.align === 'left') tx = '0%';
        if (layer.align === 'right') tx = '-100%';
        el.style.transform = `translate(${tx}, -50%)`;

        const bg = hexToRgba(resolveColor(layer.color), layer.opacity);

        if (layer.type === 'shape') {
            el.style.width = (layer.width * scale) + 'px';
            el.style.height = (layer.height * scale) + 'px';
            el.style.backgroundColor = bg;
            el.style.borderRadius = layer.radius + 'px';
            if (layer.border > 0) {
                el.style.border = `${layer.border * scale}px solid ${resolveColor(layer.borderColor || '#000')}`;
            }
        } else if (layer.type === 'text') {
            el.innerText = layer.content;
            el.style.whiteSpace = 'nowrap';
            el.style.fontFamily = layer.font;
            el.style.fontSize = (layer.size * scale) + 'px';
            el.style.color = bg;
            el.style.fontWeight = layer.weight;
            el.style.textAlign = layer.align;
            if (layer.transform) el.style.textTransform = layer.transform;
            if (layer.shadow) el.style.textShadow = '1px 1px 2px rgba(0,0,0,0.8)';

            el.style.pointerEvents = 'auto';
            el.style.userSelect = 'none';
        }

        // Click to select
        el.addEventListener('mousedown', (e) => {
            if (selectedLayerId !== layer.id) {
                selectLayer(layer.id);
            }
        });

        previewContainer.appendChild(el);
    });

    if (selectedLayerId) {
        // re-apply border ring
        const el = document.getElementById(`prev-${selectedLayerId}`);
        if (el) el.classList.add('ring-2', 'ring-blue-500');
    }
}

// --- INTERACTIONS ---
// --- INTERACTIONS ---
function setupInteractions() {
    // 1. Sortable Layers
    new Sortable(layersListEl, {
        handle: '.handle',
        animation: 150,
        onEnd: (evt) => {
            // Update array order based on DOM
            const item = designState.layers.splice(evt.oldIndex, 1)[0];
            designState.layers.splice(evt.newIndex, 0, item);
            renderPreview(); // Z-index changes
        }
    });

    // 2. InteractJS Dragging
    let dragState = null;

    interact('.preview-element').draggable({
        listeners: {
            start(event) {
                const target = event.target;
                const container = document.getElementById('preview-container');
                const contRect = container.getBoundingClientRect();
                const targetRect = target.getBoundingClientRect();

                dragState = {
                    startLeft: targetRect.left - contRect.left,
                    startTop: targetRect.top - contRect.top,
                    totalDX: 0,
                    totalDY: 0,
                    width: targetRect.width,
                    height: targetRect.height,
                    contW: contRect.width,
                    contH: contRect.height,
                    contRect: contRect
                };
            },
            move(event) {
                if (!dragState) return;
                const target = event.target;
                const id = target.dataset.id;
                const layer = getLayer(id);
                if (!layer) return;

                if (selectedLayerId !== id) selectLayer(id);

                // Accumulate "Physical" Movement
                dragState.totalDX += event.dx;
                dragState.totalDY += event.dy;

                // Proposed Position (un-snapped)
                let l = dragState.startLeft + dragState.totalDX;
                let t = dragState.startTop + dragState.totalDY;
                let width = dragState.width;
                let height = dragState.height;
                let r = l + width;
                let b = t + height;
                let cx = l + width / 2;
                let cy = t + height / 2;

                // Snap Logic
                const THRESHOLD = 5; // px
                const snapX = [];
                const snapY = [];
                const contRect = dragState.contRect;

                // 1. Center
                snapX.push({ value: contRect.width / 2, type: 'center' });
                snapY.push({ value: contRect.height / 2, type: 'center' });

                // 2. Other Elements
                document.querySelectorAll('.preview-element').forEach(el => {
                    if (el.dataset.id === id) return;
                    const r = el.getBoundingClientRect();
                    const elL = r.left - contRect.left;
                    const elT = r.top - contRect.top;
                    snapX.push({ value: elL, type: 'edge' });
                    snapX.push({ value: elL + r.width, type: 'edge' });
                    snapX.push({ value: elL + r.width / 2, type: 'center' });
                    snapY.push({ value: elT, type: 'edge' });
                    snapY.push({ value: elT + r.height, type: 'edge' });
                    snapY.push({ value: elT + r.height / 2, type: 'center' });
                });

                // Check X
                let bestDiffX = Infinity;
                let adjX = 0;
                let activeGuidesX = [];
                const checkX = (current) => {
                    snapX.forEach(cand => {
                        const diff = cand.value - current;
                        if (Math.abs(diff) < THRESHOLD && Math.abs(diff) < Math.abs(bestDiffX)) {
                            bestDiffX = diff;
                            adjX = diff;
                            activeGuidesX = [cand.value];
                        } else if (Math.abs(diff) === Math.abs(bestDiffX) && Math.abs(diff) < THRESHOLD) {
                            activeGuidesX.push(cand.value);
                        }
                    });
                };
                checkX(l); checkX(cx); checkX(r);

                if (Math.abs(bestDiffX) < THRESHOLD) l += adjX;
                else activeGuidesX = [];

                // Check Y
                let bestDiffY = Infinity;
                let adjY = 0;
                let activeGuidesY = [];
                const checkY = (current) => {
                    snapY.forEach(cand => {
                        const diff = cand.value - current;
                        if (Math.abs(diff) < THRESHOLD && Math.abs(diff) < Math.abs(bestDiffY)) {
                            bestDiffY = diff;
                            adjY = diff;
                            activeGuidesY = [cand.value];
                        } else if (Math.abs(diff) === Math.abs(bestDiffY) && Math.abs(diff) < THRESHOLD) {
                            activeGuidesY.push(cand.value);
                        }
                    });
                };
                checkY(t); checkY(cy); checkY(b);

                if (Math.abs(bestDiffY) < THRESHOLD) t += adjY;
                else activeGuidesY = [];

                // Update DOM Visuals
                // Re-calculate percentages for storage
                // Use final snapped l/t for calculation
                const finalCX = l + width / 2;
                const finalCY = t + height / 2;

                let newPercentX = 0;
                if (layer.align === 'left') newPercentX = (l / contRect.width) * 100;
                else if (layer.align === 'right') newPercentX = ((l + width) / contRect.width) * 100;
                else newPercentX = (finalCX / contRect.width) * 100;

                let newPercentY = (finalCY / contRect.height) * 100;

                layer.x = newPercentX;
                layer.y = newPercentY;

                target.style.left = layer.x + '%';
                target.style.top = layer.y + '%';

                // Guides
                for (let i = 1; i <= 3; i++) document.getElementById(`guide-v-${i}`).classList.add('hidden');
                for (let i = 1; i <= 3; i++) document.getElementById(`guide-h-${i}`).classList.add('hidden');
                activeGuidesX.forEach((val, i) => {
                    if (i > 2) return;
                    const g = document.getElementById(`guide-v-${i + 1}`);
                    g.style.left = val + 'px';
                    g.classList.remove('hidden');
                });
                activeGuidesY.forEach((val, i) => {
                    if (i > 2) return;
                    const g = document.getElementById(`guide-h-${i + 1}`);
                    g.style.top = val + 'px';
                    g.classList.remove('hidden');
                });

                // Update Inputs
                const inpX = document.querySelector(`input[data-key="x"]`);
                const inpY = document.querySelector(`input[data-key="y"]`);
                if (inpX) inpX.value = Math.round(layer.x * 10) / 10;
                if (inpY) inpY.value = Math.round(layer.y * 10) / 10;
            },
            end() {
                dragState = null;
                for (let i = 1; i <= 3; i++) document.getElementById(`guide-v-${i}`).classList.add('hidden');
                for (let i = 1; i <= 3; i++) document.getElementById(`guide-h-${i}`).classList.add('hidden');
            }
        }
    });
}

// On load
window.addEventListener('DOMContentLoaded', () => {
    socket.on('init_state', (state) => {
        if (state.theme_config && state.theme_config.layers) {
            designState = state.theme_config;
            init();
        } else {
            // Old state detected or empty, stay with defaults
            console.log("Old theme state detected, using defaults or migration needed.");
            init();
        }
    });
});

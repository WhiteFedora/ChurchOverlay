// --- LIST MGMT ---
function editItem(type, idx) {
    const current = localLists[type][idx];
    const newName = prompt(`Edit ${type === 'people' ? 'Person' : 'Task'}:`, current);
    if (newName !== null && newName.trim() !== "") {
        localLists[type][idx] = newName.trim();
        emitLists(localLists);
    }
}

function triggerCsv(type) {
    document.getElementById(`csv-${type}`).click();
}

function processCsvUpload(type, input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        const text = e.target.result;
        // Simple CSV parsing: split by newlines, then by commas, take the first non-empty column
        const lines = text.split(/\r\n|\n/);
        let addedCount = 0;

        lines.forEach(line => {
            // Remove quotes and whitespace
            const val = line.split(',')[0].replace(/^"|"$/g, '').trim();
            if (val && !localLists[type].includes(val)) {
                localLists[type].push(val);
                addedCount++;
            }
        });

        if (addedCount > 0) {
            emitLists(localLists);
            alert(`Imported ${addedCount} new items from CSV.`);
        } else {
            alert("No new unique items found in CSV.");
        }
        input.value = ''; // Reset input
    };
    reader.readAsText(file);
}

function openListsModal() { document.getElementById('modal-lists').classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
function addItem(type) {
    const inp = document.getElementById(type === 'people' ? 'new-person' : 'new-task');
    if (inp.value.trim()) {
        localLists[type].push(inp.value.trim());
        emitLists(localLists);
        inp.value = '';
    }
}
function remItem(type, idx) {
    localLists[type].splice(idx, 1);
    emitLists(localLists);
}
function moveListItem(type, index, direction) {
    if (index + direction < 0 || index + direction >= localLists[type].length) return;
    [localLists[type][index], localLists[type][index + direction]] = [localLists[type][index + direction], localLists[type][index]];
    emitLists(localLists);
}
function openAddSlateModal() { document.getElementById('modal-add-slate').classList.remove('hidden'); toggleSlateInputs(); }
function toggleSlateInputs() {
    const type = document.querySelector('input[name="stype"]:checked').value;
    document.getElementById('inputs-text').classList.toggle('hidden', type !== 'text');
    document.getElementById('inputs-image').classList.toggle('hidden', type !== 'image');
}

function saveNewSlate() {
    const type = document.querySelector('input[name="stype"]:checked').value;
    let slate = { id: Date.now(), type };
    if (type === 'text') {
        slate.title = document.getElementById('new-stitle').value;
        slate.sub = document.getElementById('new-ssub').value;
        if (!slate.title) return alert('Title required');
    } else {
        const file = document.getElementById('new-sfile').files[0];
        if (!file) return alert('File required');
        compressImage(file).then(compressedBlob => {
            if (compressedBlob.size > 50000000) return alert('Compressed image still too large. Please choose a smaller image.');
            const reader = new FileReader();
            reader.onload = (e) => {
                slate.src = e.target.result;
                slate.label = document.getElementById('new-slabel').value || "Image";
                localLists.slates.push(slate);
                emitLists(localLists);
                closeModal('modal-add-slate');
            };
            reader.readAsDataURL(compressedBlob);
        });
        return;
    }
    localLists.slates.push(slate);
    emitLists(localLists);
    closeModal('modal-add-slate');
}

function delSlate(i) { if (confirm('Delete slate?')) { localLists.slates.splice(i, 1); emitLists(localLists); } }
function moveSlate(i, dir) {
    [localLists.slates[i], localLists.slates[i + dir]] = [localLists.slates[i + dir], localLists.slates[i]];
    emitLists(localLists);
}
function compressImage(file, maxWidth = 3840, quality = 0.9) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.onload = () => {
            const isPng = file.type === 'image/png';
            const targetWidth = Math.min(maxWidth, img.width);
            const ratio = targetWidth / img.width;
            canvas.width = img.width * ratio;
            canvas.height = img.height * ratio;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const mime = isPng ? 'image/png' : 'image/jpeg';
            const qual = isPng ? undefined : quality;
            canvas.toBlob(resolve, mime, qual);
        };
        img.src = URL.createObjectURL(file);
    });
}

// --- UTILS ---
function copyLink() {
    const url = window.location.href.split('?')[0] + '?mode=overlay';
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(() => {
            alert("Link copied to clipboard!");
        }).catch(() => {
            prompt("Copy this link for your Display Computer:", url);
        });
    } else {
        prompt("Copy this link for your Display Computer:", url);
    }
}
function launchOverlay() {
    const url = window.location.href.split('?')[0] + '?mode=overlay';
    const win = window.open(url, 'Overlay', 'width=1920,height=1080');
    if (!win) alert("Popup blocked. Please use Copy Link.");
}
function toggleFS() { if (!document.fullscreenElement) document.documentElement.requestFullscreen(); }

// --- THEME MANAGEMENT ---
function setTheme(theme) {
    if (theme === 'system') {
        localStorage.removeItem('theme');
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    } else {
        localStorage.theme = theme;
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }
}

// Initialize Dropdown State
window.addEventListener('DOMContentLoaded', () => {
    const sel = document.getElementById('theme-selector');
    if (sel) {
        if ('theme' in localStorage) {
            sel.value = localStorage.theme;
        } else {
            sel.value = 'system';
        }
    }
});

// Listener for system changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (!('theme' in localStorage)) {
        if (e.matches) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }
});


// --- COLOR LOGIC FOR DESIGNER ---

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function rgbToHsl(r, g, b) {
    r /= 255, g /= 255, b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max == min) {
        h = s = 0; // achromatic
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToRgb(h, s, l) {
    let r, g, b;
    h /= 360;
    s /= 100;
    l /= 100;

    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

function componentToHex(c) {
    const hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function hexToRgba(hex, alpha) {
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


function generatePalette(baseHex, type = 'standard') {
    const rgb = hexToRgb(baseHex);
    if (!rgb) return null;
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

    let colors = {
        primary: baseHex,
        secondary: '',
        accent: '',
        bg: '',
        text: '#ffffff'
    };

    if (type === 'standard') {
        // Complimentary
        const secHsl = { ...hsl, h: (hsl.h + 180) % 360 };
        const accHsl = { ...hsl, h: (hsl.h + 30) % 360, l: Math.min(hsl.l + 20, 90) };
        const bgHsl = { ...hsl, s: Math.min(hsl.s, 20), l: 15 };

        colors.secondary = rgbToHex(hslToRgb(secHsl.h, secHsl.s, secHsl.l).r, hslToRgb(secHsl.h, secHsl.s, secHsl.l).g, hslToRgb(secHsl.h, secHsl.s, secHsl.l).b);
        colors.accent = rgbToHex(hslToRgb(accHsl.h, accHsl.s, accHsl.l).r, hslToRgb(accHsl.h, accHsl.s, accHsl.l).g, hslToRgb(accHsl.h, accHsl.s, accHsl.l).b);
        colors.bg = rgbToHex(hslToRgb(bgHsl.h, bgHsl.s, bgHsl.l).r, hslToRgb(bgHsl.h, bgHsl.s, bgHsl.l).g, hslToRgb(bgHsl.h, bgHsl.s, bgHsl.l).b);

    } else if (type === 'vibrant') {
        // Triadic or Split Complementary
        const secHsl = { ...hsl, h: (hsl.h + 120) % 360, s: Math.min(hsl.s + 10, 100) };
        const accHsl = { ...hsl, h: (hsl.h + 240) % 360, s: Math.min(hsl.s + 10, 100) };
        const bgHsl = { ...hsl, s: 80, l: 10 }; // Deep saturated background

        colors.secondary = rgbToHex(hslToRgb(secHsl.h, secHsl.s, secHsl.l).r, hslToRgb(secHsl.h, secHsl.s, secHsl.l).g, hslToRgb(secHsl.h, secHsl.s, secHsl.l).b);
        colors.accent = rgbToHex(hslToRgb(accHsl.h, accHsl.s, accHsl.l).r, hslToRgb(accHsl.h, accHsl.s, accHsl.l).g, hslToRgb(accHsl.h, accHsl.s, accHsl.l).b);
        colors.bg = rgbToHex(hslToRgb(bgHsl.h, bgHsl.s, bgHsl.l).r, hslToRgb(bgHsl.h, bgHsl.s, bgHsl.l).g, hslToRgb(bgHsl.h, bgHsl.s, bgHsl.l).b);

    } else if (type === 'pastel') {
        const pSat = 60;
        const pLight = 85;
        colors.primary = rgbToHex(hslToRgb(hsl.h, pSat, pLight).r, hslToRgb(hsl.h, pSat, pLight).g, hslToRgb(hsl.h, pSat, pLight).b);

        const secHsl = { ...hsl, h: (hsl.h + 180) % 360 };
        colors.secondary = rgbToHex(hslToRgb(secHsl.h, pSat, pLight).r, hslToRgb(secHsl.h, pSat, pLight).g, hslToRgb(secHsl.h, pSat, pLight).b);

        const bgHsl = { ...hsl, s: 20, l: 95 }; // Very light
        colors.bg = rgbToHex(hslToRgb(bgHsl.h, bgHsl.s, bgHsl.l).r, hslToRgb(bgHsl.h, bgHsl.s, bgHsl.l).g, hslToRgb(bgHsl.h, bgHsl.s, bgHsl.l).b);
        colors.text = '#333333';
    }

    return colors;
}
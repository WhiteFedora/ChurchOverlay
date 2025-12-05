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
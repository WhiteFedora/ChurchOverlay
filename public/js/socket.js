// --- SOCKET LISTENERS ---
socket.on('connect', () => {
    document.getElementById('auth-status').innerText = "Connected (LAN)";
    document.getElementById('auth-status').className = "px-3 py-1 bg-green-100 text-green-800 rounded text-xs font-bold flex items-center";
});

socket.on('disconnect', () => {
    document.getElementById('auth-status').innerText = "Disconnected";
    document.getElementById('auth-status').className = "px-3 py-1 bg-red-100 text-red-800 rounded text-xs font-bold flex items-center";
});

socket.on('init_state', (state) => {
    try {
        console.log('Init State:', state);
        if (typeof updateStatus === 'function') updateStatus(state.status);
        if (typeof updateLists === 'function') updateLists(state.lists);

        // Theme first, then overlay
        if (state.theme_config && typeof window.updateThemeConfig === 'function') {
            window.updateThemeConfig(state.theme_config);
        } else if (state.theme_config && typeof updateThemeConfig === 'function') {
            updateThemeConfig(state.theme_config);
        }

        if (typeof updateOverlay === 'function') updateOverlay(state.status);
    } catch (e) {
        console.error("Critical Error in init_state:", e);
    }
});

socket.on('status_changed', (status) => {
    try {
        console.log('status_changed received:', status);
        // Attempt overlay update first
        if (typeof updateOverlay === 'function') {
            try { updateOverlay(status); } catch (ex) { console.error("Overlay Update Failed:", ex); }
        }

        // Always try to update dashboard status even if overlay failed
        if (typeof updateStatus === 'function') updateStatus(status);
    } catch (e) {
        console.error("Critical Error in status_changed:", e);
    }
});

socket.on('theme_config_updated', (config) => {
    if (typeof updateThemeConfig === 'function') updateThemeConfig(config);
});

socket.on('lists_changed', (lists) => {
    if (typeof updateLists === 'function') updateLists(lists);
});

// --- EMIT FUNCTIONS ---
function emitStatus(obj) { console.log('emitStatus:', obj); socket.emit('update_status', obj); }
function emitLists(lists) { socket.emit('update_lists', lists); }
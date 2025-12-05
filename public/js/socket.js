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
    if (typeof updateStatus === 'function') updateStatus(state.status);
    if (typeof updateLists === 'function') updateLists(state.lists);

    // Theme first, then overlay
    if (state.theme_config && typeof updateThemeConfig === 'function') {
        updateThemeConfig(state.theme_config);
    }

    if (typeof updateOverlay === 'function') updateOverlay(state.status);
});

socket.on('status_changed', (status) => {
    console.log('status_changed received:', status);
    updateOverlay(status);
    // updateStatus is for dashboard only, check existence
    if (typeof updateStatus === 'function') updateStatus(status);
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
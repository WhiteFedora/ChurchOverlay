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
    updateStatus(state.status);
    updateLists(state.lists);
    updateOverlay(state.status);
});

socket.on('status_changed', (status) => {
    console.log('status_changed received:', status);
    updateOverlay(status);
    updateStatus(status);
});
socket.on('lists_changed', (lists) => updateLists(lists));

// --- EMIT FUNCTIONS ---
function emitStatus(obj) { console.log('emitStatus:', obj); socket.emit('update_status', obj); }
function emitLists(lists) { socket.emit('update_lists', lists); }
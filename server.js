const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    maxHttpBufferSize: 1e7 // 10MB
});
const fs = require('fs');
const path = require('path');
const os = require('os');

// --- CONFIG ---
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'church_data.json');

// --- STATE MANAGEMENT ---
// Default state if no file exists
let appState = {
    status: {
        lt_active: false, lt_name: "", lt_role: "",
        slate_active: false, slate_type: "", slate_title: "", slate_sub: "", slate_src: "",
        timer_visible: false, timer_target: null,
        greenscreen_color: "#00FF00",
        active_slate_index: null,
        lt_transition_duration: 0.8, lt_transition_easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
        slate_transition_duration: 0.5, slate_transition_easing: 'ease',
        lt_font: 'Cinzel', lt_text_color: '#f1f5f9', lt_bg_color: '#0f172a', lt_bg_shape: 'gradient', lt_bg_image: null, lt_align: 'space-between', lt_offset: 0,
        timer_show_start_message: false, timer_clock_offset: 0, timer_text_offset: 0, lt_offset: 0
    },
    lists: {
        people: ["Rev. John Doe", "Jane Smith", "Bishop Michael"],
        tasks: ["Service Leader", "Prayers of the People", "Bible Reading", "Sermon"],
        slates: [
            { id: 'pre', type: 'text', title: 'Welcome', sub: 'Service will begin shortly' },
            { id: 'comm', type: 'text', title: 'Communion', sub: 'Draw near with faith' },
            { id: 'tech', type: 'text', title: 'Technical Difficulties', sub: 'We will be right back' },
            { id: 'end', type: 'text', title: 'Go in Peace', sub: 'Thanks for joining us' }
        ]
    }
};

// Load state from disk on startup
if (fs.existsSync(DATA_FILE)) {
    try {
        const raw = fs.readFileSync(DATA_FILE);
        appState = JSON.parse(raw);
        console.log("Loaded saved state from disk.");
    } catch (e) {
        console.error("Error loading state, using defaults.");
    }
}

// Ensure defaults for lists if empty
if (appState.lists.people.length === 0) appState.lists.people = ["Rev. John Doe", "Jane Smith", "Bishop Michael"];
if (appState.lists.tasks.length === 0) appState.lists.tasks = ["Service Leader", "Prayers of the People", "Bible Reading", "Sermon"];
if (appState.lists.slates.length === 0) appState.lists.slates = [
    { id: 'pre', type: 'text', title: 'Welcome', sub: 'Service will begin shortly' },
    { id: 'comm', type: 'text', title: 'Communion', sub: 'Draw near with faith' },
    { id: 'tech', type: 'text', title: 'Technical Difficulties', sub: 'We will be right back' },
    { id: 'end', type: 'text', title: 'Go in Peace', sub: 'Thanks for joining us' }
];

// Helper to save state
function saveState() {
    fs.writeFile(DATA_FILE, JSON.stringify(appState, null, 2), (err) => {
        if (err) console.error("Error saving state:", err);
    });
}

// Helper to get LAN IPs
function getLanIPs() {
    const interfaces = os.networkInterfaces();
    const ips = [];
    for (const iface of Object.values(interfaces)) {
        for (const addr of iface) {
            if (addr.family === 'IPv4' && !addr.internal) {
                ips.push(addr.address);
            }
        }
    }
    return ips;
}

// --- SERVER SETUP ---
app.use(express.static('public')); // Serve the HTML file

// --- SOCKET.IO LOGIC ---
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Send current state immediately upon connection
    socket.emit('init_state', appState);

    // Handle Status Updates (Lower Thirds, Slates, Timers)
    socket.on('update_status', (newStatus) => {
        console.log('Server received update_status:', newStatus);
        appState.status = { ...appState.status, ...newStatus };
        console.log('New status:', appState.status);
        io.emit('status_changed', appState.status); // Broadcast to all
        saveState();
    });

    // Handle List/Slate Updates (Adding people, moving slates)
    socket.on('update_lists', (newLists) => {
        appState.lists = newLists;
        io.emit('lists_changed', appState.lists); // Broadcast to all
        saveState();
    });
});

// --- START ---
http.listen(PORT, '0.0.0.0', () => {
    const lanIPs = getLanIPs();
    console.log(`\n=== CHURCH OVERLAY SYSTEM ===`);
    console.log(`Server running at: http://localhost:${PORT}`);
    if (lanIPs.length > 0) {
        console.log(`LAN access: ${lanIPs.map(ip => `http://${ip}:${PORT}`).join(', ')}`);
    }
    console.log(`=============================\n`);
});
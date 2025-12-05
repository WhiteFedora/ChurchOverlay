const socket = io();
var localLists = { people: [], tasks: [], slates: [] };
var localStatus = {};
var timerTarget = null;

// --- INIT MODE ---
// Clock tick
setInterval(() => {
    const now = new Date();
    document.getElementById('el-clock').innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}, 1000);

// Check Mode
if (window.location.search.includes('mode=overlay')) {
    document.body.classList.add('overlay-mode', 'greenscreen');
}
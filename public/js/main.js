const socket = io();
var localLists = { people: [], tasks: [], slates: [] };
var localStatus = {};
var timerTarget = null;

// --- INIT MODE ---
// Clock tick
setInterval(() => {
    const now = new Date();
    document.getElementById('el-clock').innerText = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});
    if(timerTarget) {
        const diff = timerTarget - now.getTime();
        if(diff > 0) {
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            const h = Math.floor(diff / 3600000);
            document.getElementById('el-countdown').innerText = (h>0?h+":":"") + m.toString().padStart(2,'0') + ":" + s.toString().padStart(2,'0');
        } else document.getElementById('el-countdown').innerText = "00:00";
    }
}, 1000);

// Check Mode
if(window.location.search.includes('mode=overlay')) {
    document.body.classList.add('overlay-mode', 'greenscreen');
}
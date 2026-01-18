// Registrazione Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('Service Worker registrato', reg))
        .catch(err => console.log('Errore Service Worker', err));
}

// Playlist musicali (sostituisci con i tuoi file audio)
const playlists = {
    rilassante: [
        { title: 'Spa Relax 1', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
        { title: 'Spa Relax 2', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
        { title: 'Spa Relax 3', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' }
    ],
    energizzante: [
        { title: 'Energy Flow 1', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
        { title: 'Energy Flow 2', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' }
    ],
    natura: [
        { title: 'Suoni Natura 1', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3' },
        { title: 'Suoni Natura 2', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3' }
    ]
};

let currentPlaylist = 'rilassante';
let currentTrackIndex = 0;
let isPlaying = false;
let cameraActive = false;

// Elementi DOM
const audioPlayer = document.getElementById('audioPlayer');
const playBtn = document.getElementById('playBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const volumeSlider = document.getElementById('volumeSlider');
const volumeValue = document.getElementById('volumeValue');
const trackTitle = document.getElementById('trackTitle');
const playlistBtns = document.querySelectorAll('.playlist-btn');
const toggleCamera = document.getElementById('toggleCamera');
const cameraStream = document.getElementById('cameraStream');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const helpBtn = document.getElementById('helpBtn');
const lightsBtn = document.getElementById('lightsBtn');
const clock = document.getElementById('clock');

// Orologio
function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    clock.textContent = `${hours}:${minutes}`;
}
updateClock();
setInterval(updateClock, 1000);

// Cambio Playlist
playlistBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        playlistBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentPlaylist = btn.dataset.playlist;
        currentTrackIndex = 0;
        loadTrack();
        if (isPlaying) {
            audioPlayer.play();
        }
    });
});

// Carica traccia
function loadTrack() {
    const track = playlists[currentPlaylist][currentTrackIndex];
    audioPlayer.src = track.url;
    trackTitle.textContent = track.title;
    
    // Media Session API per controlli hardware
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: track.title,
            artist: 'Centro Estetico',
            album: currentPlaylist.charAt(0).toUpperCase() + currentPlaylist.slice(1)
        });
    }
}

// Play/Pause
playBtn.addEventListener('click', () => {
    if (isPlaying) {
        audioPlayer.pause();
        playBtn.textContent = '▶️';
        isPlaying = false;
    } else {
        if (!audioPlayer.src) {
            loadTrack();
        }
        audioPlayer.play();
        playBtn.textContent = '⏸️';
        isPlaying = true;
    }
});

// Traccia precedente
prevBtn.addEventListener('click', () => {
    currentTrackIndex--;
    if (currentTrackIndex < 0) {
        currentTrackIndex = playlists[currentPlaylist].length - 1;
    }
    loadTrack();
    if (isPlaying) {
        audioPlayer.play();
    }
});

// Traccia successiva
nextBtn.addEventListener('click', () => {
    currentTrackIndex++;
    if (currentTrackIndex >= playlists[currentPlaylist].length) {
        currentTrackIndex = 0;
    }
    loadTrack();
    if (isPlaying) {
        audioPlayer.play();
    }
});

// Auto-next quando finisce la traccia
audioPlayer.addEventListener('ended', () => {
    nextBtn.click();
});

// Controllo Volume
volumeSlider.addEventListener('input', (e) => {
    const volume = e.target.value;
    audioPlayer.volume = volume / 100;
    volumeValue.textContent = `${volume}%`;
});

// Telecamera
toggleCamera.addEventListener('click', async () => {
    if (!cameraActive) {
        try {
            // Per telecamera IP/RTSP usa un URL stream invece di getUserMedia
            // Esempio: cameraStream.src = 'http://ip-telecamera/stream'
            
            // getUserMedia per telecamera locale del tablet
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: { ideal: 480 },
                    height: { ideal: 360 }
                } 
            });
            cameraStream.srcObject = stream;
            cameraStream.classList.add('active');
            toggleCamera.textContent = 'Disattiva Telecamera';
            toggleCamera.style.display = 'none';
            cameraActive = true;
        } catch (err) {
            alert('Errore accesso telecamera: ' + err.message);
        }
    } else {
        const stream = cameraStream.srcObject;
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        cameraStream.classList.remove('active');
        toggleCamera.textContent = 'Attiva Telecamera';
        toggleCamera.style.display = 'block';
        cameraActive = false;
    }
});

// Fullscreen
fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        fullscreenBtn.textContent = '⛶ Esci Schermo Intero';
    } else {
        document.exitFullscreen();
        fullscreenBtn.textContent = '⛶ Schermo Intero';
    }
});

// Pulsante Assistenza
helpBtn.addEventListener('click', () => {
    // Qui puoi integrare chiamata API, notifica push, ecc.
    alert('🔔 Assistenza chiamata! Un operatore arriverà a breve.');
    // Esempio: fetch('/api/call-assistance', { method: 'POST', body: JSON.stringify({ room: 'Cabina 1' }) });
});

// Pulsante Luci (esempio placeholder)
lightsBtn.addEventListener('click', () => {
    // Integra con sistema domotica (es. smart bulbs API)
    alert('💡 Comando luci inviato');
    // Esempio: fetch('/api/toggle-lights', { method: 'POST' });
});

// Carica prima traccia all'avvio
loadTrack();

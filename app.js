// Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(err => console.error('SW Error:', err));
}

// Playlists avanzate
const playlists = [
    {
        name: 'Relax Profondo',
        tracks: [
            { title: 'Onde dell\'Anima', artist: 'Spa Harmony', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
            { title: 'Respiro Zen', artist: 'Meditation Masters', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
            { title: 'Giardino Segreto', artist: 'Nature Sounds', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' }
        ]
    },
    {
        name: 'Energia Positiva',
        tracks: [
            { title: 'Risveglio Dolce', artist: 'Energy Flow', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
            { title: 'Vitalità', artist: 'Morning Vibes', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' }
        ]
    },
    {
        name: 'Onde Marine',
        tracks: [
            { title: 'Oceano Infinito', artist: 'Sea Dreams', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3' },
            { title: 'Maree', artist: 'Water Sounds', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3' }
        ]
    },
    {
        name: 'Foresta Zen',
        tracks: [
            { title: 'Foglie al Vento', artist: 'Forest Ambience', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3' },
            { title: 'Canto degli Uccelli', artist: 'Nature Collection', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' }
        ]
    }
];

let currentPlaylist = 0;
let currentTrack = 0;
let isPlaying = false;
let isShuffle = false;
let isRepeat = false;

// DOM Elements
const audioPlayer = document.getElementById('audioPlayer');
const playPauseBtn = document.getElementById('playPause');
const playIcon = document.getElementById('playIcon');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const volume = document.getElementById('volume');
const volumeFill = document.getElementById('volumeFill');
const volumeText = document.getElementById('volumeText');
const seekBar = document.getElementById('seekBar');
const progressFill = document.getElementById('progressFill');
const currentTime = document.getElementById('currentTime');
const duration = document.getElementById('duration');
const trackName = document.getElementById('trackName');
const trackArtist = document.getElementById('trackArtist');
const vinyl = document.querySelector('.vinyl');
const shuffleBtn = document.getElementById('shuffle');
const repeatBtn = document.getElementById('repeat');

// Navigation
document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
        document.getElementById(`panel-${btn.dataset.panel}`).classList.add('active');
    });
});

// Clock
function updateClock() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' });
    document.getElementById('time').textContent = timeStr;
    document.getElementById('date').textContent = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
}
updateClock();
setInterval(updateClock, 1000);

// Music Player
function loadTrack() {
    const track = playlists[currentPlaylist].tracks[currentTrack];
    audioPlayer.src = track.url;
    trackName.textContent = track.title;
    trackArtist.textContent = track.artist;
    
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: track.title,
            artist: track.artist,
            album: playlists[currentPlaylist].name,
            artwork: [{ src: 'icon-512.png', sizes: '512x512', type: 'image/png' }]
        });
        
        navigator.mediaSession.setActionHandler('play', () => playPause());
        navigator.mediaSession.setActionHandler('pause', () => playPause());
        navigator.mediaSession.setActionHandler('previoustrack', () => prevTrack());
        navigator.mediaSession.setActionHandler('nexttrack', () => nextTrack());
    }
}

function playPause() {
    if (isPlaying) {
        audioPlayer.pause();
        playIcon.innerHTML = '<path d="M8 5v14l11-7z"/>';
        vinyl.classList.remove('playing');
        isPlaying = false;
    } else {
        audioPlayer.play();
        playIcon.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
        vinyl.classList.add('playing');
        isPlaying = true;
        setupVisualizer();
    }
}

function prevTrack() {
    currentTrack--;
    if (currentTrack < 0) currentTrack = playlists[currentPlaylist].tracks.length - 1;
    loadTrack();
    if (isPlaying) audioPlayer.play();
}

function nextTrack() {
    if (isShuffle) {
        currentTrack = Math.floor(Math.random() * playlists[currentPlaylist].tracks.length);
    } else {
        currentTrack++;
        if (currentTrack >= playlists[currentPlaylist].tracks.length) currentTrack = 0;
    }
    loadTrack();
    if (isPlaying) audioPlayer.play();
}

playPauseBtn.addEventListener('click', playPause);
prevBtn.addEventListener('click', prevTrack);
nextBtn.addEventListener('click', nextTrack);

// Volume
volume.addEventListener('input', (e) => {
    const val = e.target.value;
    audioPlayer.volume = val / 100;
    volumeFill.style.width = `${val}%`;
    volumeText.textContent = `${val}%`;
});

// Progress
audioPlayer.addEventListener('timeupdate', () => {
    if (audioPlayer.duration) {
        const percent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
        progressFill.style.width = `${percent}%`;
        seekBar.value = percent;
        currentTime.textContent = formatTime(audioPlayer.currentTime);
        duration.textContent = formatTime(audioPlayer.duration);
    }
});

seekBar.addEventListener('input', (e) => {
    const time = (e.target.value / 100) * audioPlayer.duration;
    audioPlayer.currentTime = time;
});

audioPlayer.addEventListener('ended', () => {
    if (isRepeat) {
        audioPlayer.currentTime = 0;
        audioPlayer.play();
    } else {
        nextTrack();
    }
});

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Shuffle & Repeat
shuffleBtn.addEventListener('click', () => {
    isShuffle = !isShuffle;
    shuffleBtn.style.opacity = isShuffle ? '1' : '0.5';
});

repeatBtn.addEventListener('click', () => {
    isRepeat = !isRepeat;
    repeatBtn.style.opacity = isRepeat ? '1' : '0.5';
});

// Playlist Selection
document.querySelectorAll('.playlist-card').forEach((card, index) => {
    card.addEventListener('click', () => {
        document.querySelectorAll('.playlist-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        currentPlaylist = index;
        currentTrack = 0;
        loadTrack();
        if (isPlaying) audioPlayer.play();
    });
});

// Visualizer
function setupVisualizer() {
    const canvas = document.getElementById('visualizer');
    const ctx = canvas.getContext('2d');
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaElementSource(audioPlayer);
    
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    analyser.fftSize = 256;
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    function draw() {
        requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const barWidth = (canvas.width / bufferLength) * 2.5;
        let x = 0;
        
        for (let i = 0; i < bufferLength; i++) {
            const barHeight = (dataArray[i] / 255) * canvas.height * 0.8;
            const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
            gradient.addColorStop(0, '#ff6b9d');
            gradient.addColorStop(1, '#ffa06b');
            ctx.fillStyle = gradient;
            ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
            x += barWidth + 1;
        }
    }
    
    draw();
}

// Camera
const cameraFeed = document.getElementById('cameraFeed');
const activateCamera = document.getElementById('activateCamera');
let cameraStream = null;

activateCamera.addEventListener('click', async () => {
    if (!cameraStream) {
        try {
            // Per telecamera IP, usa: cameraFeed.src = 'http://your-camera-ip/stream'
            // Per HLS: usa hls.js come mostrato sotto
            
            // Esempio con getUserMedia (webcam locale)
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { width: 1920, height: 1080 } 
            });
            cameraFeed.srcObject = stream;
            cameraStream = stream;
            activateCamera.textContent = 'Disattiva Telecamera';
            
            // Esempio con HLS.js per stream RTSP convertito
            /*
            if (Hls.isSupported()) {
                const hls = new Hls();
                hls.loadSource('http://your-server/stream.m3u8');
                hls.attachMedia(cameraFeed);
            }
            */
        } catch (err) {
            alert('Errore telecamera: ' + err.message);
        }
    } else {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
        cameraFeed.srcObject = null;
        activateCamera.textContent = 'Attiva Telecamera';
    }
});

// Ambiente Controls
let temperature = 22;
document.getElementById('tempUp')?.addEventListener('click', () => {
    temperature++;
    document.querySelector('.temp-value').textContent = `${temperature}°`;
    document.getElementById('temperature').textContent = `${temperature}°C`;
});

document.getElementById('tempDown')?.addEventListener('click', () => {
    temperature--;
    document.querySelector('.temp-value').textContent = `${temperature}°`;
    document.getElementById('temperature').textContent = `${temperature}°C`;
});

// Climate modes
document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

// Light scenes
document.querySelectorAll('.scene-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.scene-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

// Brightness
document.getElementById('brightness')?.addEventListener('input', (e) => {
    document.getElementById('brightnessValue').textContent = `${e.target.value}%`;
});

// Aroma
document.querySelectorAll('.aroma-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        btn.classList.toggle('active');
    });
});

// Service Cards
document.querySelectorAll('.service-card').forEach(card => {
    card.addEventListener('click', () => {
        const service = card.querySelector('h3').textContent;
        alert(`Servizio "${service}" richiesto. Un operatore ti assisterà a breve.`);
    });
});

// Load first track
loadTrack();

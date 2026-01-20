(() => {
  // ---- Service Worker (relativo, ok per sottocartelle) ----
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }

  // ---- Helpers ----
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const nowTime = () => new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
  const nowDate = () => {
    const d = new Date().toLocaleDateString("it-IT", { weekday: "short", day: "2-digit", month: "short" });
    return d.charAt(0).toUpperCase() + d.slice(1);
  };
  const fmt = (sec) => {
    if (!sec || Number.isNaN(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const KEY = "suite_cfg_vnext";
  const LOGKEY = "suite_log_vnext";

  const defaultCfg = {
    cabinName: "Cabina 03",
    webhook: "",
    maxVolume: 80,
    camHls: "",
    camSource: "hls",
    volume: 60
  };

  const loadCfg = () => {
    try {
      return { ...defaultCfg, ...(JSON.parse(localStorage.getItem(KEY) || "{}")) };
    } catch {
      return { ...defaultCfg };
    }
  };

  const saveCfg = (cfg) => localStorage.setItem(KEY, JSON.stringify(cfg));

  const log = (title, body = "") => {
    const item = { t: Date.now(), title, body };
    const list = loadLog();
    list.unshift(item);
    localStorage.setItem(LOGKEY, JSON.stringify(list.slice(0, 50)));
    renderLog();
  };

  const loadLog = () => {
    try {
      return JSON.parse(localStorage.getItem(LOGKEY) || "[]");
    } catch {
      return [];
    }
  };

  // ---- State ----
  let cfg = loadCfg();

  // ---- Clock ----
  function tickClock() {
    const t = $("#clockTime");
    const d = $("#clockDate");
    if (t) t.textContent = nowTime();
    if (d) d.textContent = nowDate();
  }
  tickClock();
  setInterval(tickClock, 1000);

  // ---- Network pill ----
  function updateNetworkUI() {
    const online = navigator.onLine;
    const netText = $("#netText");
    const sideNet = $("#sideNet");
    const netIcon = $("#netIcon");

    if (netText) netText.textContent = online ? "Online" : "Offline";
    if (sideNet) sideNet.textContent = online ? "Online" : "Offline";
    if (netIcon) netIcon.innerHTML = online
      ? '<use href="#i-wifi"></use>'
      : '<use href="#i-wifi"></use>'; // tieni semplice (hai solo i-wifi nello sprite)
  }
  window.addEventListener("online", updateNetworkUI);
  window.addEventListener("offline", updateNetworkUI);
  updateNetworkUI();

  // ---- Navigation panels ----
  function showPanel(name) {
    $$(".navItem").forEach(b => b.classList.toggle("isActive", b.dataset.panel === name));
    $$(".panel").forEach(p => p.classList.toggle("isActive", p.id === `panel-${name}`));
  }

  $$(".navItem").forEach(btn => {
    btn.addEventListener("click", () => {
      showPanel(btn.dataset.panel);
      log("Navigazione", `Aperto: ${btn.dataset.panel}`);
    });
  });

  // ---- Settings modal ----
  const settingsModal = $("#settingsModal");

  function openSettings() {
    $("#cfgCabinName").value = cfg.cabinName || "";
    $("#cfgWebhook").value = cfg.webhook || "";
    $("#cfgMaxVolume").value = String(cfg.maxVolume ?? 80);
    $("#cfgMaxVolumeTxt").textContent = `${cfg.maxVolume ?? 80}%`;
    $("#cfgCamHls").value = cfg.camHls || "";
    $("#cfgCamSource").value = cfg.camSource || "hls";

    settingsModal.classList.add("isOpen");
    settingsModal.setAttribute("aria-hidden", "false");
  }

  function closeSettings() {
    settingsModal.classList.remove("isOpen");
    settingsModal.setAttribute("aria-hidden", "true");
  }

  $("#openSettings")?.addEventListener("click", openSettings);
  $("#settingsClose")?.addEventListener("click", closeSettings);
  settingsModal?.addEventListener("click", (e) => {
    if (e.target === settingsModal) closeSettings();
  });

  $("#cfgMaxVolume")?.addEventListener("input", (e) => {
    $("#cfgMaxVolumeTxt").textContent = `${e.target.value}%`;
  });

  $("#settingsReset")?.addEventListener("click", () => {
    cfg = { ...defaultCfg };
    saveCfg(cfg);
    applyCfgToUI();
    openSettings();
    log("Impostazioni", "Ripristinate");
  });

  $("#settingsSave")?.addEventListener("click", () => {
    cfg.cabinName = $("#cfgCabinName").value.trim() || "Cabina";
    cfg.webhook = $("#cfgWebhook").value.trim();
    cfg.maxVolume = Number($("#cfgMaxVolume").value || 80);
    cfg.camHls = $("#cfgCamHls").value.trim();
    cfg.camSource = $("#cfgCamSource").value;

    // clamp volume attuale
    cfg.volume = clamp(cfg.volume, 0, cfg.maxVolume);

    saveCfg(cfg);
    applyCfgToUI();
    closeSettings();
    log("Impostazioni", "Salvate");
  });

  // ---- Dashboard shortcuts click ----
  $("#shortcutGrid")?.addEventListener("click", (e) => {
    const tile = e.target.closest(".tile");
    if (!tile) return;
    const action = tile.dataset.action || "";
    handleAction(action);
  });

  $("#dashCam")?.addEventListener("click", () => handleAction("go:camera"));
  $("#dashAssist")?.addEventListener("click", () => handleAction("service:assist"));
  $("#dashMute")?.addEventListener("click", () => handleAction("music:mute"));
  $("#dashMusicToggle")?.addEventListener("click", () => handleAction("music:toggle"));

  function handleAction(action) {
    if (!action) return;
    const [type, arg] = action.split(":");

    if (type === "go") {
      showPanel(arg);
      log("Scorciatoia", `Vai a: ${arg}`);
      return;
    }

    if (type === "timer") {
      // placeholder: nel tuo HTML vNext avevi tab timer in altra variante,
      // qui aggiorniamo solo label (timer vero lo aggiungiamo dopo se vuoi).
      log("Timer", `Preset: ${arg} min`);
      return;
    }

    if (type === "preset") {
      log("Preset", `Applicato: ${arg}`);
      return;
    }

    if (type === "service") {
      log("Servizio", `Richiesta: ${arg}`);
      alert(`Richiesta inviata: ${arg}`);
      return;
    }

    if (type === "music") {
      if (arg === "toggle") playPause();
      if (arg === "mute") toggleMute();
      return;
    }
  }

  // ---- Activity log ----
  function renderLog() {
    const el = $("#logList");
    if (!el) return;
    const items = loadLog();
    if (!items.length) {
      el.innerHTML = `<div class="muted small" style="padding:10px">Nessuna attività recente.</div>`;
      return;
    }
    el.innerHTML = items.map(i => {
      const t = new Date(i.t).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
      return `
        <div class="logItem">
          <div class="logTop">
            <div class="logTitle">${escapeHtml(i.title)}</div>
            <div class="logTime">${t}</div>
          </div>
          ${i.body ? `<div class="logBody">${escapeHtml(i.body)}</div>` : ``}
        </div>
      `;
    }).join("");
  }

  $("#clearLog")?.addEventListener("click", () => {
    localStorage.setItem(LOGKEY, "[]");
    renderLog();
    log("Attività", "Log svuotato");
  });

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, m => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;"
    }[m]));
  }

  // ---- Player ----
  const audio = $("#audio");
  const playPauseIcon = $("#playPauseIcon");
  const dashMusicIcon = $("#dashMusicIcon");
  const musicLabel = $("#musicLabel");
  const nowTitle = $("#nowTitle");
  const nowArtist = $("#nowArtist");
  const dashNowTrack = $("#dashNowTrack");

  const seek = $("#seek");
  const progFill = $("#progFill");
  const curTime = $("#curTime");
  const durTime = $("#durTime");

  const volume = $("#volume");
  const volFill = $("#volFill");
  const volText = $("#volText");
  const dashVol = $("#dashVol");

  let isPlaying = false;
  let muted = false;

  // demo playlist
  const playlists = [
    { name: "Relax", tracks: [
      { t: "Relax 01", a: "Ambience", u: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
      { t: "Relax 02", a: "Ambience", u: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" }
    ]},
    { name: "Soft", tracks: [
      { t: "Soft 01", a: "Ambient", u: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" }
    ]},
    { name: "Natura", tracks: [
      { t: "Nature 01", a: "Field", u: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" }
    ]},
    { name: "Lounge", tracks: [
      { t: "Lounge 01", a: "Chill", u: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3" }
    ]}
  ];

  let pIndex = 0;
  let tIndex = 0;

  function setTrack(p, t) {
    pIndex = p;
    tIndex = t;
    const tr = playlists[pIndex].tracks[tIndex];
    audio.src = tr.u;
    if (nowTitle) nowTitle.textContent = tr.t;
    if (nowArtist) nowArtist.textContent = tr.a;
    if (dashNowTrack) dashNowTrack.textContent = tr.t;
    log("Musica", `Selezionato: ${tr.t}`);
    updateMusicLabel();
  }

  function updateMusicLabel() {
    if (musicLabel) musicLabel.textContent = `Musica: ${isPlaying ? "Play" : "Stop"}`;
    if (playPauseIcon) playPauseIcon.innerHTML = isPlaying ? '<use href="#i-pause"></use>' : '<use href="#i-play"></use>';
    if (dashMusicIcon) dashMusicIcon.innerHTML = isPlaying ? '<use href="#i-pause"></use>' : '<use href="#i-play"></use>';
  }

  function setVolumeUI(v) {
    const vv = clamp(v, 0, 100);
    if (volume) volume.value = String(vv);
    if (volFill) volFill.style.width = `${vv}%`;
    if (volText) volText.textContent = `${vv}%`;
    if (dashVol) dashVol.textContent = `${vv}%`;
  }

  function applyCfgToUI() {
    $("#cabinNameLabel").textContent = cfg.cabinName;
    $("#sideMaxVol").textContent = `${cfg.maxVolume}%`;
    $("#sideTemp").textContent = $("#dashTemp")?.textContent || "22°C";
    setVolumeUI(cfg.volume);
    audio.volume = clamp(cfg.volume, 0, cfg.maxVolume) / 100;
  }

  // Render list
  function renderTracks() {
    const list = $("#trackList");
    const sel = $("#playlistSelect");
    if (!list || !sel) return;

    pIndex = Number(sel.value || 0);
    const tracks = playlists[pIndex].tracks;

    list.innerHTML = tracks.map((tr, idx) => `
      <div class="trackRow" data-idx="${idx}">
        <div class="trackMeta">
          <div class="trackT">${escapeHtml(tr.t)}</div>
          <div class="trackA">${escapeHtml(tr.a)}</div>
        </div>
        <div class="badge ${idx === tIndex ? "isOn" : ""}">${idx === tIndex ? "Attivo" : "Apri"}</div>
      </div>
    `).join("");
  }

  $("#playlistSelect")?.addEventListener("change", () => {
    tIndex = 0;
    setTrack(Number($("#playlistSelect").value || 0), 0);
    renderTracks();
  });

  $("#trackList")?.addEventListener("click", (e) => {
    const row = e.target.closest(".trackRow");
    if (!row) return;
    const idx = Number(row.dataset.idx || 0);
    setTrack(pIndex, idx);
    renderTracks();
    playPause(true);
  });

  // Search
  $("#search")?.addEventListener("input", (e) => {
    const q = e.target.value.trim().toLowerCase();
    const list = $("#trackList");
    if (!list) return;
    $$(".trackRow").forEach(r => {
      const title = r.querySelector(".trackT")?.textContent?.toLowerCase() || "";
      const artist = r.querySelector(".trackA")?.textContent?.toLowerCase() || "";
      const ok = !q || title.includes(q) || artist.includes(q);
      r.style.display = ok ? "" : "none";
    });
  });

  // Safe play/pause (autoplay policy)
  async function playPause(forcePlay = null) {
    const wantPlay = forcePlay === null ? !isPlaying : forcePlay;

    if (wantPlay) {
      try {
        await audio.play();
        isPlaying = true;
        updateMusicLabel();
        log("Musica", "Play");
      } catch (e) {
        isPlaying = false;
        updateMusicLabel();
        alert("Per avviare la musica serve un tocco: premi Play di nuovo.");
      }
    } else {
      audio.pause();
      isPlaying = false;
      updateMusicLabel();
      log("Musica", "Stop");
    }
  }

  function toggleMute() {
    muted = !muted;
    audio.muted = muted;
    log("Musica", muted ? "Mute ON" : "Mute OFF");
  }

  $("#playPause")?.addEventListener("click", () => playPause(null));
  $("#prev")?.addEventListener("click", () => {
    const tracks = playlists[pIndex].tracks;
    tIndex = (tIndex - 1 + tracks.length) % tracks.length;
    setTrack(pIndex, tIndex);
    renderTracks();
    playPause(true);
  });
  $("#next")?.addEventListener("click", () => {
    const tracks = playlists[pIndex].tracks;
    tIndex = (tIndex + 1) % tracks.length;
    setTrack(pIndex, tIndex);
    renderTracks();
    playPause(true);
  });
  $("#mute")?.addEventListener("click", toggleMute);

  volume?.addEventListener("input", (e) => {
    const v = Number(e.target.value || 0);
    cfg.volume = clamp(v, 0, cfg.maxVolume);
    saveCfg(cfg);
    setVolumeUI(cfg.volume);
    audio.volume = cfg.volume / 100;
  });

  audio.addEventListener("loadedmetadata", () => {
    if (durTime) durTime.textContent = fmt(audio.duration);
  });

  audio.addEventListener("timeupdate", () => {
    if (!audio.duration) return;
    const pct = (audio.currentTime / audio.duration) * 100;
    if (progFill) progFill.style.width = `${pct}%`;
    if (seek) seek.value = String(pct);
    if (curTime) curTime.textContent = fmt(audio.currentTime);
  });

  seek?.addEventListener("input", (e) => {
    if (!audio.duration) return;
    const pct = Number(e.target.value || 0);
    audio.currentTime = (pct / 100) * audio.duration;
  });

  // “resume audio context” fallback: al primo tap, se serve
  document.addEventListener("pointerdown", () => {
    // serve solo per policy audio su alcuni dispositivi
    if (audio.paused && isPlaying) {
      audio.play().catch(() => {});
    }
  }, { once: true });

  // ---- Camera (solo webcam locale per ora; HLS richiede lib/infra) ----
  const camVideo = $("#cameraVideo");
  const camEmpty = $("#camEmpty");
  const camSource = $("#camSource");
  const camHlsUrl = $("#camHlsUrl");
  const camZoom = $("#camZoom");
  let camStream = null;

  function camSetUI(on) {
    if (!camVideo || !camEmpty) return;
    camVideo.classList.toggle("isOn", on);
    camEmpty.style.display = on ? "none" : "flex";
  }

  async function camStartLocal() {
    if (!camVideo) return;
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    camVideo.srcObject = stream;
    camStream = stream;
    camSetUI(true);
    log("Telecamera", "Avviata (webcam)");
  }

  function camStop() {
    if (camStream) camStream.getTracks().forEach(t => t.stop());
    camStream = null;
    if (camVideo) camVideo.srcObject = null;
    camSetUI(false);
    log("Telecamera", "Fermata");
  }

  $("#camStartStop")?.addEventListener("click", async () => {
    try {
      if (camStream) {
        camStop();
        return;
      }
      const src = camSource?.value || cfg.camSource;
      if (src === "local") await camStartLocal();
      else {
        alert("HLS: serve integrazione player (hls.js) + URL .m3u8 valido.");
        log("Telecamera", "HLS non configurato");
      }
    } catch (e) {
      alert("Errore telecamera: permessi o dispositivo non supportato.");
      log("Telecamera", "Errore avvio");
    }
  });

  camZoom?.addEventListener("input", (e) => {
    const z = Number(e.target.value || 100) / 100;
    if (camVideo) camVideo.style.transform = `scale(${z})`;
  });

  $("#camSave")?.addEventListener("click", () => {
    cfg.camSource = camSource?.value || "hls";
    cfg.camHls = camHlsUrl?.value?.trim() || "";
    saveCfg(cfg);
    log("Telecamera", "Configurazione salvata");
  });

  $("#camTest")?.addEventListener("click", () => {
    alert("Test: apri Avvia/Ferma per webcam, HLS richiede setup.");
  });

  // ---- Fullscreen ----
  $("#toggleFullscreen")?.addEventListener("click", async () => {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch {}
  });

  // ---- Assistenza (webhook se presente) ----
  async function callAssistance() {
    log("Assistenza", "Richiesta inviata");
    if (!cfg.webhook) {
      alert("Assistenza richiesta (locale).");
      return;
    }
    try {
      await fetch(cfg.webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cabin: cfg.cabinName, ts: Date.now(), type: "assistenza" })
      });
      alert("Assistenza richiesta.");
    } catch {
      alert("Webhook non raggiungibile. Richiesta registrata localmente.");
    }
  }

  $("#callStaff")?.addEventListener("click", callAssistance);
  $("#srvAssist")?.addEventListener("click", callAssistance);

  $("#srvWater")?.addEventListener("click", () => { log("Servizio", "Bevande"); alert("Richiesta bevande inviata."); });
  $("#srvExtend")?.addEventListener("click", () => { log("Servizio", "Estensione"); alert("Richiesta estensione inviata."); });
  $("#srvClean")?.addEventListener("click", () => { log("Servizio", "Pulizia"); alert("Richiesta pulizia inviata."); });
  $("#srvInfo")?.addEventListener("click", () => { log("Info", "Aperto pannello info"); alert("Qui inserirai le info cabina."); });
  $("#srvLock")?.addEventListener("click", () => { log("Kiosk", "Placeholder"); alert("Blocco kiosk: da gestire lato MDM/Android."); });

  // ---- Init UI ----
  $("#camSource") && ($("#camSource").value = cfg.camSource || "hls");
  $("#camHlsUrl") && ($("#camHlsUrl").value = cfg.camHls || "");
  $("#sideTemp") && ($("#sideTemp").textContent = "22°C");
  $("#dashTemp") && ($("#dashTemp").textContent = "22°C");

  setTrack(0, 0);
  renderTracks();
  renderLog();

  // tabs
  $$(".tab").forEach(t => t.addEventListener("click", () => {
    const name = t.dataset.tab;
    $$(".tab").forEach(x => x.classList.toggle("isActive", x === t));
    $$(".tabBody").forEach(b => b.classList.toggle("isActive", b.id === `tab-${name}`));
  }));

  applyCfgToUI();
})();

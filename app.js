const $ = (id) => document.getElementById(id);
const icons = () => window.lucide?.createIcons();
const status = (message, values) => translatedMessage($('status'), message, values);
const micStatus = (message) => translatedMessage($('micStatus'), message);
let songs = [], currentId = null, player, playerReady = false, lines = [], activeLine = -1, fontSize = 28;
let audioContext, stream, source, gain, analyser, meterFrame;
let recorder = null, recordStarting = false, recordDone = null, recordClock = null, takeNumber = 0;
const takes = new Map();
const recordingSupported = !!(window.MediaRecorder && navigator.mediaDevices?.getUserMedia);
const recordStatus = (key) => translatedMessage($('recordStatus'), key);
function recordingControls() {
  const busy = recordStarting || recorder !== null;
  $('recordStart').disabled = busy || !recordingSupported;
  $('recordStop').disabled = !recorder || recorder.state === 'inactive';
  $('connectMic').disabled = busy;
  $('micDevice').disabled = busy || !stream;
  $('disconnectMic').disabled = busy || !stream;
}
function addTake(blob, title) {
  const url = URL.createObjectURL(blob);
  takes.set(url, blob.size);
  const li = document.createElement('li');
  const heading = document.createElement('h3');
  if (title) heading.textContent = title;
  else translatedMessage(heading, 'Recording {number}', {number: ++takeNumber});
  const audio = document.createElement('audio'); audio.controls = true; audio.src = url; audio.preload = 'metadata';
  const actions = document.createElement('div'); actions.className = 'take-actions';
  const download = document.createElement('a'); download.href = url;
  const extension = blob.type.includes('mp4') ? 'm4a' : blob.type.includes('ogg') ? 'ogg' : 'webm';
  download.download = `home-karaoke-${new Date().toISOString().replace(/[:.]/g, '-')}.${extension}`;
  download.innerHTML = '<i data-lucide="download"></i><span></span>';
  translatedMessage(download.querySelector('span'), 'Download audio');
  const remove = document.createElement('button');
  remove.title = t('Delete recording');
  remove.innerHTML = '<i data-lucide="trash-2"></i><span></span>';
  translatedMessage(remove.querySelector('span'), 'Delete recording');
  remove.onclick = () => { audio.pause(); audio.removeAttribute('src'); audio.load(); URL.revokeObjectURL(url); takes.delete(url); li.remove(); };
  actions.append(download, remove); li.append(heading, audio, actions); $('recordings').prepend(li); icons();
}
function stopRecording() {
  if (!recorder) return Promise.resolve();
  if (recorder.state !== 'inactive') {
    recordStatus('Finishing recording...'); recorder.stop(); recordingControls();
  }
  return recordDone;
}
async function startRecording() {
  if (recordStarting || recorder || !recordingSupported) return;
  const usedBytes = [...takes.values()].reduce((sum, size) => sum + size, 0);
  if (usedBytes >= 100 * 1024 * 1024) return recordStatus('Recording storage is full. Download and delete older takes first.');
  recordStarting = true; recordingControls();
  $('recordings').querySelectorAll('audio').forEach(audio => audio.pause());
  try {
    if (!stream?.getAudioTracks().some(track => track.readyState === 'live')) {
      recordStatus('Requesting microphone access...'); await connectMic();
    }
    if (!stream?.getAudioTracks().some(track => track.readyState === 'live')) throw new Error('No microphone');
    // Speech processing can suppress the music when recording sound in the room.
    try { await stream.getAudioTracks()[0].applyConstraints({echoCancellation: false, noiseSuppression: false, autoGainControl: false}); } catch {}
    const mimeType = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus'].find(type => MediaRecorder.isTypeSupported(type));
    const capture = new MediaRecorder(stream, mimeType ? {mimeType} : undefined);
    recorder = capture;
    let finish; recordDone = new Promise(resolve => { finish = resolve; });
    const chunks = []; let bytes = 0, limited = false, failed = false;
    const title = songs.find(song => song.id === currentId)?.title || '';
    const startedAt = performance.now();
    $('recordTimer').textContent = '00:00';
    capture.ondataavailable = event => {
      if (event.data.size) { chunks.push(event.data); bytes += event.data.size; }
      if (bytes + usedBytes >= 100 * 1024 * 1024 && capture.state !== 'inactive') { limited = true; stopRecording(); }
    };
    capture.onerror = () => { failed = true; stopRecording(); };
    capture.onstop = () => {
      clearInterval(recordClock); recordClock = null;
      try {
        const blob = new Blob(chunks, {type: capture.mimeType || chunks[0]?.type || 'audio/webm'});
        if (blob.size) addTake(blob, title);
        recordStatus(!blob.size ? 'No audio was captured. Check your microphone and try again.' : failed ? 'Recording interrupted. Any captured audio is available below.' : limited ? 'Recording stopped at the time or memory limit. Download your take.' : 'Recording ready. Download it before leaving this page.');
      } finally { recorder = null; recordStarting = false; recordingControls(); finish(); }
    };
    capture.start(1000);
    recordClock = setInterval(() => {
      const seconds = Math.floor((performance.now() - startedAt) / 1000);
      $('recordTimer').textContent = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
      if (seconds >= 1800 && capture.state !== 'inactive') { limited = true; stopRecording(); }
    }, 250);
    recordStatus('Recording microphone audio...');
  } catch {
    recorder = null; clearInterval(recordClock);
    recordStatus('Could not start recording. Check microphone permissions and try again.');
  } finally { recordStarting = false; recordingControls(); }
}
$('recordStart').onclick = startRecording;
$('recordStop').onclick = stopRecording;
window.addEventListener('beforeunload', event => {
  if (recorder || takes.size) { event.preventDefault(); event.returnValue = ''; }
});
try {
  const saved = JSON.parse(localStorage.getItem('home-karaoke-songs') || '[]');
  if (Array.isArray(saved)) songs = saved.filter(s => s && /^[\w-]{11}$/.test(s.videoId) && typeof s.title === 'string' && typeof s.id === 'string').map(s => ({...s, lyrics: typeof s.lyrics === 'string' ? s.lyrics : '', offset: Number(s.offset) || 0}));
} catch { status('Saved queue could not be loaded.'); }
function save() {
  try { localStorage.setItem('home-karaoke-songs', JSON.stringify(songs)); }
  catch { status('Browser storage is full or unavailable. This queue will last for this session only.'); }
}
function videoId(value) {
  if (/^[\w-]{11}$/.test(value)) return value;
  try {
    const u = new URL(value);
    if (!['https:', 'http:'].includes(u.protocol)) return null;
    const host = u.hostname.replace(/^www\./, '');
    let id;
    if (host === 'youtu.be') id = u.pathname.split('/')[1];
    else if (['youtube.com', 'm.youtube.com', 'music.youtube.com'].includes(host)) id = u.searchParams.get('v') || (/^\/(shorts|embed|live)\//.test(u.pathname) ? u.pathname.split('/')[2] : null);
    return /^[\w-]{11}$/.test(id || '') ? id : null;
  } catch { return null; }
}
const videoTitles = new Map();
const pendingTitles = new Map();
let autoTitle = '', autoTitleId = null, titleEditRevision = 0, linkRevision = 0, titleTimer, addingSong = false;
const titleStatus = (message) => translatedMessage($('titleStatus'), message);
function fetchVideoTitle(id) {
  if (videoTitles.has(id)) return Promise.resolve(videoTitles.get(id));
  if (pendingTitles.has(id)) return pendingTitles.get(id);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  const query = new URLSearchParams({url: `https://www.youtube.com/watch?v=${id}`, format: 'json'});
  const request = (async () => {
    try {
      const response = await fetch(`https://www.youtube.com/oembed?${query}`, {signal: controller.signal, credentials: 'omit'});
      if (!response.ok) return null;
      const data = await response.json();
      if (typeof data.title !== 'string' || !data.title.trim()) return null;
      const title = data.title.trim().slice(0, $('songTitle').maxLength);
      videoTitles.set(id, title);
      return title;
    } catch { return null; }
    finally { clearTimeout(timeout); pendingTitles.delete(id); }
  })();
  pendingTitles.set(id, request);
  return request;
}
async function fillVideoTitle(id) {
  const editRevision = titleEditRevision, urlRevision = linkRevision;
  titleStatus('Loading video title...');
  const title = await fetchVideoTitle(id);
  // Late responses must not replace a newer link or a title edited by the user.
  if (urlRevision !== linkRevision || editRevision !== titleEditRevision || videoId($('videoUrl').value.trim()) !== id) return;
  if ($('songTitle').value.trim() && $('songTitle').value !== autoTitle) return;
  if (title) {
    $('songTitle').value = title; autoTitle = title; autoTitleId = id;
    updateSearch(title); titleStatus('Video title filled automatically.');
  } else titleStatus('Could not load the video title. You can enter a title yourself.');
}
$('videoUrl').addEventListener('input', () => {
  clearTimeout(titleTimer); linkRevision++;
  const id = videoId($('videoUrl').value.trim());
  if (autoTitleId !== id && $('songTitle').value === autoTitle) {
    $('songTitle').value = ''; autoTitle = ''; autoTitleId = null; updateSearch('');
  }
  titleStatus('');
  if (id && (!$('songTitle').value.trim() || $('songTitle').value === autoTitle)) {
    titleStatus('Loading video title...');
    titleTimer = setTimeout(() => fillVideoTitle(id), 350);
  }
});
function renderQueue() {
  $('queue').replaceChildren();
  $('queueCount').textContent = t(songs.length === 1 ? '{count} song' : '{count} songs', {count: songs.length});
  if (!songs.length) { const li = document.createElement('li'); li.className = 'empty'; li.textContent = t('No songs queued'); $('queue').append(li); }
  songs.forEach((song, index) => {
    const li = document.createElement('li');
    li.classList.toggle('current', song.id === currentId);
    const play = document.createElement('button'); play.className = 'song'; play.textContent = `${index + 1}. ${song.title}`; play.onclick = () => selectSong(song.id);
    const remove = document.createElement('button'); remove.className = 'remove'; remove.title = t('Remove {title}', {title: song.title}); remove.setAttribute('aria-label', remove.title); remove.innerHTML = '<i data-lucide="x"></i>';
    remove.onclick = () => {
      songs = songs.filter(s => s.id !== song.id);
      if (currentId === song.id) {
        playerReady && player.stopVideo(); currentId = null; $('nowPlaying').textContent = t('Your stage is ready'); $('emptyStage').hidden = false; $('emptyStage').style.display = ''; $('lyricsInput').value = ''; renderLyrics('');
      }
      save(); renderQueue();
    };
    li.append(play, remove); $('queue').append(li);
  });
  $('nextSong').disabled = !currentId || songs.findIndex(s => s.id === currentId) >= songs.length - 1;
  icons();
}
function selectSong(id) {
  const song = songs.find(s => s.id === id); if (!song) return;
  currentId = id; $('nowPlaying').textContent = song.title;
  $('openYoutube').href = `https://www.youtube.com/watch?v=${song.videoId}`;
  $('lyricsInput').value = song.lyrics; $('offset').value = song.offset; renderLyrics(song.lyrics);
  $('emptyStage').style.display = 'none';
  if (playerReady) { player.loadVideoById(song.videoId); status('Ready. Press play in the video if playback does not start.'); }
  else status('Connecting to YouTube...');
  renderQueue(); updateSearch(song.title);
}
function next() { const index = songs.findIndex(s => s.id === currentId); if (index >= 0 && songs[index + 1]) selectSong(songs[index + 1].id); else status('End of the queue.'); }
$('nextSong').onclick = next;
$('songForm').onsubmit = async (event) => {
  event.preventDefault(); const id = videoId($('videoUrl').value.trim());
  if (!id) return status('Enter a valid YouTube video link.');
  if (addingSong) return;
  addingSong = true; clearTimeout(titleTimer);
  const submit = $('songForm').querySelector('button[type="submit"]');
  const urlRevision = linkRevision; submit.disabled = true;
  try {
    if (!$('songTitle').value.trim()) await fillVideoTitle(id);
    if (urlRevision !== linkRevision || videoId($('videoUrl').value.trim()) !== id) return;
    const song = {id: crypto.randomUUID(), videoId: id, title: $('songTitle').value.trim() || `YouTube ${id}`, lyrics: '', offset: 0};
    songs.push(song); save(); renderQueue(); if (!currentId) selectSong(song.id);
    $('videoUrl').value = ''; $('songTitle').value = '';
    autoTitle = ''; autoTitleId = null; linkRevision++; titleEditRevision++; titleStatus('');
  } finally { addingSong = false; submit.disabled = false; }
};
function updateSearch(title) {
  const koreanSong = $('songLanguage').value === 'ko';
  $('youtubeSearch').href = `https://www.youtube.com/results?search_query=${encodeURIComponent((title || '') + (koreanSong ? ' 노래방 반주 가사' : ' English karaoke lyrics'))}`;
  $('lyricsSearch').href = `https://www.google.com/search?q=${encodeURIComponent((title || (koreanSong ? '노래' : 'song')) + (koreanSong ? ' 가사' : ' lyrics'))}`;
}
$('songTitle').oninput = () => {
  titleEditRevision++; autoTitle = ''; autoTitleId = null; titleStatus('');
  clearTimeout(titleTimer); updateSearch($('songTitle').value);
};
$('songLanguage').onchange = () => {
  try { localStorage.setItem('home-karaoke-song-language', $('songLanguage').value); } catch {}
  updateSearch($('songTitle').value.trim() || songs.find(s => s.id === currentId)?.title || '');
};
window.onYouTubeIframeAPIReady = () => {
  player = new YT.Player('player', {
    width: '100%', height: '100%', playerVars: {playsinline: 1, origin: location.origin},
    events: {
      onReady() { playerReady = true; const song = songs.find(s => s.id === currentId); if (song) { player.cueVideoById(song.videoId); status('Press play in the video to begin.'); } },
      onStateChange(event) { if (event.data === YT.PlayerState.ENDED) next(); },
      onError(event) { status('YouTube could not play this video ({code}). Try another karaoke video or open it on YouTube.', {code: event.data}); }
    }
  });
};
const apiScript = document.createElement('script'); apiScript.src = 'https://www.youtube.com/iframe_api'; apiScript.onerror = () => status('YouTube could not connect. Check your internet connection.'); document.head.append(apiScript);
setTimeout(() => { if (!playerReady) status('YouTube is unavailable or still loading. Check your connection or browser blocking settings.'); }, 15000);
function renderLyrics(text) {
  lines = []; activeLine = -1; $('lyricsDisplay').replaceChildren();
  for (const raw of text.split(/\r?\n/)) {
    const stamps = [...raw.matchAll(/\[(\d+):(\d{2})(?:\.(\d{1,3}))?\]/g)];
    const lyric = raw.replace(/\[\d+:\d{2}(?:\.\d{1,3})?\]/g, '').trim();
    if (/^\[[a-z]+:/i.test(lyric) || !lyric) continue;
    if (stamps.length) for (const m of stamps) lines.push({time: Number(m[1]) * 60 + Number(m[2]) + Number(`0.${m[3] || 0}`), text: lyric});
    else lines.push({time: null, text: lyric});
  }
  if (lines.some(l => l.time !== null)) lines.sort((a, b) => (a.time ?? -1) - (b.time ?? -1));
  for (const line of lines) { const p = document.createElement('p'); p.textContent = line.text; line.element = p; $('lyricsDisplay').append(p); }
  if (!lines.length) { const p = document.createElement('p'); p.className = 'muted'; p.textContent = t('No separate lyrics loaded'); $('lyricsDisplay').append(p); }
  $('lyricsDisplay').scrollTop = 0;
}
function applyLyrics() {
  if ($('lyricsInput').value.length > 200000) return status('Lyrics are too large. Maximum size is 200 KB.');
  renderLyrics($('lyricsInput').value);
  const song = songs.find(s => s.id === currentId);
  if (song) { song.lyrics = $('lyricsInput').value; song.offset = Number($('offset').value) || 0; save(); }
  status(lines.some(l => l.time !== null) ? 'Timed lyrics loaded. Timing follows the YouTube player.' : 'Lyrics loaded. Scroll the lyrics panel as you sing.');
}
$('applyLyrics').onclick = applyLyrics;
$('clearLyrics').onclick = () => { $('lyricsInput').value = ''; applyLyrics(); };
$('offset').onchange = applyLyrics;
$('lyricsFile').onchange = async (e) => {
  const file = e.target.files[0]; if (!file) return;
  if (file.size > 200000) return status('Lyrics file is too large. Maximum size is 200 KB.');
  try { $('lyricsInput').value = await file.text(); applyLyrics(); } catch { status('Lyrics file could not be read.'); }
  e.target.value = '';
};
setInterval(() => {
  if (!playerReady || !currentId || !lines.some(l => l.time !== null)) return;
  const time = player.getCurrentTime() + (Number($('offset').value) || 0);
  let index = -1; lines.forEach((line, i) => { if (line.time !== null && line.time <= time) index = i; });
  if (index === activeLine) return; activeLine = index;
  lines.forEach((line, i) => line.element.classList.toggle('active', i === index));
  if (index >= 0) { const panel = $('lyricsDisplay'); panel.scrollTo({top: lines[index].element.offsetTop - panel.offsetTop - panel.clientHeight / 2, behavior: 'smooth'}); }
}, 200);
$('fontDown').onclick = () => { fontSize = Math.max(18, fontSize - 2); $('lyricsDisplay').style.setProperty('--lyric-size', `${fontSize}px`); };
$('fontUp').onclick = () => { fontSize = Math.min(54, fontSize + 2); $('lyricsDisplay').style.setProperty('--lyric-size', `${fontSize}px`); };
$('fullscreen').onclick = async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); } catch { status('Full screen is unavailable in this browser.'); } };
async function stopMic() {
  await stopRecording();
  cancelAnimationFrame(meterFrame); stream?.getTracks().forEach(t => t.stop()); stream = null;
  if (audioContext && audioContext.state !== 'closed') await audioContext.close();
  audioContext = null; $('micMeter').value = 0; $('monitor').checked = false; $('monitor').disabled = true; $('disconnectMic').disabled = true; $('micDevice').disabled = true;
}
async function connectMic(deviceId = '') {
  $('connectMic').disabled = true; await stopMic();
  try {
    stream = await navigator.mediaDevices.getUserMedia({audio: {deviceId: deviceId ? {exact: deviceId} : undefined, echoCancellation: true, noiseSuppression: true}, video: false});
    audioContext = new AudioContext(); await audioContext.resume(); source = audioContext.createMediaStreamSource(stream); analyser = audioContext.createAnalyser(); analyser.fftSize = 256;
    gain = audioContext.createGain(); gain.gain.value = 0; source.connect(analyser); source.connect(gain); gain.connect(audioContext.destination);
    const devices = (await navigator.mediaDevices.enumerateDevices()).filter(d => d.kind === 'audioinput');
    $('micDevice').replaceChildren(...devices.map((d, i) => new Option(d.label || `${t('Microphone')} ${i + 1}`, d.deviceId)));
    $('micDevice').value = stream.getAudioTracks()[0].getSettings().deviceId || ''; $('micDevice').disabled = false; $('monitor').disabled = false; $('disconnectMic').disabled = false;
    micStatus('Connected. Voice monitoring is off.');
    const buffer = new Uint8Array(analyser.fftSize);
    function meter() { analyser.getByteTimeDomainData(buffer); $('micMeter').value = Math.min(1, Math.sqrt(buffer.reduce((s, n) => s + ((n - 128) / 128) ** 2, 0) / buffer.length) * 4); meterFrame = requestAnimationFrame(meter); } meter();
    stream.getAudioTracks()[0].onended = () => { stopMic(); micStatus('Microphone disconnected.'); };
  } catch (error) { await stopMic(); micStatus(error.name === 'NotAllowedError' ? 'Microphone permission was denied. Allow it in browser settings.' : 'Microphone unavailable. Pair it in Windows Sound > Input, then try again.'); }
  finally { recordingControls(); }
}
$('connectMic').onclick = () => connectMic();
$('micDevice').onchange = () => connectMic($('micDevice').value);
$('disconnectMic').onclick = async () => { await stopMic(); micStatus('Not connected'); };
function updateGain() { if (audioContext && gain) gain.gain.setTargetAtTime($('monitor').checked ? Number($('micGain').value) : 0, audioContext.currentTime, 0.03); }
$('monitor').onchange = () => { updateGain(); micStatus($('monitor').checked ? 'Voice monitoring on. Lower the volume if you hear feedback. Bluetooth may add delay.' : 'Connected. Voice monitoring is off.'); };
$('micGain').oninput = updateGain;
try { $('songLanguage').value = localStorage.getItem('home-karaoke-song-language') === 'ko' ? 'ko' : 'en'; } catch {}
if (!$('status').dataset.message) status('Ready');
micStatus('Not connected');
recordStatus(recordingSupported ? 'Ready to record audio.' : 'Audio recording is unavailable in this browser. Open the HTTPS site in a supported browser.');
recordingControls();
setLanguage(uiLanguage); updateSearch(''); icons();

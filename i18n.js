const korean = {
  'Home Karaoke': '우리집 노래방',
  'YOUR LIVING ROOM, LIVE': '우리 집에서 즐기는 라이브',
  'Song title': '노래 제목', 'Song / Artist': '노래 제목 / 가수',
  'YouTube link': '유튜브 링크', 'Add song': '노래 추가',
  'Song language': '노래 언어', 'Find karaoke on YouTube': '유튜브 노래방 검색',
  'Find lyrics online': '온라인 가사 검색', "Tonight's first song": '오늘의 첫 곡',
  'No song selected': '선택한 노래가 없습니다', 'NOW SINGING': '현재 부르는 노래',
  'Your stage is ready': '노래할 준비가 되었습니다', 'Ready': '준비 완료',
  'Lyrics': '가사', 'Timing offset (s)': '가사 시간 조절 (초)',
  'No separate lyrics loaded': '등록된 가사가 없습니다',
  'Edit lyrics / Import LRC': '가사 편집 / LRC 가져오기',
  'Lyrics text': '가사 내용', 'Paste lyrics or timed LRC text': '가사 또는 시간 정보가 있는 LRC 내용을 붙여넣으세요',
  'Import .lrc / .txt': '.lrc / .txt 가져오기', 'Apply lyrics': '가사 적용', 'Clear': '지우기',
  "Tonight's queue": '예약곡', 'No songs queued': '예약한 노래가 없습니다',
  'Microphone': '마이크', 'Connect / test microphone': '마이크 연결 / 테스트',
  'Input device': '입력 장치', 'System default': '시스템 기본 장치', 'Microphone level': '마이크 입력 크기',
  'Not connected': '연결되지 않음', 'Hear microphone through computer': '컴퓨터로 마이크 소리 듣기',
  'Voice volume': '목소리 크기', 'Disconnect microphone': '마이크 연결 해제',
  'Made for a night in': '집에서 즐기는 노래 시간', 'Full screen': '전체 화면',
  'Open on YouTube': '유튜브에서 열기', 'Next song': '다음 곡',
  'Smaller lyrics': '가사 글자 축소', 'Larger lyrics': '가사 글자 확대', 'Language': '화면 언어',
  'Remove {title}': '{title} 삭제', '{count} song': '{count}곡', '{count} songs': '{count}곡',
  'Saved queue could not be loaded.': '저장한 예약곡을 불러오지 못했습니다.',
  'Browser storage is full or unavailable. This queue will last for this session only.': '브라우저에 저장할 수 없습니다. 예약곡은 현재 실행 중에만 유지됩니다.',
  'Ready. Press play in the video if playback does not start.': '준비 완료. 자동 재생되지 않으면 영상의 재생 버튼을 누르세요.',
  'Connecting to YouTube...': '유튜브 연결 중...', 'End of the queue.': '마지막 예약곡입니다.',
  'Enter a valid YouTube video link.': '올바른 유튜브 영상 링크를 입력하세요.',
  'Press play in the video to begin.': '영상의 재생 버튼을 눌러 시작하세요.',
  'YouTube could not play this video ({code}). Try another karaoke video or open it on YouTube.': '영상을 재생할 수 없습니다 ({code}). 다른 영상을 선택하거나 유튜브에서 열어주세요.',
  'YouTube could not connect. Check your internet connection.': '유튜브에 연결할 수 없습니다. 인터넷 연결을 확인하세요.',
  'YouTube is unavailable or still loading. Check your connection or browser blocking settings.': '유튜브를 불러오는 중이거나 연결할 수 없습니다. 인터넷과 브라우저 차단 설정을 확인하세요.',
  'Lyrics are too large. Maximum size is 200 KB.': '가사가 너무 큽니다. 최대 크기는 200 KB입니다.',
  'Lyrics file is too large. Maximum size is 200 KB.': '가사 파일이 너무 큽니다. 최대 크기는 200 KB입니다.',
  'Timed lyrics loaded. Timing follows the YouTube player.': '시간 정보가 있는 가사를 불러왔습니다. 유튜브 재생 시간에 맞춰 표시합니다.',
  'Lyrics loaded. Scroll the lyrics panel as you sing.': '가사를 불러왔습니다. 노래에 맞춰 가사를 스크롤하세요.',
  'Lyrics file could not be read.': '가사 파일을 읽지 못했습니다.',
  'Full screen is unavailable in this browser.': '이 브라우저에서는 전체 화면을 사용할 수 없습니다.',
  'Connected. Voice monitoring is off.': '연결됨. 컴퓨터로 목소리 듣기는 꺼져 있습니다.',
  'Microphone disconnected.': '마이크 연결이 해제되었습니다.',
  'Microphone permission was denied. Allow it in browser settings.': '마이크 권한이 거부되었습니다. 브라우저 설정에서 허용하세요.',
  'Microphone unavailable. Pair it in Windows Sound > Input, then try again.': '마이크를 사용할 수 없습니다. Windows 소리 > 입력에서 연결을 확인하세요.',
  'Voice monitoring on. Lower the volume if you hear feedback. Bluetooth may add delay.': '컴퓨터로 목소리 듣기가 켜졌습니다. 울림이 나면 음량을 낮추세요. 블루투스는 지연이 있을 수 있습니다.'
};
let uiLanguage = 'en';
try { uiLanguage = localStorage.getItem('home-karaoke-language') === 'ko' ? 'ko' : 'en'; } catch {}
function t(key, values = {}) {
  const text = uiLanguage === 'ko' ? korean[key] || key : key;
  return text.replace(/\{(\w+)\}/g, (match, name) => values[name] ?? match);
}
function translatedMessage(element, key, values = {}) {
  element.dataset.message = key;
  element.dataset.messageValues = JSON.stringify(values);
  element.textContent = t(key, values);
}
const staticLabels = [...document.querySelectorAll('[data-i18n]')].map(element => ({element, key: element.textContent}));
const translatedAttributes = [...document.querySelectorAll('[title], [aria-label], [placeholder]')].flatMap(element =>
  ['title', 'aria-label', 'placeholder'].filter(name => element.hasAttribute(name)).map(name => ({element, name, key: element.getAttribute(name)}))
);
function setLanguage(language) {
  uiLanguage = language === 'ko' ? 'ko' : 'en';
  try { localStorage.setItem('home-karaoke-language', uiLanguage); } catch {}
  document.documentElement.lang = uiLanguage;
  document.title = t('Home Karaoke');
  staticLabels.forEach(({element, key}) => { element.textContent = t(key); });
  translatedAttributes.forEach(({element, name, key}) => element.setAttribute(name, t(key)));
  document.querySelectorAll('[data-message]').forEach(element => { element.textContent = t(element.dataset.message, JSON.parse(element.dataset.messageValues || '{}')); });
  document.getElementById('langEn').setAttribute('aria-pressed', String(uiLanguage === 'en'));
  document.getElementById('langKo').setAttribute('aria-pressed', String(uiLanguage === 'ko'));
  renderQueue();
  if (!currentId) document.getElementById('nowPlaying').textContent = t('Your stage is ready');
  const emptyLyrics = document.querySelector('#lyricsDisplay .muted');
  if (emptyLyrics) emptyLyrics.textContent = t('No separate lyrics loaded');
}
document.getElementById('langEn').onclick = () => setLanguage('en');
document.getElementById('langKo').onclick = () => setLanguage('ko');

/* ---------- Config: edit these ---------- */
const CONFIG = {
  userId: '1230494643272024075',
  profileUrl: 'https://discord.com/users/1230494643272024075',
  inviteCode: 'Nv6t4X7APg',
  inviteUrl: 'https://discord.gg/Nv6t4X7APg',
  customAvatar: 'avatar.jpg', // set to '' to use your real Discord avatar
  pollMs: 15000,
  copyText: 'Aoi — 15 — Male — Python scripter and ethical hacker',
};

const CDN = 'https://cdn.discordapp.com';
const ACTIVITY_VERBS = { 0: 'Playing', 1: 'Streaming', 2: 'Listening to', 3: 'Watching', 5: 'Competing in' };

const root = document.documentElement;
const $ = (q) => document.querySelector(q);
const $$ = (q) => document.querySelectorAll(q);
const setText = (q, text) => { $(q).textContent = text; };
const getJson = async (url) => {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
};

/* ---------- Cursor ---------- */
let mouseX = innerWidth / 2, mouseY = innerHeight / 2, ringX = mouseX, ringY = mouseY;
const dot = $('.cursor-dot'), ring = $('.cursor-ring');

addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  dot.style.left = `${mouseX}px`;
  dot.style.top = `${mouseY}px`;
}, { passive: true });

(function followCursor() {
  ringX += (mouseX - ringX) * 0.14;
  ringY += (mouseY - ringY) * 0.14;
  ring.style.left = `${ringX}px`;
  ring.style.top = `${ringY}px`;
  requestAnimationFrame(followCursor);
})();

$$('a, button, .project, .discord').forEach((el) => {
  el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
  el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
});

/* ---------- Shell panel + clock ---------- */
const panel = $('#shellPanel');
$('.shell-trigger').addEventListener('click', () => panel.classList.toggle('open'));
document.addEventListener('click', (e) => {
  if (!e.target.closest('.shell')) panel.classList.remove('open');
});

function updateClock() {
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  setText('#clock', time);
  setText('#footerTime', time);
}
updateClock();
setInterval(updateClock, 1000);

/* ---------- Magnetic buttons, card tilt, scroll parallax ---------- */
$$('.magnetic').forEach((el) => {
  el.addEventListener('mousemove', (e) => {
    const r = el.getBoundingClientRect();
    const dx = (e.clientX - r.left - r.width / 2) * 0.12;
    const dy = (e.clientY - r.top - r.height / 2) * 0.12;
    el.style.transform = `translate(${dx}px, ${dy}px)`;
  });
  el.addEventListener('mouseleave', () => { el.style.transform = ''; });
});

$$('.tilt').forEach((card) => {
  card.addEventListener('mousemove', (e) => {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    card.style.transform = `perspective(900px) rotateX(${-y * 4}deg) rotateY(${x * 5}deg) translateY(-3px)`;
  });
  card.addEventListener('mouseleave', () => { card.style.transform = ''; });
});

let scrollQueued = false;
addEventListener('scroll', () => {
  if (scrollQueued) return;
  scrollQueued = true;
  requestAnimationFrame(() => {
    root.style.setProperty('--scroll', scrollY);
    scrollQueued = false;
  });
}, { passive: true });

/* ---------- Wallpaper palette (each click cycles to the next colour pair) ---------- */
let swatches = [], swatchIndex = 0;

async function extractSwatches() {
  const img = new Image();
  img.src = 'background.jpg';
  await img.decode();
  const size = 80, canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, size, size);
  const data = ctx.getImageData(0, 0, size, size).data;

  const buckets = new Map();
  for (let i = 0; i < data.length; i += 16) {
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    if (max < 45 || (max - min) / max < 0.16) continue; // skip dark / grey pixels
    const key = [r, g, b].map((v) => Math.round(v / 24) * 24).join(',');
    buckets.set(key, (buckets.get(key) || 0) + 1);
  }

  const picked = [];
  for (const [key] of [...buckets].sort((a, b) => b[1] - a[1])) {
    const rgb = key.split(',').map(Number);
    const distinct = picked.every((p) => Math.hypot(...p.map((v, i) => v - rgb[i])) > 90);
    if (distinct) picked.push(rgb);
    if (picked.length === 6) break;
  }
  return picked.map((c) => `rgb(${c.join(',')})`);
}

function applyPalette() {
  if (swatches.length < 2) return;
  root.style.setProperty('--accent', swatches[swatchIndex % swatches.length]);
  root.style.setProperty('--accent2', swatches[(swatchIndex + 1) % swatches.length]);
}

(async () => {
  try { swatches = await extractSwatches(); applyPalette(); }
  catch (err) { console.warn('Palette extraction skipped:', err); }
})();

$('#paletteBtn').addEventListener('click', (e) => {
  swatchIndex++;
  applyPalette();
  e.currentTarget.textContent = 'Re-palette ✓';
  setTimeout(() => { e.currentTarget.textContent = 'Re-palette'; }, 1200);
});

/* ---------- Discord: profile (identity) + Lanyard (live presence) ---------- */
const avatarEl = $('#discordAvatar');
let identityLoaded = false;

const defaultAvatar = () => `${CDN}/embed/avatars/${Number((BigInt(CONFIG.userId) >> 22n) % 6n)}.png`;
avatarEl.addEventListener('error', () => {
  if (avatarEl.src !== defaultAvatar()) avatarEl.src = defaultAvatar();
});

function setStatus(status) {
  const value = status || 'offline';
  $('#discordStatus').className = value;
  setText('#statusText', value);
  setText('#statusModule', value);
}

function renderIdentity(user, profile = {}) {
  setText('#discordName', user.global_name || user.username || 'Aoi');
  if (user.username) setText('#discordTag', `@${user.username}`);

  if (CONFIG.customAvatar) {
    avatarEl.src = CONFIG.customAvatar;
  } else if (user.avatar) {
    const ext = user.avatar.startsWith('a_') ? 'gif' : 'png';
    avatarEl.src = `${CDN}/avatars/${CONFIG.userId}/${user.avatar}.${ext}?size=256`;
  } else {
    avatarEl.src = defaultAvatar();
  }

  const deco = CONFIG.customAvatar ? null : user.avatar_decoration_data?.asset;
  $('#discordDeco').hidden = !deco;
  if (deco) $('#discordDeco').src = `${CDN}/avatar-decoration-presets/${deco}.png?size=128`;

  if (profile.banner) {
    const ext = profile.banner.startsWith('a_') ? 'gif' : 'png';
    const banner = $('#discordBanner');
    banner.style.backgroundImage = `url(${CDN}/banners/${CONFIG.userId}/${profile.banner}.${ext}?size=600)`;
    banner.classList.add('has-image');
  }
  if (profile.bio) {
    setText('#discordBio', profile.bio);
    $('#discordBio').hidden = false;
  }
  identityLoaded = true;
}

/* Banner + bio aren't in Lanyard, so this community profile cache is used. Best-effort only. */
async function loadProfile() {
  try {
    const data = await getJson(`https://dcdn.dstn.to/profile/${CONFIG.userId}`);
    renderIdentity(data.user, { banner: data.user?.banner, bio: data.user_profile?.bio });
  } catch (err) {
    console.warn('Extended profile unavailable:', err);
  }
}

function describeActivity(data) {
  const custom = data.activities?.find((a) => a.type === 4);
  const main = data.activities?.find((a) => a.type !== 4);

  if (data.listening_to_spotify && data.spotify) {
    const { song = 'Unknown track', artist = '' } = data.spotify;
    return { text: `Listening to ${song}${artist ? ` — ${artist}` : ''}`, name: `Spotify: ${song}` };
  }
  if (main) {
    const verb = ACTIVITY_VERBS[main.type] || 'Playing';
    return { text: `${verb} ${main.name}${main.details ? ` — ${main.details}` : ''}`, name: main.name };
  }
  if (custom?.state) return { text: custom.state, name: 'Custom status' };
  return { text: 'No active Discord activity.', name: 'None' };
}

async function loadPresence() {
  if (document.hidden) return;
  try {
    const json = await getJson(`https://api.lanyard.rest/v1/users/${CONFIG.userId}`);
    if (!json.success) throw new Error(json.error?.message || 'Lanyard is not tracking this user');
    const data = json.data;
    if (data.discord_user) renderIdentity(data.discord_user, { banner: null });
    setStatus(data.discord_status);
    const activity = describeActivity(data);
    setText('#activityText', activity.text);
    setText('#detailActivity', activity.name);
    setText('#sourceText', 'Lanyard (live)');
  } catch (err) {
    console.warn('Presence unavailable:', err);
    if (!identityLoaded && !CONFIG.customAvatar) avatarEl.src = defaultAvatar();
    setStatus('offline');
    setText('#activityText', 'Live presence unavailable right now.');
    setText('#detailActivity', '—');
    setText('#sourceText', 'Discord profile');
  }
}

$('#discordExpand').addEventListener('click', (e) => {
  const expanded = $('#discordCard').classList.toggle('expanded');
  e.currentTarget.setAttribute('aria-expanded', expanded);
});

/* ---------- Links + Discord server card ---------- */
$('#profileLink').href = CONFIG.profileUrl;
$('#dmLink').href = CONFIG.profileUrl;
$('#inviteLink').href = CONFIG.inviteUrl;
$('#serverCard').href = CONFIG.inviteUrl;

async function loadServer() {
  try {
    const invite = await getJson(`https://discord.com/api/v10/invites/${CONFIG.inviteCode}?with_counts=true`);
    const guild = invite.guild;
    setText('#serverName', guild.name);
    const { approximate_presence_count: online, approximate_member_count: members } = invite;
    if (members) setText('#serverCount', `${online?.toLocaleString() ?? '—'} online • ${members.toLocaleString()} members`);
    if (guild.icon) {
      const icon = $('#serverIcon');
      icon.src = `${CDN}/icons/${guild.id}/${guild.icon}.png?size=128`;
      icon.hidden = false;
    }
  } catch (err) {
    console.warn('Server info unavailable:', err); // keeps the static "Join my Discord server" card
  }
}

/* ---------- Copy profile ---------- */
$('#copyProfile').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(CONFIG.copyText);
    setText('#copyNotice', 'Copied.');
  } catch {
    setText('#copyNotice', 'Copy blocked by browser permissions.');
  }
  setTimeout(() => setText('#copyNotice', ''), 1800);
});

/* ---------- Start ---------- */
loadProfile();
loadPresence();
loadServer();
setInterval(loadPresence, CONFIG.pollMs);
document.addEventListener('visibilitychange', loadPresence);

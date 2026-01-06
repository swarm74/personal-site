/* --- CONFIGURATION --- */
const config = {
    discordID: "1182402282466332724", 
    lastFMUser: "blairwitch666",
    lastFMKey:  "29a08c5ff43d0b32ca4b271003be34e9", 
    titles: ["ihy", "idc", "lol", "die"]
};

/* --- 1. ENTER SCREEN & AUDIO --- */
const enter = document.getElementById('enter-screen');
const main = document.getElementById('main-content');
const audio = document.getElementById('bg-audio');

enter.addEventListener('click', () => {
    enter.style.opacity = '0';
    setTimeout(() => { enter.style.display = 'none'; }, 800);
    main.style.opacity = '1';
    audio.volume = 0.3; 
    audio.play().catch(e => console.log("Audio Error:", e));
});

/* --- 2. TYPEWRITER --- */
let txtIndex = 0, charIndex = 0, isDeleting = false;
const typeEl = document.getElementById('typewriter');
function type() {
    const current = config.titles[txtIndex];
    typeEl.textContent = current.substring(0, charIndex + (isDeleting ? -1 : 1));
    charIndex += isDeleting ? -1 : 1;
    let speed = isDeleting ? 50 : 100;
    if (!isDeleting && charIndex === current.length) { speed = 2000; isDeleting = true; }
    else if (isDeleting && charIndex === 0) { isDeleting = false; txtIndex = (txtIndex + 1) % config.titles.length; }
    setTimeout(type, speed);
}
type();

/* --- 3. LAST.FM (NOW PLAYING + STATS MODAL) --- */

// A. Fetch Now Playing (Updates the MODAL, not the button)
async function fetchNowPlaying() {
    if (!config.lastFMUser || !config.lastFMKey) return;
    const url = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${config.lastFMUser}&api_key=${config.lastFMKey}&format=json&limit=1`;
    try {
        const res = await fetch(url);
        const data = await res.json();
        const track = data.recenttracks.track[0];
        if (!track) return;
        
        const isPlaying = track['@attr'] && track['@attr'].nowplaying === 'true';
        
        // Update Modal Elements
        document.getElementById('np-name').textContent = track.name;
        document.getElementById('np-artist').textContent = track.artist['#text'];
        
        // Get Image (Largest available)
        const art = track.image.find(i => i.size === 'large')['#text'] || '';
        document.getElementById('np-img').src = art;

        // Bars Animation
        const bars = document.getElementById('np-bars');
        if (isPlaying) {
            bars.classList.add('active');
            document.getElementById('np-artist').style.color = "#23a559";
        } else {
            bars.classList.remove('active');
            document.getElementById('np-artist').style.color = "#aaa";
        }
    } catch (e) { console.log(e); }
}
fetchNowPlaying();
setInterval(fetchNowPlaying, 5000);

// B. Fetch Weekly Stats (Run only when clicking modal)
async function openMusicStats() {
    const modal = document.getElementById('music-modal');
    modal.style.display = 'flex';

    if (!config.lastFMUser || !config.lastFMKey) return;

    // Fetch Top Artist (7 Days)
    const artistUrl = `https://ws.audioscrobbler.com/2.0/?method=user.gettopartists&user=${config.lastFMUser}&api_key=${config.lastFMKey}&format=json&period=7day&limit=1`;
    // Fetch Top Albums (7 Days)
    const albumUrl = `https://ws.audioscrobbler.com/2.0/?method=user.gettopalbums&user=${config.lastFMUser}&api_key=${config.lastFMKey}&format=json&period=7day&limit=3`;

    try {
        // 1. Process Artist
        const artistRes = await fetch(artistUrl);
        const artistData = await artistRes.json();
        const topArtist = artistData.topartists.artist[0];

        if(topArtist) {
            document.getElementById('top-artist-name').textContent = topArtist.name;
            document.getElementById('top-artist-plays').textContent = `${topArtist.playcount} plays`;
            // LastFM doesn't always give artist images in this endpoint, but we try:
            const img = topArtist.image.find(i => i.size === 'medium')['#text'] || 'https://lastfm.freetls.fastly.net/i/u/64s/2a96cbd8b46e442fc41c2b86b821562f.png'; 
            document.getElementById('top-artist-img').src = img;
        }

        // 2. Process Albums
        const albumRes = await fetch(albumUrl);
        const albumData = await albumRes.json();
        const albums = albumData.topalbums.album;
        const grid = document.getElementById('album-grid');
        grid.innerHTML = ''; // Clear previous

        albums.forEach(album => {
            const art = album.image.find(i => i.size === 'large')['#text'] || '';
            const html = `
                <div class="album-item">
                    <img src="${art}" class="album-art" alt="${album.name}">
                    <span class="album-name" title="${album.name}">${album.name}</span>
                </div>
            `;
            grid.innerHTML += html;
        });

    } catch (e) { console.log("Stats Error:", e); }
}

// Close Modal Logic
document.querySelector('.close-modal').addEventListener('click', () => {
    document.getElementById('music-modal').style.display = 'none';
});

// Close if clicked outside
window.onclick = function(event) {
    const modal = document.getElementById('music-modal');
    if (event.target == modal) {
        modal.style.display = "none";
    }
}


/* --- 4. DISCORD / LANYARD API --- */
const statusColors = { online: '#23a559', idle: '#f0b232', dnd: '#f23f43', offline: '#80848e' };

async function fetchDiscord() {
    if (!config.discordID) return;
    try {
        const req = await fetch(`https://api.lanyard.rest/v1/users/${config.discordID}`);
        const res = await req.json();
        if (!res.success) return;
        const d = res.data;

        const ext = d.discord_user.avatar.startsWith('a_') ? 'gif' : 'png';
        document.querySelector('.dc-avatar').src = `https://cdn.discordapp.com/avatars/${d.discord_user.id}/${d.discord_user.avatar}.${ext}`;
        document.querySelector('.dc-status-indicator').style.backgroundColor = statusColors[d.discord_status];
        document.querySelector('.dc-username').textContent = d.discord_user.display_name || d.discord_user.username;

        document.getElementById('icon-mobile').classList.toggle('active', d.active_on_discord_mobile);
        document.getElementById('icon-desktop').classList.toggle('active', d.active_on_discord_desktop);
        document.getElementById('icon-web').classList.toggle('active', d.active_on_discord_web);

        const customStatus = d.activities.find(a => a.type === 4);
        const game = d.activities.find(a => a.type === 0);
        const statusTextEl = document.querySelector('.dc-custom-status');

        if (customStatus && customStatus.state) statusTextEl.textContent = customStatus.state;
        else if (game) statusTextEl.textContent = "Playing a game...";
        else statusTextEl.textContent = "";

        const rpBox = document.getElementById('rich-presence');
        if (game) {
            rpBox.style.display = "block";
            document.getElementById('rp-name').textContent = game.name;
            document.getElementById('rp-state').textContent = game.details || game.state || "Playing";
            const imgEl = document.getElementById('rp-image');
            if(game.assets && game.assets.large_image) {
                if(game.assets.large_image.startsWith("mp:")) imgEl.src = `https://media.discordapp.net/${game.assets.large_image.replace("mp:", "")}`;
                else imgEl.src = `https://cdn.discordapp.com/app-assets/${game.application_id}/${game.assets.large_image}.png`;
            } else imgEl.src = `https://cdn.discordapp.com/app-icons/${game.application_id}/${game.application_id}.png`;
        } else rpBox.style.display = "none";
    } catch (e) { console.error(e); }
}
fetchDiscord();
setInterval(fetchDiscord, 5000);

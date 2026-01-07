/* --- CONFIGURATION --- */
const config = {
    // Basic config if needed later
    discordID: "1182402282466332724" 
};

/* --- ENTER SCREEN & VIDEO AUDIO LOGIC --- */
const enter = document.getElementById('enter-screen');
const main = document.getElementById('main-content');
const video = document.getElementById('bg-video'); // Target the video

enter.addEventListener('click', () => {
    // Fade out enter screen
    enter.style.opacity = '0';
    setTimeout(() => { enter.style.display = 'none'; }, 800);
    
    // Show main content
    main.style.opacity = '1';
    
    // Unmute Video and Set Volume
    if(video) {
        video.muted = false; // Important: Unmutes the video
        video.volume = 0.3;  // Set volume (0.0 to 1.0)
        video.play().catch(e => console.log("Video Play Error:", e));
    }
});

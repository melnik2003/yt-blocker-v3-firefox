// Function to get blacklists from storage
function getBlacklists() {
    return browser.storage.local.get(['realNameBlacklist', 'displayNameBlacklist']);
}

// Function to detect the current page type based on the URL
function getPageType() {
    const path = window.location.pathname;
    const query = window.location.search;

    if (path === '/' || path === '/home') {
        return 'home'; // Home page
    } else if (query.includes('search_query=')) {
        return 'search'; // Search results page
    } else if (path.includes('watch')) {
        return 'watch'; // Watching a video (to catch recommended videos)
    } else {
        return 'unknown';
    }
}

// Function to block videos on the home page (real names and display names)
function blockVideosFromHomePage(realNameBlacklist, displayNameBlacklist) {
    const homePageVideos = document.querySelectorAll('ytd-rich-item-renderer');
    console.log(`[${new Date().toISOString()}] Found ${homePageVideos.length} videos on the home page.`);

    homePageVideos.forEach((videoItem, index) => {
        // Extract the real name from the href attribute
        const channelLink = videoItem.querySelector('#channel-name a');
        const realChannelName = channelLink ? channelLink.href.split('/@')[1] : null;

        // Extract the display name from the anchor text content
        const displayName = channelLink ? channelLink.textContent.trim() : null;

        console.log(`[${new Date().toISOString()}] Checking video (Real Name: ${realChannelName}, Display Name: ${displayName})`);

        // Check both real name and display name against the blacklists
        if ((realChannelName && realNameBlacklist.includes(realChannelName)) || 
            (displayName && displayNameBlacklist.includes(displayName))) {
            console.log(`[${new Date().toISOString()}] Blocking home page video (Real Name: ${realChannelName}, Display Name: ${displayName}) (Video #${index + 1})`);
            videoItem.style.display = 'none'; // Hide the video
        } else {
            console.log(`[${new Date().toISOString()}] Not blocking home page video (Real Name: ${realChannelName || 'Unknown'}, Display Name: ${displayName || 'Unknown'}).`);
        }
    });
}


// Function to block videos in search results (real names and display names)
function blockVideosFromSearchResults(realNameBlacklist, displayNameBlacklist) {
    const searchResultVideos = document.querySelectorAll('ytd-video-renderer, ytd-video-inline-engagement-panel-renderer'); // Adjust selector
    console.log(`[${new Date().toISOString()}] Found ${searchResultVideos.length} videos in search results.`);

    searchResultVideos.forEach((videoItem, index) => {
        // Extract the real name from the href attribute
        const channelLink = videoItem.querySelector('#channel-name a');
        const realChannelName = channelLink ? channelLink.href.split('/@')[1] : null; // Get the part after "/@"

        // Extract the display name from the anchor text content
        const displayName = channelLink ? channelLink.textContent.trim() : null;

        console.log(`[${new Date().toISOString()}] Checking video (Real Name: ${realChannelName}, Display Name: ${displayName})`);

        // Check both real name and display name against the blacklists
        if ((realChannelName && realNameBlacklist.includes(realChannelName)) || 
            (displayName && displayNameBlacklist.includes(displayName))) {
            console.log(`[${new Date().toISOString()}] Blocking search result video (Real Name: ${realChannelName}, Display Name: ${displayName}) (Video #${index + 1})`);
            videoItem.style.display = 'none'; // Hide the video
        } else {
            console.log(`[${new Date().toISOString()}] Not blocking search result video (Real Name: ${realChannelName || 'Unknown'}, Display Name: ${displayName || 'Unknown'}).`);
        }
    });
}


// Function to block videos in recommendations (display names)
function blockVideosFromRecommendations(displayNameBlacklist) {
    const recommendationVideos = document.querySelectorAll('ytd-compact-video-renderer'); // Adjust selector for recommendations
    console.log(`[${new Date().toISOString()}] Found ${recommendationVideos.length} recommendation videos.`);

    recommendationVideos.forEach((videoItem, index) => {
        // Extract the display name from the yt-formatted-string inside ytd-channel-name
        const channelNameElement = videoItem.querySelector('ytd-channel-name #text');
        const displayName = channelNameElement ? channelNameElement.textContent.trim() : null;

        console.log(`[${new Date().toISOString()}] Checking recommendation video (Display Name: ${displayName})`);

        // Check if the display name is in the blacklist
        if (displayName && displayNameBlacklist.includes(displayName)) {
            console.log(`[${new Date().toISOString()}] Blocking recommendation video from display name: ${displayName} (Video #${index + 1})`);
            videoItem.style.display = 'none'; // Hide the video
        } else {
            console.log(`[${new Date().toISOString()}] Not blocking recommendation video (Display name: ${displayName || 'Unknown'}).`);
        }
    });
}


// Main function to check page type and block videos accordingly
function checkAndBlockVideos() {
    getBlacklists().then(data => {
        const realNameBlacklist = data.realNameBlacklist || [];
        const displayNameBlacklist = data.displayNameBlacklist || [];

        // Log the current blacklists for debugging purposes
        console.log(`[${new Date().toISOString()}] Real name blacklist: ${realNameBlacklist.length} entries.`);
        console.log(`[${new Date().toISOString()}] Display name blacklist: ${displayNameBlacklist.length} entries.`);

        const pageType = getPageType();

        // Block videos based on the page type
        if (pageType === 'home') {
            console.log(`[${new Date().toISOString()}] Home page detected.`);
            blockVideosFromHomePage(realNameBlacklist, displayNameBlacklist);
        } else if (pageType === 'search') {
            console.log(`[${new Date().toISOString()}] Search page detected.`);
            blockVideosFromSearchResults(realNameBlacklist, displayNameBlacklist);
        } else if (pageType === 'watch') {
            console.log(`[${new Date().toISOString()}] Watch page detected.`);
            blockVideosFromRecommendations(displayNameBlacklist);
        } else {
            console.log(`[${new Date().toISOString()}] Uknown page type detected. The script wouldn't block any videos.`);
        }
    });
}

// Run the blocking function when the page is loaded
checkAndBlockVideos();

// MutationObserver to monitor the page for dynamically loaded content (like recommendations)
const observer = new MutationObserver(() => {
    console.log(`[${new Date().toISOString()}] Page updated. Checking for new videos...`);
    checkAndBlockVideos();
});

// Observe changes in the body of the document for dynamically loaded content
observer.observe(document.body, {
    childList: true,
    subtree: true,
});

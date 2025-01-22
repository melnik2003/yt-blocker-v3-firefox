// Function to check if a video is from a blacklisted channel and block it
function blockVideos(blacklist) {
    // Select video items in the search results, home page, and recommendations
    const videoItems = document.querySelectorAll(
        'ytd-video-renderer, ytd-video-inline-engagement-panel-renderer, ytd-rich-item-renderer'
    );
    
    videoItems.forEach((videoItem, index) => {
        // Get the channel ID (the part after "/@" in the href attribute)
        const channelLink = videoItem.querySelector('#channel-name a');
        const channelId = channelLink ? channelLink.href.split('/@')[1] : null;

        // If the channel ID exists and is in the blacklist, hide the video
        if (channelId && blacklist.includes(channelId)) {
            videoItem.style.display = 'none';
        }
    });
}

// Get the current blacklist from browser.storage.local and apply the blocking logic
browser.storage.local.get('blacklist', (data) => {
    const blacklist = data.blacklist || [];
    blockVideos(blacklist);
});

// MutationObserver to monitor the page for dynamically loaded videos (in case of scrolling or recommendations)
const observer = new MutationObserver(() => {
    // Whenever the page is updated, check for new videos and block them
    browser.storage.local.get('blacklist', (data) => {
        const blacklist = data.blacklist || [];
        blockVideos(blacklist);
    });
});

// Observe changes in the search results container, home page, and recommended videos
observer.observe(document.body, {
    childList: true,
    subtree: true,
});

// Store the loggingEnabled setting once when the extension starts
let loggingEnabled = false;
let logLevel = 'info';  // Default log level

function initializeLogging() {
    browser.storage.local.get('loggingEnabled').then(data => {
        loggingEnabled = data.loggingEnabled || false;  // Default to false if not set
    });
}

// Listen for changes in the local storage
browser.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
        if (changes.loggingEnabled) {
            loggingEnabled = changes.loggingEnabled.newValue;
            logMessage(`Logging enabled: ${loggingEnabled}`);
        }
        // Add more settings you want to listen for here, e.g., blacklists
        if (changes.realNameBlacklist || changes.displayNameBlacklist) {
            logMessage('Blacklists updated, refreshing blocked videos.');
            // Optionally, call your blocking function again to reapply the changes immediately
            checkAndBlockVideos(); // This will recheck and block videos based on the updated blacklists
        }
    }
});

// Function to log messages only if logging is enabled
function logMessage(message, level = 'info') {
    const levels = ['debug', 'info', 'warn', 'error'];
    if (levels.indexOf(level) >= levels.indexOf(logLevel) && loggingEnabled) {
        const timestamp = new Date().toISOString();
        const messageWithTimestamp = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
        console.log(messageWithTimestamp);
    }
}

// Call this function when the extension starts to set up logging
initializeLogging();

// Caching blacklists and invalidating them after a set period
let blacklistsCache = { data: null, timestamp: 0 };

function getBlacklists() {
    const currentTimestamp = new Date().getTime();
    if (blacklistsCache.data && currentTimestamp - blacklistsCache.timestamp < 60000) {
        return Promise.resolve(blacklistsCache.data);
    }

    return browser.storage.local.get(['realNameBlacklist', 'displayNameBlacklist'])
        .then(data => {
            blacklistsCache = { data, timestamp: currentTimestamp };
            return data;
        })
        .catch(error => {
            logMessage(`Error fetching blacklists: ${error.message}`, 'error');
            return {}; // Return empty blacklists on error
        });
}

// Function to detect the current page type based on the URL
function getPageType() {
    const path = window.location.pathname;
    const query = window.location.search;
    const href = window.location.href;

    if (path === '/' || path === '/home') return 'home';
    if (query.includes('search_query=')) return 'search';
    if (href.includes('/watch')) return 'watch'; // More reliable for 'watch' page detection
    return 'unknown';
}

// General function to block videos based on blacklisted channels
function blockVideos(videoItems, realNameBlacklist, displayNameBlacklist, pageType) {
    videoItems.forEach((videoItem, index) => {
        const channelLink = videoItem.querySelector('#channel-name a');
        if (channelLink) {
            const realChannelName = channelLink.href.split('/@')[1];
            const displayName = channelLink.textContent.trim();

            logMessage(`Checking video (Real Name: ${realChannelName}, Display Name: ${displayName})`);

            const shouldBlock = 
                (realChannelName && realNameBlacklist.includes(realChannelName)) || 
                (displayName && displayNameBlacklist.includes(displayName));

            logVideoBlockingDecision(pageType, realChannelName, displayName, shouldBlock);

            if (shouldBlock) {
                videoItem.style.display = 'none'; // Hide the video
            }
        }
    });
}

// Log the decision of whether to block or not
function logVideoBlockingDecision(videoType, realChannelName, displayName, shouldBlock) {
    const message = shouldBlock
        ? `Blocking ${videoType} video (Real Name: ${realChannelName}, Display Name: ${displayName})`
        : `Not blocking ${videoType} video (Real Name: ${realChannelName || 'Unknown'}, Display Name: ${displayName || 'Unknown'})`;
    logMessage(message);
}

// Function to block videos on any page by selector
function blockVideosFromPage(selector, realNameBlacklist, displayNameBlacklist, pageType) {
    const videoItems = document.querySelectorAll(selector);
    logMessage(`Found ${videoItems.length} videos on the ${pageType} page.`);
    blockVideos(videoItems, realNameBlacklist, displayNameBlacklist, pageType);
}

// Function to check if the page type is relevant for blocking videos
function shouldCheckForVideos() {
    const pageType = getPageType();
    return pageType === 'home' || pageType === 'search' || pageType === 'watch';
}

// Debounce function to limit how often checkAndBlockVideos is called
let debounceTimeout = null;

function debounce(func, delay) {
    return function (...args) {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => func(...args), delay);
    };
}

// Optimized debounced version of checkAndBlockVideos
const optimizedCheckAndBlockVideos = debounce(checkAndBlockVideos, 1000); // 1 second debounce

// Main function to check page type and block videos accordingly
function checkAndBlockVideos() {
    if (!shouldCheckForVideos()) return; // Skip check if page type is irrelevant

    getBlacklists().then(({ realNameBlacklist = [], displayNameBlacklist = [] }) => {
        logMessage(`Real name blacklist: ${realNameBlacklist.length} entries.`);
        logMessage(`Display name blacklist: ${displayNameBlacklist.length} entries.`);

        // Early exit if no blacklists are configured
        if (realNameBlacklist.length === 0 && displayNameBlacklist.length === 0) {
            logMessage('No blacklists configured. Exiting.', 'warning');
            return;
        }

        const pageType = getPageType();

        if (pageType === 'home') {
            logMessage('Home page detected.');
            blockVideosFromPage('ytd-rich-item-renderer', realNameBlacklist, displayNameBlacklist, 'home');
        } else if (pageType === 'search') {
            logMessage('Search page detected.');
            blockVideosFromPage('ytd-video-renderer, ytd-video-inline-engagement-panel-renderer', realNameBlacklist, displayNameBlacklist, 'search');
        } else if (pageType === 'watch') {
            logMessage('Watch page detected.');
            blockVideosFromPage('ytd-compact-video-renderer', realNameBlacklist, displayNameBlacklist, 'recommendations');
        } else {
            logMessage('Unknown page type detected. The script wouldn\'t block any videos.', 'warning');
        }
    });
}

// Introduce a slight delay before the initial check to ensure content has loaded
function onPageLoad() {
    setTimeout(() => {
        logMessage('Page initially loaded. Checking videos...');
        checkAndBlockVideos();
    }, 2000); // 2 seconds delay for initial content to load
}

// Run the initial check after page load
onPageLoad();

// MutationObserver to monitor the page for dynamically loaded content (like recommendations)
const observer = new MutationObserver(() => {
    logMessage('Page updated. Checking for new videos...');
    optimizedCheckAndBlockVideos();
});

// Observe changes in the body of the document for dynamically loaded content
observer.observe(document.body, {
    childList: true,
    subtree: true,
});

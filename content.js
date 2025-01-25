// Store the loggingEnabled setting once when the extension starts
let loggingEnabled = false;
let logLevel = 'info';  // Default log level

// Initialize logging based on the settings stored in local storage
function initializeLogging() {
    browser.storage.local.get('loggingEnabled').then(data => {
        loggingEnabled = data.loggingEnabled || false;  // Default to false if not set
    });
}

// Listen for changes in the local storage and handle logging or blacklists updates
browser.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
        if (changes.loggingEnabled) {
            loggingEnabled = changes.loggingEnabled.newValue;
            logMessage(`Logging enabled: ${loggingEnabled}`);
        }
        if (changes.realNameBlacklist || changes.displayNameBlacklist) {
            logMessage('Blacklists updated, refreshing blocked videos.');
            checkAndBlockVideos();  // Recheck and block videos based on the updated blacklists
        }
    }
});

// Function to log messages only if logging is enabled
function logMessage(message, level = 'info') {
    const levels = ['debug', 'info', 'warn', 'error'];
    if (levels.indexOf(level) >= levels.indexOf(logLevel) && loggingEnabled) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`);
    }
}

// Initialize logging when the extension starts
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
    if (href.includes('/watch')) return 'watch';
    return 'unknown';
}

// Consolidated function to block videos based on the blacklists and page type
function blockVideos(videoItems, realNameBlacklist, displayNameBlacklist, pageType) {
    videoItems.forEach((videoItem) => {
        // Look for the correct channel name element in recommendations (watch page)
        const channelNameElement = videoItem.querySelector('ytd-channel-name #text');
        let realChannelName = null;
        let displayName = null;

        if (channelNameElement) {
            // For recommendations, we only have display name in the #text element
            displayName = channelNameElement.textContent.trim();
        }

        // Log checking process
        logMessage(`Checking video (Real Name: ${realChannelName || 'N/A'}, Display Name: ${displayName || 'N/A'})`);

        // Logic to decide whether to block the video
        let shouldBlock = false;

        if (pageType === 'home' || pageType === 'search') {
            shouldBlock = 
                (realChannelName && realNameBlacklist.includes(realChannelName)) || 
                (displayName && displayNameBlacklist.includes(displayName));
        } else if (pageType === 'watch') {
            // For watch page, only check display name for recommendations
            shouldBlock = displayName && displayNameBlacklist.includes(displayName);
        }

        logVideoBlockingDecision(pageType, realChannelName, displayName, shouldBlock);

        // Block the video if necessary
        if (shouldBlock) {
            videoItem.style.display = 'none'; // Hide the video
        }
    });
}

// Log the decision to block a video
function logVideoBlockingDecision(pageType, realChannelName, displayName, shouldBlock) {
    const message = shouldBlock
        ? `Blocking ${pageType} video (Real Name: ${realChannelName}, Display Name: ${displayName})`
        : `Not blocking ${pageType} video (Real Name: ${realChannelName || 'Unknown'}, Display Name: ${displayName || 'Unknown'})`;
    logMessage(message);
}

// General function to get video elements based on the page type
function getVideoElements(pageType) {
    switch (pageType) {
        case 'home':
            return document.querySelectorAll('ytd-rich-item-renderer');
        case 'search':
            return document.querySelectorAll('ytd-video-renderer, ytd-video-inline-engagement-panel-renderer');
        case 'watch':
            return document.querySelectorAll('ytd-compact-video-renderer');
        default:
            return [];
    }
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
const optimizedCheckAndBlockVideos = debounce(checkAndBlockVideos, 1000);

// Main function to check page type and block videos accordingly
function checkAndBlockVideos() {
    if (!shouldCheckForVideos()) return;

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
            blockVideos(getVideoElements(pageType), realNameBlacklist, displayNameBlacklist, pageType);
        } else if (pageType === 'search') {
            logMessage('Search page detected.');
            blockVideos(getVideoElements(pageType), realNameBlacklist, displayNameBlacklist, pageType);
        } else if (pageType === 'watch') {
            logMessage('Watch page detected.');
            blockVideos(getVideoElements(pageType), realNameBlacklist, displayNameBlacklist, pageType);
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

// MutationObserver to monitor the page for dynamically loaded content
const observer = new MutationObserver(() => {
    logMessage('Page updated. Checking for new videos...');
    optimizedCheckAndBlockVideos();
});

// Observe changes in the body of the document for dynamically loaded content
observer.observe(document.body, {
    childList: true,
    subtree: true,
});

chrome.runtime.onInstalled.addListener(async () => {
    try {
        // Set up initial empty vars in chrome.storage.local if not already present
        chrome.storage.local.get(['realNameBlacklist', 'displayNameBlacklist'], (data) => {
            if (!data.realNameBlacklist) {
                chrome.storage.local.set({ realNameBlacklist: [] });
            }
            if (!data.displayNameBlacklist) {
                chrome.storage.local.set({ displayNameBlacklist: [] });
            }

            chrome.storage.local.get('loggingEnabled', (loggingData) => {
                if (typeof loggingData.loggingEnabled === 'undefined') {
                    chrome.storage.local.set({ loggingEnabled: false });
                }
            });
        });
    } catch (error) {
        console.error("Error during installation setup:", error);
    }
});

// Listener for receiving blacklist updates
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'updateRealNameBlacklist') {
        console.log('Updating real name blacklist:', message.realNameBlacklist);
        chrome.storage.local.set({ realNameBlacklist: message.realNameBlacklist }, () => {
            console.log('Real name blacklist updated');
            sendResponse({ success: true });
        });
        return true; // Keep the message channel open for asynchronous response
    }

    if (message.type === 'updateDisplayNameBlacklist') {
        console.log('Updating display name blacklist:', message.displayNameBlacklist);
        chrome.storage.local.set({ displayNameBlacklist: message.displayNameBlacklist }, () => {
            console.log('Display name blacklist updated');
            sendResponse({ success: true });
        });
        return true; // Keep the message channel open for asynchronous response
    }
});

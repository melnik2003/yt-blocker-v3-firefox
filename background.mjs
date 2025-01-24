browser.runtime.onInstalled.addListener(() => {
    // Set up initial empty realNameBlacklist and displayNameBlacklist in browser.storage.local if not already present
    browser.storage.local.get(['realNameBlacklist', 'displayNameBlacklist'], (data) => {
        if (!data.realNameBlacklist) {
            browser.storage.local.set({ realNameBlacklist: [] });
        }
        if (!data.displayNameBlacklist) {
            browser.storage.local.set({ displayNameBlacklist: [] });
        }
    });
});

// Listener for receiving blacklist updates
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'updateRealNameBlacklist') {
        console.log('Updating real name blacklist:', message.realNameBlacklist);
        browser.storage.local.set({ realNameBlacklist: message.realNameBlacklist }, () => {
            console.log('Real name blacklist updated');
            sendResponse({ success: true });
        });
        return true; // Keep the message channel open for asynchronous response
    }
    if (message.type === 'updateDisplayNameBlacklist') {
        console.log('Updating display name blacklist:', message.displayNameBlacklist);
        browser.storage.local.set({ displayNameBlacklist: message.displayNameBlacklist }, () => {
            console.log('Display name blacklist updated');
            sendResponse({ success: true });
        });
        return true; // Keep the message channel open for asynchronous response
    }
});

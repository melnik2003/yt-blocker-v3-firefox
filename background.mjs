browser.runtime.onInstalled.addListener(async () => {
    try {
        // Set up initial empty vars in browser.storage.local if not already present
        const data = await browser.storage.local.get(['realNameBlacklist', 'displayNameBlacklist']);
        
        if (!data.realNameBlacklist) {
            await browser.storage.local.set({ realNameBlacklist: [] });
        }
        if (!data.displayNameBlacklist) {
            await browser.storage.local.set({ displayNameBlacklist: [] });
        }

        const loggingData = await browser.storage.local.get('loggingEnabled');
        if (typeof loggingData.loggingEnabled === 'undefined') {
            await browser.storage.local.set({ loggingEnabled: false });
        }
    } catch (error) {
        console.error("Error during installation setup:", error);
    }
});

// Listener for receiving blacklist updates
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'updateRealNameBlacklist') {
        console.log('Updating real name blacklist:', message.realNameBlacklist);
        browser.storage.local.set({ realNameBlacklist: message.realNameBlacklist })
            .then(() => {
                console.log('Real name blacklist updated');
                sendResponse({ success: true });
            })
            .catch(error => {
                console.error("Error updating real name blacklist:", error);
                sendResponse({ success: false, error: error.message });
            });
        return true; // Keep the message channel open for asynchronous response
    }

    if (message.type === 'updateDisplayNameBlacklist') {
        console.log('Updating display name blacklist:', message.displayNameBlacklist);
        browser.storage.local.set({ displayNameBlacklist: message.displayNameBlacklist })
            .then(() => {
                console.log('Display name blacklist updated');
                sendResponse({ success: true });
            })
            .catch(error => {
                console.error("Error updating display name blacklist:", error);
                sendResponse({ success: false, error: error.message });
            });
        return true; // Keep the message channel open for asynchronous response
    }
});

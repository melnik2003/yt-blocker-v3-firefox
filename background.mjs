browser.runtime.onInstalled.addListener(() => {
    // Set up initial empty blacklist in browser.storage.local if not already present
    browser.storage.local.get('blacklist', (data) => {
        if (!data.blacklist) {
            browser.storage.local.set({ blacklist: [] });
        }
    });
});

// Listener for receiving blacklist updates
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'updateBlacklist') {
        console.log('Updating blacklist:', message.blacklist);
        browser.storage.local.set({ blacklist: message.blacklist }, () => {
            console.log('Blacklist updated');
            sendResponse({ success: true });
        });
        return true; // Keep the message channel open for asynchronous response
    }
});

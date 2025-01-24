document.getElementById('open-settings').addEventListener('click', () => {
    browser.tabs.create({ url: browser.runtime.getURL('./settings/settings.html') });
});

document.addEventListener('DOMContentLoaded', () => {
    // Load the current logging setting from storage
    browser.storage.local.get('loggingEnabled').then(data => {
        const checkbox = document.getElementById('logCheckbox');
        
        if (checkbox) {
            // Use a fallback value in case loggingEnabled is not set
            checkbox.checked = data.hasOwnProperty('loggingEnabled') ? data.loggingEnabled !== false : true;
        }
    });

    // Listen for changes to the checkbox
    const checkbox = document.getElementById('logCheckbox');
    if (checkbox) {
        checkbox.addEventListener('change', async (event) => {
            try {
                // Update storage with the new loggingEnabled value
                await browser.storage.local.set({ loggingEnabled: event.target.checked });
            } catch (error) {
                console.error("Failed to update logging setting:", error);
            }
        });
    }
});

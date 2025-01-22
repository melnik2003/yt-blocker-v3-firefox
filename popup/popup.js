document.getElementById('open-settings').addEventListener('click', () => {
	chrome.tabs.create({ url: chrome.runtime.getURL('./settings/settings.html') });
});
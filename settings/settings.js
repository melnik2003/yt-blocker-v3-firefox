document.addEventListener('DOMContentLoaded', function () {
	const realNameInput = document.getElementById('real-name-blacklist');
	const displayNameInput = document.getElementById('display-name-blacklist');

	// Get real name blacklist and display name blacklist from browser.storage.local
	browser.storage.local.get(['realNameBlacklist', 'displayNameBlacklist'], (data) => {
		if (data.realNameBlacklist) {
			realNameInput.value = data.realNameBlacklist.join('\n');
		}
		if (data.displayNameBlacklist) {
			displayNameInput.value = data.displayNameBlacklist.join('\n');
		}
	});

	// Save button event listener for real name blacklist
	document.getElementById('real-name-save-button').addEventListener('click', function () {
		const realNameBlacklistValues = realNameInput.value.trim().split('\n').map(item => item.trim());

		// Save the real name blacklist to browser.storage.local
		if (realNameBlacklistValues.length > 0) {
			browser.storage.local.set({ realNameBlacklist: realNameBlacklistValues }, () => {
				alert('Real name blacklist saved successfully!');
			});
		} else {
			alert('Please enter some real channel names to save.');
		}
	});

	// Save button event listener for display name blacklist
	document.getElementById('display-name-save-button').addEventListener('click', function () {
		const displayNameBlacklistValues = displayNameInput.value.trim().split('\n').map(item => item.trim());

		// Save the display name blacklist to browser.storage.local
		if (displayNameBlacklistValues.length > 0) {
			browser.storage.local.set({ displayNameBlacklist: displayNameBlacklistValues }, () => {
				alert('Display name blacklist saved successfully!');
			});
		} else {
			alert('Please enter some display channel names to save.');
		}
	});
});

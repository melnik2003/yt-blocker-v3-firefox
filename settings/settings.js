document.addEventListener('DOMContentLoaded', function () {
	const blacklistInput = document.getElementById('blacklist');

	// Get blacklist items from browser.storage.local
	browser.storage.local.get('blacklist', (data) => {
		if (data.blacklist) {
			blacklistInput.value = data.blacklist.join('\n'); // Assuming blacklist is an array
		}
	});

	// Save button event listener
	document.getElementById('saveButton').addEventListener('click', function () {
		const blacklistValues = blacklistInput.value.trim().split('\n').map(item => item.trim());

		// Save the blacklist values to browser.storage.local
		if (blacklistValues.length > 0) {
			browser.storage.local.set({ blacklist: blacklistValues }, () => {
				alert('Blacklist saved successfully!');
			});
		} else {
			alert('Please enter some values to save.');
		}
	});
});
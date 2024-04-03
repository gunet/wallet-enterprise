var queryString = window.location.search;
var urlParams = new URLSearchParams(queryString);

if(urlParams.get('invalid-username')) {
	popupAlert('invalid-username');
}

if(urlParams.get('invalid-password')) {
	popupAlert('invalid-password');
}

if(urlParams.get('invalid-credentials')) {
	popupAlert('invalid-credentials');
}

if(urlParams.get('network-error')) {
	popupAlert('network-error');
}

const validCredentials = [
	{ username: 'user1', password: 'secret' },
	{ username: 'user2', password: 'secret' },
];
function isValidCredentials(username, password) {
	return validCredentials.some(cred => cred.username === username && cred.password === password);
}


document.forms.login.onsubmit = function(event) {

	const formData = new FormData(document.forms.login);
	const username = formData.get('username');
	const password = formData.get('password');

	if(username === null || username === "") {
		event.preventDefault();
		console.log('invalid username');
		popupAlert('invalid-username');
		return;
	}

	if(password === null || password === "") {
		event.preventDefault();
		console.log('invalid password');
		popupAlert('invalid-password');
		return;
	}
	if (!isValidCredentials(username, password)) {
		event.preventDefault();
		console.log('invalid credentials');
		popupAlert('invalid-credentials');
		return;
	}

}
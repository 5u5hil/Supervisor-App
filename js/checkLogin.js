var user = window.localStorage.getItem('user');

if (user == null || user == '') {
    window.location.href = 'login.html';
}
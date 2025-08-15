document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.querySelector('.logout-btn');
    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            // Clear the user's session data
            sessionStorage.clear();
            // Redirect to the login page
            window.location.href = 'login.html';
        });
    }
});

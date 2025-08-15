document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const messageDiv = document.getElementById('message');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value.trim();

            console.log(`Login attempt - Email: [${email}], Password: [${password}]`); // Debug line

            // Admin 'ghost' login (frontend check)
            if (email === 'admin@crediobanc.com' && password === 'admin123@') {
                sessionStorage.setItem('user', JSON.stringify({ name: 'Admin', isAdmin: true }));
                messageDiv.textContent = 'Admin login successful! Redirecting...';
                messageDiv.className = 'message success';
                setTimeout(() => {
                    window.location.href = 'admin.html';
                }, 1000);
                return; // Stop further execution
            }

            // --- Regular User Login --- 
            const submitButton = loginForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.textContent;
            submitButton.disabled = true;
            submitButton.textContent = 'Logging in...';
            messageDiv.textContent = '';
            messageDiv.className = 'message';

            const formData = new FormData(loginForm);

            try {
                const response = await fetch('http://127.0.0.1:5000/login', {
                    method: 'POST',
                    body: formData,
                });

                const userData = await response.json();

                if (response.ok) {
                    sessionStorage.setItem('user', JSON.stringify(userData));
                    messageDiv.textContent = 'Login successful! Redirecting...';
                    messageDiv.className = 'message success';
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 1500);
                } else {
                    throw new Error(userData.error || 'Invalid credentials');
                }

            } catch (error) {
                console.error('Login error:', error);
                messageDiv.textContent = 'Invalid email or password. Please try again.';
                messageDiv.className = 'message error';
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
            }
        });
    }
});
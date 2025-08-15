document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const messageDiv = document.getElementById('message');
    const webhookUrl = 'http://127.0.0.1:5000/login';

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitButton = loginForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.textContent;

            // Disable button and show loading state
            submitButton.disabled = true;
            submitButton.textContent = 'Logging in...';
            messageDiv.textContent = '';
            messageDiv.className = 'message';

            const formData = new FormData(loginForm);

            try {
                const response = await fetch(webhookUrl, {
                    method: 'POST',
                    body: formData,
                });

                if (response.ok) {
                    try {
                        const userData = await response.json();
                        console.log('Data received from webhook:', userData);
                        // Save user data to sessionStorage if it exists
                        if (userData) {
                            sessionStorage.setItem('user', JSON.stringify(userData));
                        }
                    } catch (jsonError) {
                        console.log('Could not parse JSON response from webhook. Proceeding without user data.');
                    }

                    messageDiv.textContent = 'Login successful! Redirecting...';
                    messageDiv.classList.add('success');
                    
                    // Redirect based on user type
                    setTimeout(() => {
                        console.log('Redirecting based on isAdmin flag:', userData.isAdmin);
                        if (userData.isAdmin) {
                            window.location.href = 'admin.html';
                        } else {
                            window.location.href = 'dashboard.html';
                        }
                    }, 1500);
                } else {
                    const errorData = await response.text();
                    throw new Error(`Webhook failed: ${errorData}`);
                }

            } catch (error) {
                console.error('Submission error:', error);
                messageDiv.textContent = 'Invalid email or password. Please try again.';
                messageDiv.classList.add('error');
            } finally {
                // Restore button state
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
            }
        });
    }
});
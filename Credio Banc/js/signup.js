document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signup-form');
    const messageDiv = document.getElementById('message');
    const webhookUrl = 'http://127.0.0.1:5000/signup';

    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitButton = signupForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.textContent;

            // Disable button and show loading state
            submitButton.disabled = true;
            submitButton.textContent = 'Submitting...';
            messageDiv.textContent = '';
            messageDiv.className = 'message';

            const formData = new FormData(signupForm);

            try {
                const response = await fetch(webhookUrl, {
                    method: 'POST',
                    body: formData,
                });

                if (response.ok) {
                    messageDiv.innerHTML = 'Registration successful! <a href="login.html">Please login.</a>';
                    messageDiv.classList.add('success');
                    signupForm.reset();
                } else if (response.status === 409) {
                    const errorData = await response.json();
                    messageDiv.textContent = errorData.error || 'A user with this email address already exists.';
                    messageDiv.classList.add('error');
                } else {
                    const errorData = await response.text();
                    throw new Error(`Webhook failed: ${errorData}`);
                }

            } catch (error) {
                console.error('Submission error:', error);
                messageDiv.textContent = 'An error occurred. Please try again.';
                messageDiv.classList.add('error');
            } finally {
                // Restore button state
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
            }
        });
    }
});
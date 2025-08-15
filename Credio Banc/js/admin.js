console.log('admin.js loaded'); // Debug: Check if script is running

document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(sessionStorage.getItem('user'));

    // Protect the route for admin access
    if (!user || !user.isAdmin) {
        // Redirect to login if not an admin
        // window.location.href = 'login.html'; 
        // return;
    }

    // Display admin name if available
    const adminNameElement = document.getElementById('admin-name');
    if (adminNameElement && user && user.name) {
        adminNameElement.textContent = user.name;
    }
    const searchForm = document.getElementById('search-user-form');
    const fundForm = document.getElementById('fund-account-form');
    const messageDiv = document.getElementById('admin-message');
    const userDetailsCard = document.getElementById('user-details-card');
    const fundModal = document.getElementById('fund-modal');
    const closeModalBtn = document.querySelector('.close-button');
    const showFundModalBtn = document.getElementById('show-fund-modal-btn');

    // Handle user search
    if (searchForm) {
        searchForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const userId = document.getElementById('search-userId').value;
            messageDiv.textContent = '';
            userDetailsCard.style.display = 'none';

            try {
                const response = await fetch(`http://127.0.0.1:5000/api/admin/find_user?userId=${userId}`);
                const data = await response.json();

                if (response.ok) {
                    document.getElementById('user-name').textContent = data.name;
                    document.getElementById('user-id-display').textContent = data.userId;
                    document.getElementById('user-balance').textContent = data.balance.toFixed(2);
                    document.getElementById('fund-userId').value = data.userId;
                    userDetailsCard.style.display = 'block';
                } else {
                    messageDiv.textContent = data.error || 'User not found.';
                    messageDiv.className = 'message error';
                }
            } catch (error) {
                console.error('Search error:', error);
                messageDiv.textContent = 'An error occurred while searching.';
                messageDiv.className = 'message error';
            }
        });
    }

    // Show the funding modal
    if (showFundModalBtn) {
        showFundModalBtn.addEventListener('click', () => {
            fundModal.style.display = 'block';
        });
    }

    // Close the funding modal
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            fundModal.style.display = 'none';
        });
    }

    // Close modal if clicking outside of it
    window.addEventListener('click', (event) => {
        if (event.target == fundModal) {
            fundModal.style.display = 'none';
        }
    });

    // Handle account funding
    if (fundForm) {
        fundForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(fundForm);
            messageDiv.textContent = '';

            try {
                const response = await fetch('http://127.0.0.1:5000/api/admin/fund_account', {
                    method: 'POST',
                    body: formData
                });
                const data = await response.json();

                if (response.ok) {
                    messageDiv.textContent = data.message || 'Account funded successfully!';
                    messageDiv.className = 'message success';
                    document.getElementById('user-balance').textContent = data.new_balance.toFixed(2);
                    fundModal.style.display = 'none'; // Close modal on success
                    document.getElementById('fund-amount').value = '';
                } else {
                    messageDiv.textContent = data.error || 'Failed to fund account.';
                    messageDiv.className = 'message error';
                }
            } catch (error) {
                console.error('Funding error:', error);
                messageDiv.textContent = 'An error occurred while funding the account.';
                messageDiv.className = 'message error';
            }
        });
    }
});
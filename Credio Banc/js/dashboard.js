document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    // DOM Elements
    const userNameEl = document.getElementById('user-name');
    const balanceEl = document.getElementById('balance');
    const userIdEl = document.getElementById('user-id');
    const withdrawalForm = document.getElementById('withdrawal-form');
    const transferForm = document.getElementById('transfer-form');
    const modal = document.getElementById('verification-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const modalLabel = document.getElementById('modal-label');
    const verificationForm = document.getElementById('verification-form');
    const verificationInput = document.getElementById('verification-code');
    const cancelBtn = document.getElementById('cancel-verification');
    const statusMessageEl = document.getElementById('status-message');
    const logoutButton = document.querySelector('.logout-btn');

    // Populate user data
    userNameEl.textContent = user.name;
    balanceEl.textContent = `$${user.balance.toFixed(2)}`;
    userIdEl.textContent = user.userId;

    // State for the transaction
    let transactionDetails = {};
    const verificationCodes = {
        IMF: 'C765890',
        TX: 'T129740',
        UV: 'U164433'
    };
    let currentStep = '';

    const showModal = (step) => {
        currentStep = step;
        const stepDetails = {
            IMF: { title: 'IMF Code Verification', message: 'Please enter your IMF code to proceed.', label: 'IMF Code' },
            TX: { title: 'TX Code Verification', message: 'Amount not credited. Pending TX Code required. Please contact support.', label: 'TX Code' },
            UV: { title: 'UV Code Verification', message: 'Pending UV Code required. Please contact support.', label: 'UV Code' }
        };
        modalTitle.textContent = stepDetails[step].title;
        modalMessage.textContent = stepDetails[step].message;
        modalLabel.textContent = stepDetails[step].label;
        modal.classList.add('active');
    };

    const hideModal = () => {
        modal.classList.remove('active');
        verificationInput.value = '';
    };

    const showStatus = (message, type, duration = 0) => {
        statusMessageEl.textContent = message;
        statusMessageEl.className = `message ${type}`;
        statusMessageEl.style.display = 'block';
        if (duration > 0) {
            setTimeout(() => {
                statusMessageEl.style.display = 'none';
            }, duration);
        }
    };

    const processTransaction = async () => {
        const { amount, type } = transactionDetails;
        const formData = new FormData();
        formData.append('userId', user.userId);
        formData.append('amount', amount);

        try {
            const response = await fetch(`http://127.0.0.1:5000/${type}`, {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (response.ok) {
                user.balance = result.new_balance;
                sessionStorage.setItem('user', JSON.stringify(user));
                balanceEl.textContent = `$${user.balance.toFixed(2)}`;
                showStatus('Transaction successful. Your new balance will be reflected shortly.', 'success', 5000);
            } else {
                showStatus(result.error || 'An error occurred.', 'error', 5000);
            }
        } catch (error) {
            console.error('Transaction Error:', error);
            showStatus('Could not connect to the server.', 'error', 5000);
        }
    };

    if (withdrawalForm) {
        withdrawalForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const amount = parseFloat(document.getElementById('withdraw-amount').value);
            if (user.balance < amount) {
                showStatus('Insufficient funds.', 'error', 5000);
                return;
            }
            transactionDetails = { amount, type: 'withdraw' };
            showModal('IMF');
        });
    }

    if (transferForm) {
        transferForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const amount = parseFloat(document.getElementById('transfer-amount').value);
            if (user.balance < amount) {
                showStatus('Insufficient funds.', 'error', 5000);
                return;
            }
            transactionDetails = { amount, type: 'transfer' };
            showModal('IMF');
        });
    }

    if(cancelBtn) {
        cancelBtn.addEventListener('click', hideModal);
    }

    if (verificationForm) {
        verificationForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const enteredCode = verificationInput.value.trim();

            switch (currentStep) {
                case 'IMF':
                    if (enteredCode === verificationCodes.IMF) {
                        hideModal();
                        showStatus('IMF code verified. Please wait for the next step.', 'success', 2000);
                        setTimeout(() => {
                            showModal('TX');
                        }, 2000); 
                    } else {
                        showStatus('Invalid IMF Code.', 'error', 3000);
                    }
                    break;
                case 'TX':
                    if (enteredCode === verificationCodes.TX) {
                        hideModal();
                        showStatus('TX code verified. Please enter the final verification code.', 'success', 2000);
                        setTimeout(() => {
                            showModal('UV');
                        }, 2000);
                    } else {
                        showStatus('Invalid TX Code.', 'error', 3000);
                    }
                    break;
                case 'UV':
                    if (enteredCode === verificationCodes.UV) {
                        hideModal();
                        showStatus('Withdrawal pending. This may take up to 15 minutes for security verification.', 'processing');
                        
                        // Set a 15-minute timeout before resetting the process
                        setTimeout(() => {
                            showStatus('Transaction timed out. Please restart the verification process.', 'error', 5000);
                            setTimeout(() => showModal('IMF'), 5000); // Show IMF modal after message disappears
                        }, 15 * 60 * 1000); // 15 minutes

                    } else {
                        showStatus('Invalid UV Code.', 'error', 3000);
                    }
                    break;
            }
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            sessionStorage.removeItem('user');
            window.location.href = 'login.html';
        });
    }
});
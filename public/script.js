async function fetchBackend(url, method = 'POST', body = null) {
    try {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' },
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(`/.netlify/functions/${url}`, options); // Updated to use Netlify function paths

        // Handle HTTP errors
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Server Error:', errorText);
            throw new Error(`HTTP Error: ${response.status}`);
        }

        // Attempt to parse JSON response
        try {
            return await response.json();
        } catch (jsonError) {
            console.error('JSON Parse Error:', jsonError);
            throw new Error('Invalid JSON response');
        }
    } catch (error) {
        console.error('Fetch Error:', error.message);
        throw new Error('Network Error: Unable to connect to the server.');
    }
}

// DOM Elements
const authSection = document.getElementById('auth-section');
const loginSection = document.getElementById('login-section');
const gameSection = document.getElementById('game-section');
const signupTab = document.getElementById('signup-tab');
const loginTab = document.getElementById('login-tab');
const leaderboardList = document.getElementById('leaderboard-list');
const chatBox = document.getElementById('chat-box');
const userCoinsDisplay = document.getElementById('user-coins');
const feedbackMessage = document.getElementById('feedback-message');
let currentUser = null;

// Toggle to Sign-Up form
function showSignup() {
    signupTab.classList.add('active-tab');
    loginTab.classList.remove('active-tab');
    authSection.classList.add('active');
    loginSection.classList.add('hidden');
    feedbackMessage.classList.add('hidden'); // Hide feedback message
}

// Toggle to Login form
function showLogin() {
    loginTab.classList.add('active-tab');
    signupTab.classList.remove('active-tab');
    loginSection.classList.remove('hidden');
    authSection.classList.remove('active');
    feedbackMessage.classList.add('hidden'); // Hide feedback message
}

// Sign-Up form submission
document.getElementById('signup-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const username = document.getElementById('signup-username').value;
    const password = document.getElementById('signup-password').value;
    const wallet = document.getElementById('signup-wallet').value;

    try {
        const response = await fetchBackend('signup', 'POST', { username, password, wallet });

        if (response?.success) {
            // Successful signup
            feedbackMessage.textContent = 'Sign-Up Successful!';
            feedbackMessage.classList.remove('hidden', 'error');
            feedbackMessage.classList.add('success');
            showLogin(); // Switch to Login tab
        } else {
            // Backend returned an error
            feedbackMessage.textContent = `Error: ${response?.error || 'An unknown error occurred. Please try again.'}`;
            feedbackMessage.classList.remove('hidden', 'success');
            feedbackMessage.classList.add('error');
        }
    } catch (error) {
        // Handle network or unexpected errors
        feedbackMessage.textContent = 'Network Error. Please check your internet connection and try again.';
        feedbackMessage.classList.remove('hidden', 'success');
        feedbackMessage.classList.add('error');
        console.error('Network Error:', error);
    }
});

// Login form submission
document.getElementById('login-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch('/.netlify/functions/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Server Error:', errorData);
            alert(errorData.error || 'Login failed');
            return;
        }

        const data = await response.json();
        console.log('Login Successful:', data);

        if (data.success) {
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            window.location.href = '/game.html'; // Redirect to game page
        }
    } catch (error) {
        console.error('Login Error:', error.message);
        alert('An unexpected error occurred. Please try again.');
    }
});



// Transition to Game
function transitionToGame() {
    if (!currentUser || !currentUser.username || currentUser.coins === undefined) {
        alert('Invalid user data. Please log in again.');
        return;
    }

    loginSection.classList.add('hidden');
    authSection.classList.add('hidden');
    gameSection.classList.remove('hidden');
    document.getElementById('user-display').textContent = currentUser.username;
    userCoinsDisplay.textContent = currentUser.coins;
    loadLeaderboard();
    loadChat();
}

// Collect Coins
async function collectCoin() {
    if (currentUser) {
        try {
            const response = await fetchBackend('collect', 'POST', { username: currentUser.username });
            if (response.success) {
                currentUser.coins = response.coins;
                userCoinsDisplay.textContent = currentUser.coins;
                loadLeaderboard();
            }
        } catch (error) {
            alert('Error: Unable to collect coins.');
        }
    }
}

// Load Leaderboard
async function loadLeaderboard() {
    try {
        const response = await fetchBackend('leaderboard');
        leaderboardList.innerHTML = response.leaderboard
            .map(user => `<li>${user.username}: ${user.coins} coins</li>`)
            .join('');
    } catch (error) {
        console.error('Error loading leaderboard:', error);
    }
}

// Load Chat
async function loadChat() {
    try {
        const response = await fetchBackend('chat');
        chatBox.innerHTML = response.messages
            .map(msg => `<p><b>${msg.username}:</b> ${msg.message}</p>`)
            .join('');
    } catch (error) {
        console.error('Error loading chat:', error);
    }
}

// Send Chat Message
async function sendMessage() {
    const message = document.getElementById('chat-input').value;
    if (message.trim() && currentUser) {
        try {
            const response = await fetchBackend('chat', 'POST', { username: currentUser.username, message });
            if (response.success) {
                document.getElementById('chat-input').value = '';
                loadChat();
            }
        } catch (error) {
            alert('Error: Unable to send message.');
        }
    }
}

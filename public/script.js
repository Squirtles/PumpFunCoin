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

        const contentType = response.headers.get('Content-Type');

        // Handle JSON responses
        if (contentType && contentType.includes('application/json')) {
            try {
                return await response.json();
            } catch (jsonError) {
                console.error('JSON Parse Error:', jsonError);
                throw new Error('Invalid JSON response');
            }
        }

        // Handle empty response bodies
        const contentLength = response.headers.get('Content-Length');
        if (contentLength === '0' || contentType === null) {
            console.warn('Empty Response Body');
            return {}; // Return an empty object for empty responses
        }

        // Handle unexpected response types (e.g., HTML)
        const rawText = await response.text();
        if (contentType && contentType.includes('text/html')) {
            console.error('HTML Response:', rawText);
            throw new Error('Received an unexpected HTML response.');
        }

        console.warn('Unknown Response Type:', rawText);
        throw new Error('Unexpected response format');
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

        if (response.success) {
            feedbackMessage.textContent = 'Sign-Up Successful!';
            feedbackMessage.classList.remove('hidden');
            feedbackMessage.classList.add('success');
            showLogin(); // Switch to Login tab
        } else {
            feedbackMessage.textContent = `Error: ${response.error || 'Unknown error'}`;
            feedbackMessage.classList.remove('hidden');
            feedbackMessage.classList.add('error');
        }
    } catch (error) {
        feedbackMessage.textContent = 'Network Error. Please try again.';
        feedbackMessage.classList.remove('hidden');
        feedbackMessage.classList.add('error');
        console.error(error);
    }
});

// Login form submission
document.getElementById('login-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetchBackend('login', 'POST', { username, password });

        if (response.success) {
            currentUser = response.user;
            transitionToGame();
        } else {
            feedbackMessage.textContent = response.message || 'Invalid username or password';
            feedbackMessage.classList.remove('hidden');
            feedbackMessage.classList.add('error');
        }
    } catch (error) {
        feedbackMessage.textContent = 'Error: Unable to connect to the server.';
        feedbackMessage.classList.remove('hidden');
        feedbackMessage.classList.add('error');
        console.error('Login Error:', error);
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

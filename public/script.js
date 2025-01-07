async function fetchBackend(endpoint, method = 'GET', body = null) {
    const options = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) options.body = JSON.stringify(body);

    try {
        const response = await fetch(`/.netlify/functions/${endpoint}`, options);

        // Handle non-OK status codes
        if (!response.ok) {
            console.error(`HTTP Error: ${response.status}`);
            throw new Error(`HTTP Error: ${response.status}`);
        }

        // Check if response has content
        const text = await response.text();
        if (!text) {
            console.error('Empty response body');
            throw new Error('Empty response body');
        }

        // Parse JSON response
        return JSON.parse(text);
    } catch (error) {
        console.error('Fetch Backend Error:', error);
        throw error;
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
let currentUser = null;

// Toggle to Sign-Up form
function showSignup() {
    signupTab.classList.add('active-tab');
    loginTab.classList.remove('active-tab');
    authSection.classList.add('active');
    loginSection.classList.add('hidden');
}

// Toggle to Login form
function showLogin() {
    loginTab.classList.add('active-tab');
    signupTab.classList.remove('active-tab');
    loginSection.classList.remove('hidden');
    authSection.classList.remove('active');
}

// Login form submission
document.getElementById('login-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetchBackend('login', 'POST', { username, password });
        if (response.success) {
            alert('Login successful!');
            currentUser = response.user;
            transitionToGame();
        } else {
            alert(response.message || 'Invalid username or password');
        }
    } catch (error) {
        alert('Error: Unable to connect to the server.');
        console.error('Login Error:', error);
    }
});


// Transition to Game
function transitionToGame() {
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

async function fetchBackend(endpoint, method = 'GET', body = null) {
    const options = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) options.body = JSON.stringify(body);
    const response = await fetch(`/.netlify/functions/${endpoint}`, options);
    return response.json();
}

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

// Sign-Up form submission
document.getElementById('signup-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const username = document.getElementById('signup-username').value;
    const password = document.getElementById('signup-password').value;
    const wallet = document.getElementById('signup-wallet').value;

    const response = await fetchBackend('signup', 'POST', { username, password, wallet });
    if (response.success) {
        alert('Sign up successful!');
        currentUser = response.user;
        transitionToGame();
    } else {
        alert(response.error || "An error occurred");
    }
});

// Login form submission
document.getElementById('login-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    const response = await fetchBackend('login', 'POST', { username, password });
    if (response.success) {
        alert('Login successful!');
        currentUser = response.user;
        transitionToGame();
    } else {
        alert(response.error || "Invalid username or password");
    }
});

function transitionToGame() {
    loginSection.classList.add('hidden');
    authSection.classList.add('hidden');
    gameSection.classList.remove('hidden');
    document.getElementById('user-display').textContent = currentUser.username;
    userCoinsDisplay.textContent = currentUser.coins;
    loadLeaderboard();
    loadChat();
}

async function collectCoin() {
    if (currentUser) {
        const response = await fetchBackend('/collect', 'POST', { username: currentUser.username });
        if (response.success) {
            currentUser.coins = response.coins;
            userCoinsDisplay.textContent = currentUser.coins;
            loadLeaderboard();
        }
    }
}

async function loadLeaderboard() {
    const response = await fetchBackend('/leaderboard');
    leaderboardList.innerHTML = response.leaderboard
        .map(user => `<li>${user.username}: ${user.coins} coins</li>`)
        .join('');
}

async function loadChat() {
    const response = await fetchBackend('/chat');
    chatBox.innerHTML = response.messages
        .map(msg => `<p><b>${msg.username}:</b> ${msg.message}</p>`)
        .join('');
}

async function sendMessage() {
    const message = document.getElementById('chat-input').value;
    if (message.trim() && currentUser) {
        const response = await fetchBackend('/chat', 'POST', { username: currentUser.username, message });
        if (response.success) {
            document.getElementById('chat-input').value = '';
            loadChat();
        }
    }
}

async function fetchBackend(endpoint, method = 'GET', body = null) {
    const options = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) options.body = JSON.stringify(body);
    const response = await fetch(endpoint, options);
    return response.json();
}

const authSection = document.getElementById('auth-section');
const gameSection = document.getElementById('game-section');
const leaderboardList = document.getElementById('leaderboard-list');
const chatBox = document.getElementById('chat-box');
const userCoinsDisplay = document.getElementById('user-coins');
let currentUser = null;

document.getElementById('signup-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const wallet = document.getElementById('wallet').value;
    const response = await fetchBackend('/signup', 'POST', { username, password, wallet });
    if (response.success) {
        alert('Sign up successful!');
        currentUser = response.user;
        transitionToGame();
    } else {
        alert(response.message);
    }
});

function transitionToGame() {
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

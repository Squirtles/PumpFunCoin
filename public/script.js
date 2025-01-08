async function fetchBackend(url, method = 'POST', body = null) {
    try {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' },
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(/api/${url}, options);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Server Error:', errorText);
            throw new Error(HTTP Error: ${response.status});
        }

        const contentType = response.headers.get('Content-Type');
        if (contentType && contentType.includes('application/json')) {
            const rawText = await response.text(); // First, get the raw text.
            console.log('Raw Response Text:', rawText); // Log raw response
            return rawText ? JSON.parse(rawText) : {}; // Parse only if there's content.
        } else {
            const text = await response.text();
            console.warn('Non-JSON Response:', text);
            throw new Error('Expected JSON, but received non-JSON response');
        }
    } catch (error) {
        console.error('Fetch Error:', error.message);
        throw new Error('Network Error: Unable to connect to the server.');
    }
}


// Example usage in an event listener
document.querySelector('form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = {
        username: event.target.username.value,
        password: event.target.password.value,
    };

    try {
        const result = await fetchBackend('login', 'POST', formData); // Added endpoint parameter
        console.log('Login Success:', result);
    } catch (error) {
        console.error('Login Failed:', error.message);
        // Display user-friendly error message
        alert('Login failed. Please check your credentials and try again.');
    }
});

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
        console.log('Server Response:', response);

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

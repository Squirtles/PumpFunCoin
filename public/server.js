const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json());

const DATA_FILE = './data.json';

const readData = () => JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
const writeData = (data) => fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

// Signup endpoint
app.post('/signup', (req, res) => {
    const { username, password, wallet } = req.body;
    const data = readData();

    if (data.users[username]) {
        return res.json({ success: false, message: 'Username already exists!' });
    }

    data.users[username] = { username, password, wallet, coins: 0 };
    writeData(data);
    res.json({ success: true, user: data.users[username] });
});

// Collect coins endpoint
app.post('/collect', (req, res) => {
    const { username } = req.body;
    const data = readData();

    if (data.users[username]) {
        data.users[username].coins++;
        writeData(data);
        return res.json({ success: true, coins: data.users[username].coins });
    }

    res.json({ success: false, message: 'User not found!' });
});

// Leaderboard endpoint
app.get('/leaderboard', (req, res) => {
    const data = readData();
    const leaderboard = Object.values(data.users).sort((a, b) => b.coins - a.coins);
    res.json({ leaderboard });
});

// Chat endpoints
app.get('/chat', (req, res) => {
    const data = readData();
    res.json({ messages: data.chat });
});

app.post('/chat', (req, res) => {
    const { username, message } = req.body;
    const data = readData();

    data.chat.push({ username, message });
    writeData(data);
    res.json({ success: true });
});

// Start server
app.listen(3000, () => console.log('Server running on http://localhost:3000'));

// Initialize data file if not exists
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ users: {}, chat: [] }, null, 2));
}

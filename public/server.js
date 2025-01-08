require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();

app.use(bodyParser.json());

// GitHub API configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = 'YourGitHubUsername';
const REPO_NAME = 'YourRepositoryName';
const FILE_PATH = 'data.json';
const BRANCH = 'main';

// Helper function to fetch data.json from GitHub
const fetchDataFromGitHub = async () => {
    try {
        const response = await fetch(
            `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}?ref=${BRANCH}`,
            {
                headers: { Authorization: `token ${GITHUB_TOKEN}` },
            }
        );

        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.statusText}`);
        }

        const fileData = await response.json();
        const content = Buffer.from(fileData.content, 'base64').toString();
        return { data: JSON.parse(content), sha: fileData.sha };
    } catch (error) {
        console.error('Failed to fetch data from GitHub:', error.message);
        throw error;
    }
};

// Helper function to write data.json to GitHub
const writeDataToGitHub = async (newData, sha) => {
    try {
        const encodedContent = Buffer.from(JSON.stringify(newData, null, 2)).toString('base64');

        const response = await fetch(
            `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`,
            {
                method: 'PUT',
                headers: {
                    Authorization: `token ${GITHUB_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: 'Update data.json',
                    content: encodedContent,
                    sha,
                    branch: BRANCH,
                }),
            }
        );

        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.statusText}`);
        }

        return response.json();
    } catch (error) {
        console.error('Failed to write data to GitHub:', error.message);
        throw error;
    }
};

// Example: Signup endpoint
app.post('/signup', async (req, res) => {
    const { username, password, wallet } = req.body;
    if (!username || !password || !wallet) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    try {
        const { data, sha } = await fetchDataFromGitHub();

        if (data.users[username]) {
            return res.status(409).json({ success: false, message: 'Username already exists!' });
        }

        data.users[username] = { username, password, wallet, coins: 0 };
        await writeDataToGitHub(data, sha);

        res.json({ success: true, user: data.users[username] });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error." });
    }
});

// Collect coins endpoint
app.post('/collect', async (req, res) => {
    try {
        const { username } = req.body;
        const { data, sha } = await fetchDataFromGitHub();

        if (data.users[username]) {
            data.users[username].coins++;
            await writeDataToGitHub(data, sha);
            return res.json({ success: true, coins: data.users[username].coins });
        }

        res.json({ success: false, message: 'User not found!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Leaderboard endpoint
app.get('/leaderboard', async (req, res) => {
    try {
        const { data } = await fetchDataFromGitHub();
        const leaderboard = Object.values(data.users).sort((a, b) => b.coins - a.coins);
        res.json({ leaderboard });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Chat endpoints
app.get('/chat', async (req, res) => {
    try {
        const { data } = await fetchDataFromGitHub();
        res.json({ messages: data.chat });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/chat', async (req, res) => {
    try {
        const { username, message } = req.body;
        const { data, sha } = await fetchDataFromGitHub();

        data.chat.push({ username, message });
        await writeDataToGitHub(data, sha);

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Pop-up message endpoint
app.get('/popup', async (req, res) => {
    try {
        const { data } = await fetchDataFromGitHub();
        const popupMessage = data.popupMessage || "Welcome to Pumpfun Coin! Enjoy the game!";
        res.json({ success: true, message: popupMessage });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint to update pop-up message (admin functionality)
app.post('/popup', async (req, res) => {
    try {
        const { message } = req.body;
        const { data, sha } = await fetchDataFromGitHub();

        data.popupMessage = message;
        await writeDataToGitHub(data, sha);

        res.json({ success: true, message: "Pop-up message updated successfully." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start server
app.listen(3000, () => console.log('Server running on http://localhost:3000'));


// Initialize data file if not exists
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ users: {}, chat: [], popupMessage: "Welcome to Pumpfun Coin!" }, null, 2));
}


const fetch = require('node-fetch');

exports.handler = async (event) => {
    try {
        if (event.httpMethod !== 'POST') {
            return {
                statusCode: 405,
                body: JSON.stringify({ error: 'Method Not Allowed' }),
            };
        }

        const { username } = JSON.parse(event.body);

        if (!username) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing username' }),
            };
        }

        // GitHub API Configuration
        const repoOwner = 'Squirtles';
        const repoName = 'PumpFunCoin';
        const filePath = 'public/data.json';
        const branch = 'main';
        const token = process.env.GITHUB_TOKEN;

        // Fetch the data.json file from GitHub
        const fileResponse = await fetch(
            `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}?ref=${branch}`,
            {
                headers: {
                    Authorization: `token ${token}`,
                },
            }
        );

        if (!fileResponse.ok) {
            return {
                statusCode: fileResponse.status,
                body: JSON.stringify({ error: 'Failed to fetch data.json' }),
            };
        }

        const fileData = await fileResponse.json();
        const decodedContent = Buffer.from(fileData.content, 'base64').toString();
        const jsonContent = JSON.parse(decodedContent);

        // Update user's coins
        if (!jsonContent.users[username]) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'User not found' }),
            };
        }

        const user = jsonContent.users[username];
        user.coins += 1; // Increment coins by 1 for the user

        // Update the JSON file on GitHub
        const updatedContent = Buffer.from(JSON.stringify(jsonContent, null, 2)).toString('base64');
        const updateResponse = await fetch(
            `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`,
            {
                method: 'PUT',
                headers: {
                    Authorization: `token ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: `Update coins for ${username}`,
                    content: updatedContent,
                    sha: fileData.sha,
                    branch,
                }),
            }
        );

        if (!updateResponse.ok) {
            return {
                statusCode: updateResponse.status,
                body: JSON.stringify({ error: 'Failed to update data.json' }),
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, coins: user.coins }),
        };
    } catch (error) {
        console.error('Error in coin collection:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error' }),
        };
    }
};

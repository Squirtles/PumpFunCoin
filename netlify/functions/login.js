const fs = require('fs').promises;
const path = require('path');

exports.handler = async (event) => {
    try {
        if (event.httpMethod !== 'POST') {
            return {
                statusCode: 405,
                body: JSON.stringify({ success: false, error: 'Method Not Allowed' }),
            };
        }

        // Parse the request body
        let parsedBody;
        try {
            parsedBody = JSON.parse(event.body);
        } catch (parseError) {
            console.error('Body Parsing Error:', parseError);
            return {
                statusCode: 400,
                body: JSON.stringify({ success: false, error: 'Invalid JSON body' }),
            };
        }

        const { username, password } = parsedBody;

        if (!username || !password) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    success: false,
                    error: 'Username and password are required.',
                }),
            };
        }

        // Load all JSON files from the "data" directory
        const directoryPath = path.join(__dirname, 'data');
        const files = await fs.readdir(directoryPath);

        let user = null;

        for (const file of files) {
            const filePath = path.join(directoryPath, file);
            const fileContents = await fs.readFile(filePath, 'utf8');
            const data = JSON.parse(fileContents);

            if (data.users && data.users[username]) {
                user = data.users[username];
                break;
            }
        }

        if (!user || user.password !== password) {
            return {
                statusCode: 401,
                body: JSON.stringify({
                    success: false,
                    error: 'Invalid username or password.',
                }),
            };
        }

        // Successful response
        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                message: 'Login successful.',
                user: {
                    username: user.username,
                    coins: user.coins,
                    wallet: user.wallet,
                },
            }),
        };
    } catch (error) {
        console.error('Unexpected Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                error: 'Internal Server Error',
                details: error.message,
            }),
        };
    }
};

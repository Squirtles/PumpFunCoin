const fs = require('fs').promises;
const path = require('path');

exports.handler = async (event) => {
    try {
        // Allow only POST requests
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

        // Validate required fields
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
        let user = null;

        try {
            const files = await fs.readdir(directoryPath);

            // Check user data in each file
            for (const file of files) {
                if (path.extname(file) !== '.json') continue; // Skip non-JSON files
                const filePath = path.join(directoryPath, file);

                try {
                    const fileContents = await fs.readFile(filePath, 'utf8');
                    const data = JSON.parse(fileContents);

                    if (data.users && data.users[username]) {
                        user = data.users[username];
                        break;
                    }
                } catch (fileError) {
                    console.error(`Error reading or parsing file: ${filePath}`, fileError);
                }
            }
        } catch (dirError) {
            console.error('Error reading data directory:', dirError);
            return {
                statusCode: 500,
                body: JSON.stringify({
                    success: false,
                    error: 'Error accessing user data.',
                }),
            };
        }

        // Check if user exists and the password matches
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

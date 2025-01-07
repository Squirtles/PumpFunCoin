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

        if (!username || !password) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    success: false,
                    error: 'Username and password are required.',
                }),
            };
        }

        // Simulate a user database
        const users = {
            john_doe: { username: 'john_doe', password: 'securepassword', coins: 10 },
        };

        // Find user
        const user = users[username];
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
                    coins: user.coins, // Do not include sensitive data like password
                },
            }),
        };
    } catch (error) {
        // Catch-all error handling
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

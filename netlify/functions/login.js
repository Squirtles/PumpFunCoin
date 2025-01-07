exports.handler = async (event) => {
    try {
        if (event.httpMethod !== 'POST') {
            return {
                statusCode: 405,
                body: JSON.stringify({ success: false, error: 'Method Not Allowed' }),
            };
        }

        const parsedBody = JSON.parse(event.body); // Parse incoming JSON body
        const { username, password } = parsedBody;

        if (!username || !password) {
            return {
                statusCode: 400,
                body: JSON.stringify({ success: false, error: 'Username and password are required.' }),
            };
        }

        // Your hardcoded user data
        const data = {
            users: {
                john_doe: {
                    username: 'john_doe',
                    password: 'securepassword',
                    wallet: '0x12345',
                    coins: 10,
                },
            },
        };

        // Access the user by username
        const user = data.users[username];

        if (!user || user.password !== password) {
            return {
                statusCode: 401,
                body: JSON.stringify({ success: false, error: 'Invalid username or password.' }),
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
                    wallet: user.wallet, // Include wallet if needed
                },
            }),
        };
    } catch (error) {
        console.error('Unexpected Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, error: 'Internal Server Error', details: error.message }),
        };
    }
};

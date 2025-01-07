exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' }),
        };
    }

    try {
        const { username, password } = JSON.parse(event.body);

        // Simulate user data
        const users = {
            john_doe: { username: 'john_doe', password: 'securepassword', coins: 10 },
        };

        const user = users[username];
        if (!user || user.password !== password) {
            return {
                statusCode: 401,
                body: JSON.stringify({ success: false, message: 'Invalid username or password' }),
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, user }),
        };
    } catch (error) {
        console.error('Login Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};


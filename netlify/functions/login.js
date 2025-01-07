exports.handler = async (event) => {
    console.log('Request Received:', event);

    if (event.httpMethod !== 'POST') {
        console.log('Invalid HTTP Method');
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' }),
        };
    }

    try {
        const { username, password } = JSON.parse(event.body);
        console.log('Parsed Request Body:', { username, password });

        // Simulated user data
        const users = {
            john_doe: { username: 'john_doe', password: 'securepassword', coins: 10 },
        };

        const user = users[username];
        if (!user || user.password !== password) {
            console.log('Invalid Credentials');
            return {
                statusCode: 401,
                body: JSON.stringify({ success: false, message: 'Invalid username or password' }),
            };
        }

        console.log('Login Successful:', user);
        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, user }),
        };
    } catch (error) {
        console.error('Error Handling Request:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};


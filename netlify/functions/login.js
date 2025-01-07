exports.handler = async (event) => {
    try {
        // Only allow POST method
        if (event.httpMethod !== 'POST') {
            return {
                statusCode: 405,
                body: JSON.stringify({ error: 'Method Not Allowed' }),
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
                body: JSON.stringify({ error: 'Invalid JSON body' }),
            };
        }

        const { username, password } = parsedBody;

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

        // Successful response
        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, user }),
        };
    } catch (error) {
        // General error handling
        console.error('Unexpected Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error', details: error.message }),
        };
    }
};

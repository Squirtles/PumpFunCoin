const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', '..', 'data.json');

exports.handler = async (event) => {
    try {
        // Ensure the request method is POST
        if (event.httpMethod !== 'POST') {
            return {
                statusCode: 405,
                body: JSON.stringify({ success: false, message: 'Method Not Allowed' }),
            };
        }

        // Parse the request body
        const { username } = JSON.parse(event.body);

        if (!username) {
            return {
                statusCode: 400,
                body: JSON.stringify({ success: false, message: 'Missing username' }),
            };
        }

        // Read and parse the data file
        const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

        // Check if the user exists
        if (!data.users[username]) {
            return {
                statusCode: 404,
                body: JSON.stringify({ success: false, message: 'User not found' }),
            };
        }

        // Increment the user's coins
        data.users[username].coins++;

        // Write the updated data back to the file
        fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                coins: data.users[username].coins,
            }),
        };
    } catch (error) {
        console.error('Error in collect.js:', error);

        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, message: 'Internal Server Error' }),
        };
    }
};

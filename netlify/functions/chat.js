const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', '..', 'data.json');

exports.handler = async (event) => {
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

    if (event.httpMethod === 'GET') {
        return {
            statusCode: 200,
            body: JSON.stringify({ messages: data.chat }),
        };
    } else if (event.httpMethod === 'POST') {
        const { username, message } = JSON.parse(event.body);
        data.chat.push({ username, message });
        fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
        return {
            statusCode: 200,
            body: JSON.stringify({ success: true }),
        };
    }

    return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: 'Invalid request' }),
    };
};

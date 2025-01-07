const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', '..', 'data.json');

exports.handler = async (event) => {
    const { username } = JSON.parse(event.body);
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

    if (data.users[username]) {
        data.users[username].coins++;
        fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, coins: data.users[username].coins }),
        };
    }

    return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: 'User not found!' }),
    };
};

const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', '..', 'data.json');

exports.handler = async (event) => {
    const { username, password, wallet } = JSON.parse(event.body);
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

    if (data.users[username]) {
        return {
            statusCode: 400,
            body: JSON.stringify({ success: false, message: 'Username already exists!' }),
        };
    }

    data.users[username] = { username, password, wallet, coins: 0 };
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

    return {
        statusCode: 200,
        body: JSON.stringify({ success: true, user: data.users[username] }),
    };
};

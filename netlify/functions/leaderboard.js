const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', '..', 'data.json');

exports.handler = async () => {
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    const leaderboard = Object.values(data.users).sort((a, b) => b.coins - a.coins);

    return {
        statusCode: 200,
        body: JSON.stringify({ leaderboard }),
    };
};

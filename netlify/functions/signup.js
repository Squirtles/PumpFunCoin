const fetch = require("node-fetch");

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: "Method Not Allowed" }),
        };
    }

    const { username, password, wallet } = JSON.parse(event.body);

    if (!username || !password || !wallet) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Missing required fields" }),
        };
    }

    // GitHub API Configuration
    const repoOwner = "Squirtles";
    const repoName = "PumpFunCoin";
    const filePath = "public/data.json"; // Path to the JSON file in your repo
    const branch = "main"; // Branch to edit
    const token = process.env.GITHUB_TOKEN; // Store your GitHub token in Netlify environment variables

    // Step 1: Fetch the data.json file from GitHub
    const fileResponse = await fetch(
        `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}?ref=${branch}`,
        {
            headers: {
                Authorization: `token ${token}`,
            },
        }
    );

    if (!fileResponse.ok) {
        return {
            statusCode: fileResponse.status,
            body: JSON.stringify({ error: "Failed to fetch data.json" }),
        };
    }

    const fileData = await fileResponse.json();
    const decodedContent = Buffer.from(fileData.content, "base64").toString();
    const jsonContent = JSON.parse(decodedContent);

    // Step 2: Modify the JSON data
    if (jsonContent.users[username]) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Username already exists" }),
        };
    }

    jsonContent.users[username] = { username, password, wallet, coins: 0 };

    // Step 3: Update the file on GitHub
    const updatedContent = Buffer.from(JSON.stringify(jsonContent, null, 2)).toString("base64");
    const updateResponse = await fetch(
        `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`,
        {
            method: "PUT",
            headers: {
                Authorization: `token ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                message: `Add new user: ${username}`,
                content: updatedContent,
                sha: fileData.sha, // Required for updating the file
                branch,
            }),
        }
    );

    if (!updateResponse.ok) {
        return {
            statusCode: updateResponse.status,
            body: JSON.stringify({ error: "Failed to update data.json" }),
        };
    }

    return {
        statusCode: 200,
        body: JSON.stringify({ success: true, user: jsonContent.users[username] }),
    };
};

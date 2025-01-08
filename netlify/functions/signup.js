const fetch = require("node-fetch");

exports.handler = async (event) => {
    try {
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
        const filePath = "public/data.json";
        const branch = "main";
        const token = process.env.GITHUB_TOKEN;

        // Step 1: Fetch the data.json file
        const fileResponse = await fetch(
            `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}?ref=${branch}`,
            {
                headers: { Authorization: `token ${token}` },
            }
        );

        if (!fileResponse.ok) {
            console.error("Error fetching file:", await fileResponse.text());
            return {
                statusCode: 500,
                body: JSON.stringify({ error: "Failed to fetch data.json" }),
            };
        }

        const fileData = await fileResponse.json();
        const decodedContent = Buffer.from(fileData.content, "base64").toString();
        const jsonContent = JSON.parse(decodedContent);

        // Step 2: Check if the user already exists
        if (jsonContent.users[username]) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Username already exists" }),
            };
        }

        // Step 3: Add the new user with coins initialized to 0
        jsonContent.users[username] = { 
            username, 
            password, 
            wallet, 
            coins: 0 
        };

        // Step 4: Update the file on GitHub
        const updatedContent = Buffer.from(
            JSON.stringify(jsonContent, null, 2)
        ).toString("base64");

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
            console.error("Error updating file:", await updateResponse.text());
            return {
                statusCode: 500,
                body: JSON.stringify({ error: "Failed to update data.json" }),
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, user: jsonContent.users[username] }),
        };
    } catch (err) {
        console.error("Unexpected error:", err);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Unexpected server error" }),
        };
    }
};


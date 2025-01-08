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
        let fileData;
        try {
            const fileResponse = await fetch(
                `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}?ref=${branch}`,
                {
                    headers: { Authorization: `token ${token}` },
                }
            );

            if (!fileResponse.ok) {
                throw new Error(`Failed to fetch data.json: ${fileResponse.status}`);
            }

            fileData = await fileResponse.json();
        } catch (err) {
            console.error("Error fetching file:", err);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: "Server error while fetching data.json" }),
            };
        }

        // Step 2: Decode and modify JSON content
        let jsonContent;
        try {
            const decodedContent = Buffer.from(fileData.content, "base64").toString();
            jsonContent = JSON.parse(decodedContent);

            if (jsonContent.users[username]) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: "Username already exists" }),
                };
            }

            jsonContent.users[username] = { username, password, wallet, coins: 0 };
        } catch (err) {
            console.error("Error processing JSON content:", err);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: "Server error while processing user data" }),
            };
        }

        // Step 3: Update the file on GitHub
        try {
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
                        sha: fileData.sha,
                        branch,
                    }),
                }
            );

            if (!updateResponse.ok) {
                throw new Error(`Failed to update data.json: ${updateResponse.status}`);
            }
        } catch (err) {
            console.error("Error updating file:", err);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: "Server error while updating data.json" }),
            };
        }

        // Return success response
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

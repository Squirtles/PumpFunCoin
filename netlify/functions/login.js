exports.handler = async (event) => {
    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: "Method Not Allowed" }),
        };
    }

    try {
        // Parse the request body
        const requestBody = JSON.parse(event.body);

        // If the request contains login data (username and password)
        if (requestBody.username && requestBody.password) {
            const { username, password } = requestBody;

            // Validate required fields
            if (!username || !password) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: "Username and password are required" }),
                };
            }

            // Simulate user authentication (replace with real database/auth logic)
            if (username === "Squirtles" && password === "password123") {
                const user = { username, coins: 100 }; // Example user data
                return {
                    statusCode: 200,
                    body: JSON.stringify({ success: true, user }),
                };
            } else {
                return {
                    statusCode: 401,
                    body: JSON.stringify({ error: "Invalid username or password" }),
                };
            }
        }

        // If the request contains GitHub file update data (filePath and newContent)
        const { filePath, newContent } = requestBody;
        if (!filePath || !newContent) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "File path and new content are required" }),
            };
        }

        // Dynamically import `node-fetch`
        const fetch = (...args) =>
            import("node-fetch").then(({ default: fetch }) => fetch(...args));

        // GitHub repository configuration
        const repoOwner = "Squirtles";
        const repoName = "PumpFunCoin";
        const branch = "main";
        const token = process.env.GITHUB_TOKEN;

        if (!token) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: "GitHub token is not set in environment variables" }),
            };
        }

        // Step 1: Fetch the current file metadata
        const fileResponse = await fetch(
            `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}?ref=${branch}`,
            {
                headers: { Authorization: `token ${token}` },
            }
        );

        if (!fileResponse.ok) {
            const errorText = await fileResponse.text();
            throw new Error(`Failed to fetch file metadata: ${errorText}`);
        }

        const fileData = await fileResponse.json();
        const fileSha = fileData.sha;

        // Step 2: Encode new content to Base64
        const encodedContent = Buffer.from(JSON.stringify(newContent, null, 2)).toString("base64");

        // Step 3: Update the file
        const updateResponse = await fetch(
            `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`,
            {
                method: "PUT",
                headers: {
                    Authorization: `token ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    message: `Update ${filePath} via Netlify Function`,
                    content: encodedContent,
                    sha: fileSha,
                    branch,
                }),
            }
        );

        if (!updateResponse.ok) {
            const errorText = await updateResponse.text();
            throw new Error(`Failed to update file: ${errorText}`);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, message: `${filePath} updated successfully!` }),
        };
    } catch (error) {
        console.error("Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};


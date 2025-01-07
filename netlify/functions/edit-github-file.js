const fetch = require("node-fetch");

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: "Method Not Allowed" }),
        };
    }

    const { newData } = JSON.parse(event.body);

    // GitHub repository configuration
    const repoOwner = "YourGitHubUsername";
    const repoName = "YourRepositoryName";
    const filePath = "public/data.json"; // Path to the file in your repository
    const branch = "main"; // Branch to edit
    const token = process.env.GITHUB_TOKEN;

    try {
        // Step 1: Fetch the current file content from GitHub
        const fileResponse = await fetch(
            `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}?ref=${branch}`,
            {
                headers: {
                    Authorization: `token ${token}`,
                },
            }
        );

        if (!fileResponse.ok) {
            throw new Error("Failed to fetch the file from GitHub");
        }

        const fileData = await fileResponse.json();
        const decodedContent = Buffer.from(fileData.content, "base64").toString();
        const jsonContent = JSON.parse(decodedContent);

        // Step 2: Update the file content
        jsonContent.updatedData = newData;

        // Step 3: Push the updated file back to GitHub
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
                    message: "Update data.json via Netlify Function",
                    content: updatedContent,
                    sha: fileData.sha, // Required for updating the file
                    branch,
                }),
            }
        );

        if (!updateResponse.ok) {
            throw new Error("Failed to update the file on GitHub");
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};

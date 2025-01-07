const fetch = require('node-fetch');

exports.handler = async (event) => {
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' }),
        };
    }

    // GitHub repository configuration
    const repoOwner = 'YourGitHubUsername';
    const repoName = 'YourRepositoryName';
    const filePath = 'path/to/your/data.json'; // Example: 'public/data.json'
    const branch = 'main'; // Branch to fetch from
    const token = process.env.GITHUB_TOKEN; // Securely access the token

    try {
        // Fetch file content from GitHub
        const response = await fetch(
            `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}?ref=${branch}`,
            {
                headers: {
                    Authorization: `token ${token}`,
                },
            }
        );

        if (!response.ok) {
            throw new Error('Failed to fetch file from GitHub');
        }

        const fileData = await response.json();
        const fileContent = Buffer.from(fileData.content, 'base64').toString();

        return {
            statusCode: 200,
            body: fileContent, // Return the file content
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};

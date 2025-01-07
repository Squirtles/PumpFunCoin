const fetch = require('node-fetch');

exports.handler = async (event) => {
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' }),
        };
    }

    const { filePath } = event.queryStringParameters || {};

    if (!filePath) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'File path is required' }),
        };
    }

    // GitHub repository configuration
    const repoOwner = 'YourGitHubUsername';
    const repoName = 'YourRepositoryName';
    const branch = 'main';
    const token = process.env.GITHUB_TOKEN;

    try {
        // Fetch the file content from GitHub
        const response = await fetch(
            `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}?ref=${branch}`,
            {
                headers: {
                    Authorization: `token ${token}`,
                },
            }
        );

        if (!response.ok) {
            throw new Error('Failed to fetch the file from GitHub');
        }

        const fileData = await response.json();
        const decodedContent = Buffer.from(fileData.content, 'base64').toString();

        return {
            statusCode: 200,
            body: decodedContent,
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};

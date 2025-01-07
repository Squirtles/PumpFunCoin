const fetch = require('node-fetch');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' }),
        };
    }

    const { filePath, newContent } = JSON.parse(event.body);

    // GitHub repository configuration
    const repoOwner = 'YourGitHubUsername';
    const repoName = 'YourRepositoryName';
    const branch = 'main';
    const token = process.env.GITHUB_TOKEN; // Securely access the GitHub token

    try {
        // Step 1: Fetch the current file metadata from GitHub
        const fileResponse = await fetch(
            `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}?ref=${branch}`,
            {
                headers: {
                    Authorization: `token ${token}`,
                },
            }
        );

        if (!fileResponse.ok) {
            throw new Error('Failed to fetch the file from GitHub');
        }

        const fileData = await fileResponse.json();
        const fileSha = fileData.sha; // Required for updating files

        // Step 2: Encode the new content to Base64
        const encodedContent = Buffer.from(JSON.stringify(newContent, null, 2)).toString('base64');

        // Step 3: Update the file on GitHub
        const updateResponse = await fetch(
            `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`,
            {
                method: 'PUT',
                headers: {
                    Authorization: `token ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: `Update ${filePath} via Netlify Function`,
                    content: encodedContent,
                    sha: fileSha, // Include the SHA of the file to be updated
                    branch,
                }),
            }
        );

        if (!updateResponse.ok) {
            throw new Error('Failed to update the file on GitHub');
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, message: `${filePath} updated successfully!` }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};

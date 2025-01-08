const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');

exports.handler = async (event) => {
    // Allow only POST requests
    if (event.httpMethod !== "POST") {
        console.warn("Invalid HTTP Method:", event.httpMethod);
        return {
            statusCode: 405,
            body: JSON.stringify({ error: "Method Not Allowed" }),
        };
    }

    // Check required environment variables
    const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
    for (const key of requiredEnvVars) {
        if (!process.env[key]) {
            console.error(`Missing environment variable: ${key}`);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: "Server configuration error. Please try again later." }),
            };
        }
    }

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    try {
        const { username, password } = JSON.parse(event.body);

        // Validate input
        if (!username || !password) {
            console.warn("Missing username or password");
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Username and password are required" }),
            };
        }

        // Fetch user from database
        const { data: user, error: fetchError } = await supabase
            .from('users')
            .select('id, username, password, created_at') // Select only necessary fields
            .eq('username', username)
            .single();

        if (fetchError || !user) {
            console.warn("User not found or database error:", fetchError);
            return {
                statusCode: 401,
                body: JSON.stringify({ error: "Invalid username or password" }),
            };
        }

        // Compare hashed password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            console.warn("Invalid password for user:", username);
            return {
                statusCode: 401,
                body: JSON.stringify({ error: "Invalid username or password" }),
            };
        }

        // Remove sensitive data before responding
        delete user.password;

        // Return success response
        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                user: {
                    id: user.id,
                    username: user.username,
                    created_at: user.created_at,
                },
            }),
        };
    } catch (error) {
        console.error("Unexpected error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "An unexpected error occurred." }),
        };
    }
};

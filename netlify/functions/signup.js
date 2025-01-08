const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');

exports.handler = async (event) => {
    // Early exit for non-POST requests
    if (event.httpMethod !== "POST") {
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
        const body = JSON.parse(event.body);

        // Validate required fields
        if (!body.username || !body.password || !body.wallet) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Username, password, and wallet are required" }),
            };
        }

        const { username, password, wallet } = body;

        // Validate username
        if (!/^[a-zA-Z0-9_]{3,}$/.test(username)) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Username must be at least 3 characters long and contain only alphanumeric characters or underscores." }),
            };
        }

        // Validate password length
        if (password.length < 8) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Password must be at least 8 characters long." }),
            };
        }

        // Validate wallet (example regex for Ethereum wallets)
        if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Invalid wallet address." }),
            };
        }

        // Check if the username already exists
        const { data: existingUser, error: fetchError } = await supabase
            .from('users')
            .select('username')
            .eq('username', username)
            .maybeSingle();

        if (fetchError) {
            console.error("Supabase Fetch Error:", fetchError);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: "Failed to check existing users. Please try again later." }),
            };
        }

        if (existingUser) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Username already exists" }),
            };
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user into Supabase
        const { data, error: insertError } = await supabase.from('users').insert([
            {
                username,
                password: hashedPassword,
                wallet,
                coins: 100, // Default coins
            },
        ]);

        if (insertError || !data || data.length === 0) {
            console.error("Supabase Insert Error:", insertError);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: "Failed to create user. Please try again later." }),
            };
        }

        // Success response
        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, user: { id: data[0].id, username: data[0].username, wallet: data[0].wallet } }),
        };
    } catch (error) {
        console.error("Signup Error:", error.message, error.stack);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "An unexpected error occurred." }),
        };
    }
};

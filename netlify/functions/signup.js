const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: "Method Not Allowed" }),
        };
    }

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

    try {
        const body = JSON.parse(event.body);

        // Check if this is a signup request
        if (body.username && body.password && body.wallet) {
            const { username, password, wallet } = body;

            // Validate required fields for signup
            if (!username || !password || !wallet) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: "Username, password, and wallet are required" }),
                };
            }

            // Check if the username already exists
            const { data: existingUser, error: fetchError } = await supabase
                .from('users')
                .select('username')
                .eq('username', username)
                .single();

            if (fetchError && fetchError.details !== 'Row not found') {
                console.error("Supabase Fetch Error:", fetchError);
                return {
                    statusCode: 500,
                    body: JSON.stringify({ error: "Failed to check existing users" }),
                };
            }

            if (existingUser) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: "Username already exists" }),
                };
            }

            // Insert new user into Supabase
            const { data, error } = await supabase.from('users').insert([
                {
                    username,
                    password, // In production, hash this using bcrypt
                    wallet,
                    coins: 100, // Initialize with some default coins
                },
            ]);

            if (error) {
                console.error("Supabase Insert Error:", error);
                return {
                    statusCode: 500,
                    body: JSON.stringify({ error: "Failed to create user" }),
                };
            }

            return {
                statusCode: 200,
                body: JSON.stringify({ success: true, user: data[0] }),
            };
        }

        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Invalid request format" }),
        };
    } catch (error) {
        console.error("Signup Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};


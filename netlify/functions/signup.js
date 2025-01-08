const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
    // Check for POST method
    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: "Method Not Allowed" }),
        };
    }

    // Initialize Supabase client
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

    try {
        const body = JSON.parse(event.body);

        // Validate request body
        if (!body.username || !body.password || !body.wallet) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Username, password, and wallet are required" }),
            };
        }

        const { username, password, wallet } = body;

        // Check if the username already exists
        const { data: existingUser, error: fetchError } = await supabase
            .from('users')
            .select('username')
            .eq('username', username)
            .maybeSingle(); // Handles cases where no rows are returned

        if (fetchError) {
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
        const { data, error: insertError } = await supabase.from('users').insert([
            {
                username,
                password, // TODO: Hash password before saving (e.g., bcrypt)
                wallet,
                coins: 100, // Initialize with default coins
            },
        ]);

        if (insertError || !data || data.length === 0) {
            console.error("Supabase Insert Error:", insertError || "No data returned from insert");
            return {
                statusCode: 500,
                body: JSON.stringify({ error: "Failed to create user" }),
            };
        }

        // Success response
        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, user: data[0] }),
        };

    } catch (error) {
        console.error("Signup Error:", error.message, error.stack);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "An unexpected error occurred." }),
        };
    }
};

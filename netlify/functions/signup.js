const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: "Method Not Allowed" }),
        };
    }

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
        console.error("Missing Supabase configuration");
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Server configuration error. Please try again later." }),
        };
    }

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

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

        // Input validation
        if (username.length < 3 || password.length < 8) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Username must be at least 3 characters and password at least 8 characters long." }),
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
                body: JSON.stringify({
                    error: "Failed to check existing users",
                    details: fetchError.message || "No additional details provided",
                }),
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
                password: hashedPassword, // Store hashed password
                wallet,
                coins: 100, // Default coins
            },
        ]);

        // Log insert response for debugging
        console.log("Insert Response Data:", data);

        if (insertError || !data || data.length === 0) {
            console.error("Supabase Insert Error:", insertError || "No data returned from insert");
            return {
                statusCode: 500,
                body: JSON.stringify({
                    error: insertError?.message || "Failed to create user",
                    details: insertError?.details || "No additional details provided",
                    hint: insertError?.hint || "No hint provided",
                }),
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


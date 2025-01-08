const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt'); // For password hashing

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: "Method Not Allowed" }),
        };
    }

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

    try {
        const { username, password } = JSON.parse(event.body);

        // Validate required fields
        if (!username || !password) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Username and password are required" }),
            };
        }

        // Fetch user by username
        const { data: user, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .single(); // Use single() since username should be unique

        if (fetchError || !user) {
            return {
                statusCode: 401,
                body: JSON.stringify({ error: "Invalid username or password" }),
            };
        }

        // Compare plaintext password with hashed password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return {
                statusCode: 401,
                body: JSON.stringify({ error: "Invalid username or password" }),
            };
        }

        // Remove sensitive data before sending the response
        delete user.password;

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, user }),
        };
    } catch (error) {
        console.error("Login Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "An unexpected error occurred." }),
        };
    }
};

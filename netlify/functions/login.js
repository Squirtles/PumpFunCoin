const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');

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
            .single();

        if (fetchError || !user) {
            console.error("Fetch Error or User Not Found:", fetchError);
            return {
                statusCode: 401,
                body: JSON.stringify({ error: "Invalid username or password" }),
            };
        }

        // Compare provided password with hashed password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            console.error("Invalid Password for User:", username);
            return {
                statusCode: 401,
                body: JSON.stringify({ error: "Invalid username or password" }),
            };
        }

        // Remove sensitive data before sending response
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

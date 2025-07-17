// 1. Import Dependencies
const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

// 2. Initialize Express App and Define Configuration
const app = express();
const PORT = 3000;

// Database configuration is now directly in the code
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'loch7760', // Your database password
    database: 'expensess_db'
};

// 3. Create a Secure Database Connection Pool
const db = mysql.createPool(dbConfig);

// 4. Setup Middleware
// This parses incoming JSON requests so we can use req.body
app.use(express.json());
// This serves static files like your HTML, CSS, and frontend JS
app.use(express.static(path.join(__dirname, 'public')));


// --- API ROUTES ---

// SIGNUP ROUTE
app.post('/user/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Basic validation
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Please provide name, email, and password.' });
        }

        // Check if user already exists
        const [existingUsers] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(409).json({ message: 'User with this email already exists.' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert the new user with the hashed password
        await db.execute(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name, email, hashedPassword]
        );

        res.status(201).json({ message: 'Signup successful!' });

    } catch (error) {
        // Log the full error to the server console for debugging
        console.error('Signup Error:', error);
        res.status(500).json({ message: 'An internal server error occurred.' });
    }
});


// LOGIN ROUTE
app.post('/user/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Basic validation
        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password.' });
        }

        // Find the user by email
        const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        
        // Check if user was found
        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const user = users[0];

        // Compare the provided password with the stored hash
        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (isPasswordCorrect) {
            // Password is correct
            res.status(200).json({ success: true, message: 'User login successful' });
        } else {
            // Password is not correct
            res.status(401).json({ success: false, message: 'Incorrect email or password' });
        }

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ success: false, message: 'An internal server error occurred.' });
    }
});


// 5. Start the Server
app.listen(PORT, () => {
    console.log(`✅ Server is running on http://localhost:${PORT}`);
});
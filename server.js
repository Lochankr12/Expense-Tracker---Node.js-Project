const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise'); // Make sure this line exists

const app = express();
const PORT = 3000;

// --- DATABASE CONNECTION POOL ---
// This block connects to your MySQL database.
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'loch7760',   // <-- IMPORTANT: REPLACE with your actual MySQL password
    database: 'expensess_db'    // <-- IMPORTANT: This matches your screenshot (with double 's')
});

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));


// --- SIGNUP ROUTE (Saves to MySQL) ---
app.post('/user/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const [existingUsers] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'User with this email already exists.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await db.execute(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name, email, hashedPassword]
        );

        console.log('User saved to MySQL:', { name, email });
        res.status(201).json({ message: `Signup successful! Welcome, ${name}.` });

    } catch (error) {
        console.error('Signup Error:', error);
        res.status(500).json({ message: 'An internal server error occurred.' });
    }
});


// --- LOGIN ROUTE (Checks against MySQL) ---
app.post('/user/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        
        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const user = users[0];
        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (isPasswordCorrect) {
            res.status(200).json({ success: true, message: 'User login successful' });
        } else {
            res.status(401).json({ success: false, message: 'User not authorized' });
        }

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ success: false, message: 'An internal server error occurred.' });
    }
});


// --- Start Server ---
app.listen(PORT, () => {
    console.log(`✅ Server is running and connected to MySQL!`);
    console.log(`Access your app at http://localhost:${PORT}`);
});
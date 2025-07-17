// 1. Import Dependencies
const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');

// 2. Initialize Express App and Define Configuration
const app = express();
const PORT = 3000;
// IMPORTANT: Use a strong, random secret key for your real application
const JWT_SECRET = 'a_very_strong_and_long_secret_key_for_your_project'; 

// Database configuration
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'loch7760', // Make sure this is your correct database password
    database: 'expensess_db'
};

// 3. Create a Database Connection Pool
const db = mysql.createPool(dbConfig);

// 4. Setup Middleware
// This parses incoming JSON data from the frontend
app.use(express.json());
// This serves all static files (HTML, CSS, JS) from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));


// --- AUTHENTICATION MIDDLEWARE ---
// This function protects routes by checking for a valid JWT
const authenticate = (req, res, next) => {
    try {
        const token = req.header('Authorization');
        if (!token) {
            return res.status(401).json({ success: false, message: 'Access denied, no token provided' });
        }
        // Verify the token using the secret key
        const decoded = jwt.verify(token, JWT_SECRET);
        // Attach the decoded user information to the request object
        req.user = decoded;
        next(); // If the token is valid, proceed to the requested route
    } catch (error) {
        // If the token is invalid, send an error response
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
};


// --- API ROUTES ---

// SIGNUP ROUTE
app.post('/user/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // Basic validation to ensure all fields are provided
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Please provide name, email, and password.' });
        }

        // Check if a user with this email already exists
        const [existingUsers] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(409).json({ message: 'User with this email already exists.' });
        }

        // Securely hash the password before storing it
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert the new user into the database
        await db.execute(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name, email, hashedPassword]
        );

        res.status(201).json({ message: 'Signup successful!' });

    } catch (error) {
        console.error('Signup Error:', error);
        res.status(500).json({ message: 'An internal server error occurred.' });
    }
});


// LOGIN ROUTE
app.post('/user/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password.' });
        }

        const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const user = users[0];
        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (isPasswordCorrect) {
            // If the password is correct, create a JWT containing the user's ID and name
            const token = jwt.sign({ id: user.id, name: user.name }, JWT_SECRET);
            res.status(200).json({ success: true, message: 'Login successful', token: token });
        } else {
            res.status(401).json({ success: false, message: 'Incorrect email or password' });
        }
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});


// --- EXPENSE ROUTES (PROTECTED) ---

// ADD EXPENSE
app.post('/expense/addexpense', authenticate, async (req, res) => {
    try {
        const { expenseamount, description, category } = req.body;
        const userId = req.user.id; // Get user ID from the verified token
        
        await db.execute(
            'INSERT INTO expenses (expenseamount, description, category, userId) VALUES (?, ?, ?, ?)',
            [expenseamount, description, category, userId]
        );
        res.status(201).json({ success: true, message: 'Expense added successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error while adding expense.' });
    }
});

// GET EXPENSES
app.get('/expense/getexpenses', authenticate, async (req, res) => {
    try {
        const userId = req.user.id; // Get user ID from the verified token
        // Fetch expenses ONLY for the logged-in user
        const [expenses] = await db.execute('SELECT * FROM expenses WHERE userId = ? ORDER BY createdAt DESC', [userId]);
        res.status(200).json({ success: true, expenses: expenses });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error while fetching expenses.' });
    }
});

// DELETE EXPENSE
app.delete('/expense/delete-expense/:id', authenticate, async (req, res) => {
    try {
        const expenseId = req.params.id;
        const userId = req.user.id; // Get user ID from the verified token

        // The WHERE clause ensures a user can ONLY delete their own expenses
        const [result] = await db.execute('DELETE FROM expenses WHERE id = ? AND userId = ?', [expenseId, userId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Expense not found or you are not authorized to delete it.' });
        }
        res.status(200).json({ success: true, message: 'Expense deleted successfully.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error while deleting expense.' });
    }
});


// 5. Start the Server
app.listen(PORT, () => {
    console.log(`✅ Server is running on http://localhost:${PORT}`);
});
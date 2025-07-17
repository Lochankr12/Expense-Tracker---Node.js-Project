// 1. Import Dependencies
const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');

// 2. Initialize Express App and Define Configuration
const app = express();
const PORT = 3000;
const JWT_SECRET = 'your_super_secret_key_123'; // Use a strong, random secret in a real app

// Database configuration
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'loch7760', // Your database password
    database: 'expensess_db'
};

// 3. Create a Database Connection Pool
const db = mysql.createPool(dbConfig);

// 4. Setup Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));


// --- AUTHENTICATION MIDDLEWARE ---
const authenticate = (req, res, next) => {
    try {
        const token = req.header('Authorization');
        if (!token) {
            return res.status(401).json({ success: false, message: 'Access denied, no token' });
        }
        const user = jwt.verify(token, JWT_SECRET);
        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
};


// --- API ROUTES ---

// SIGNUP ROUTE
app.post('/user/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Please provide all fields.' });
        }
        const [existingUsers] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(409).json({ message: 'User already exists.' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.execute('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, hashedPassword]);
        res.status(201).json({ message: 'Signup successful!' });
    } catch (error) {
        console.error('Signup Error:', error);
        res.status(500).json({ message: 'Internal server error.' });
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
        const userId = req.user.id;
        if (!expenseamount || !description || !category) {
            return res.status(400).json({ message: 'Please provide all expense details.' });
        }
        const [result] = await db.execute(
            'INSERT INTO expenses (expenseamount, description, category, userId) VALUES (?, ?, ?, ?)',
            [expenseamount, description, category, userId]
        );
        res.status(201).json({ success: true, message: 'Expense added successfully', expenseId: result.insertId });
    } catch (error) {
        console.error('Add Expense Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

// GET EXPENSES
app.get('/expense/getexpenses', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const [expenses] = await db.execute('SELECT * FROM expenses WHERE userId = ? ORDER BY createdAt DESC', [userId]);
        res.status(200).json({ success: true, expenses: expenses });
    } catch (error) {
        console.error('Get Expenses Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

// DELETE EXPENSE
app.delete('/expense/delete-expense/:id', authenticate, async (req, res) => {
    try {
        const expenseId = req.params.id;
        const userId = req.user.id;
        const [result] = await db.execute('DELETE FROM expenses WHERE id = ? AND userId = ?', [expenseId, userId]);
        if (result.affectedRows > 0) {
            res.status(200).json({ success: true, message: 'Expense deleted successfully.' });
        } else {
            res.status(404).json({ success: false, message: 'Expense not found or not authorized.' });
        }
    } catch (error) {
        console.error('Delete Expense Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});


// 5. Start the Server
app.listen(PORT, () => {
    console.log(`✅ Server is running on http://localhost:${PORT}`);
});
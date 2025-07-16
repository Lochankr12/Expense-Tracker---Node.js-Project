const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt'); // Use bcrypt for secure password handling

const app = express();
const PORT = 3000;

// This array acts as a simple, temporary database.
// In a real application, this would be a real database (like MongoDB or PostgreSQL).
const users = [];

// Middleware
app.use(express.json()); // To parse JSON request bodies
app.use(express.static(path.join(__dirname, 'public'))); // To serve your HTML/CSS files

// --- SIGNUP ROUTE ---
// This route is needed to create users that you can test the login with.
app.post('/user/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        const existingUser = users.find(user => user.email === email);
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = { name, email, password: hashedPassword };
        users.push(newUser);

        console.log('User signed up:', newUser);
        console.log('All users:', users);
        res.status(201).json({ message: `Signup successful! Welcome, ${name}.` });

    } catch (error) {
        res.status(500).json({ message: 'An internal server error occurred.' });
    }
});


// --- LOGIN ROUTE (This is the solution for your assignment) ---
app.post('/user/login', async (req, res) => {
    try {
        // Deliverable 1: Receive the object from the frontend (email, password)
        const { email, password } = req.body;

        // Deliverable 2: Check whether the user with that email id exists
        const user = users.find(u => u.email === email);

        // Deliverable 6: If the user doesn't exist, send a 404 response
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Deliverable 3: If user exists, then try password matching
        // We use bcrypt.compare to securely check the password against the stored hash.
        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (isPasswordCorrect) {
            // Deliverable 4: If password matches, send a success message
            res.status(200).json({ success: true, message: 'User login successful' });
        } else {
            // Deliverable 5: If the password isn't correct, send a 401 response
            res.status(401).json({ success: false, message: 'User not authorized' });
        }

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'An internal server error occurred.' });
    }
});


// --- Start the server ---
app.listen(PORT, () => {
    console.log(`✅ Server is running! Access your app at http://localhost:${PORT}`);
});
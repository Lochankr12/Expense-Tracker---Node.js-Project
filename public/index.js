// public/index.js

// === SETUP AND INITIALIZATION ===

// Run these functions when the page is fully loaded and ready
document.addEventListener('DOMContentLoaded', getExpenses);
document.getElementById('expense-form').addEventListener('submit', addExpense);

// Get the authentication token from the browser's local storage
const token = localStorage.getItem('token');

// SECURITY CHECK: If no token exists, the user is not logged in.
// Redirect them back to the login page immediately.
if (!token) {
    window.location.href = 'login.html'; 
}


// === CORE FUNCTIONS ===

/**
 * Fetches all expenses for the logged-in user from the backend and displays them.
 * This function is called when the page first loads.
 */
async function getExpenses() {
    try {
        const response = await fetch('/expense/getexpenses', {
            headers: { 'Authorization': token }
        });
        const data = await response.json();

        if (data.success) {
            // Clear any old list items before displaying the new ones
            document.getElementById('expense-list').innerHTML = '';
            // Loop through each expense and call displayExpense to show it
            data.expenses.forEach(expense => displayExpense(expense));
        } else {
            // If fetching fails, the token might be invalid, so send to login
            alert('Could not fetch expenses. Please log in again.');
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error('Error fetching expenses:', error);
    }
}


/**
 * Handles the form submission to add a new expense.
 * @param {Event} e The form submission event.
 */
async function addExpense(e) {
    e.preventDefault(); // Prevent page reload

    const expenseDetails = {
        expenseamount: document.getElementById('amount').value,
        description: document.getElementById('description').value,
        category: document.getElementById('category').value,
    };

    try {
        const response = await fetch('/expense/addexpense', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify(expenseDetails)
        });

        const data = await response.json();
        if (data.success) {
            // If successful, create a new expense object and display it immediately
            const newExpense = { ...expenseDetails, id: data.expenseId };
            displayExpense(newExpense);
        } else {
            alert('Failed to add expense.');
        }

        // Clear the form fields for the next entry
        document.getElementById('expense-form').reset();

    } catch (error) {
        console.error('Error adding expense:', error);
    }
}


/**
 * Creates the HTML for a single expense and adds it to the list on the page.
 * @param {object} expense The expense object containing id, description, etc.
 */
function displayExpense(expense) {
    const expenseList = document.getElementById('expense-list');
    const item = document.createElement('li');

    // This is the code that creates the list item with the delete button
    item.innerHTML = `
        ${expense.description} 
        <span>${expense.category}</span>
        <span>₹${expense.expenseamount}</span>
        <button class="delete-btn" onclick="deleteExpense(${expense.id}, this)">X</button>
    `;

    // Add the new item to the top of the list
    expenseList.prepend(item);
}


/**
 * Deletes an expense when the 'X' button is clicked.
 * @param {number} id The ID of the expense to delete.
 * @param {HTMLElement} element The button element that was clicked.
 */
async function deleteExpense(id, element) {
    // Show a confirmation dialog to prevent accidental deletion
    if (!confirm('Are you sure you want to delete this expense?')) {
        return; // Stop the function if the user clicks "Cancel"
    }
    
    try {
        const response = await fetch(`/expense/delete-expense/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': token }
        });

        const data = await response.json();

        if (data.success) {
            // If the backend confirms deletion, remove the parent list item from the screen
            element.parentElement.remove();
        } else {
            alert('Failed to delete expense.');
        }
    } catch (error) {
        console.error('Error deleting expense:', error);
    }
}
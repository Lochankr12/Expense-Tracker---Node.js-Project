// public/index.js
document.addEventListener('DOMContentLoaded', getExpenses);
document.getElementById('expense-form').addEventListener('submit', addExpense);

const token = localStorage.getItem('token');

// Redirect to login if no token is found
if (!token) {
    window.location.href = 'login.html';
}

// Fetch all expenses from the backend and display them
async function getExpenses() {
    try {
        const response = await fetch('/expense/getexpenses', {
            headers: { 'Authorization': token } // Send the token
        });
        const data = await response.json();

        if (data.success) {
            document.getElementById('expense-list').innerHTML = '';
            data.expenses.forEach(expense => displayExpense(expense));
        } else {
            alert('Failed to fetch expenses. Please log in again.');
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error('Error fetching expenses:', error);
    }
}

// Handle form submission to add a new expense
async function addExpense(e) {
    e.preventDefault();

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
                'Authorization': token // Send the token
            },
            body: JSON.stringify(expenseDetails)
        });

        // After adding, refresh the list to show the new expense
        if (response.ok) {
            getExpenses();
        } else {
            alert('Failed to add expense.');
        }

        document.getElementById('expense-form').reset();

    } catch (error) {
        console.error('Error adding expense:', error);
    }
}

// Function to display a single expense in the list
function displayExpense(expense) {
    const expenseList = document.getElementById('expense-list');
    const item = document.createElement('li');

    item.innerHTML = `
        ${expense.description} <span>${expense.category}</span><span>₹${expense.expenseamount}</span>
        <button class="delete-btn" onclick="deleteExpense(${expense.id}, this)">X</button>
    `;
    expenseList.prepend(item);
}

// Function to delete an expense
async function deleteExpense(id, element) {
    if (!confirm('Are you sure you want to delete this expense?')) {
        return;
    }
    
    try {
        const response = await fetch(`/expense/delete-expense/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': token } // Send the token
        });

        const data = await response.json();

        if (data.success) {
            element.parentElement.remove();
        } else {
            alert('Failed to delete expense.');
        }
    } catch (error) {
        console.error('Error deleting expense:', error);
    }
}
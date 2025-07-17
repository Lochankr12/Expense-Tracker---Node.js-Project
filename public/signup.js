// public/signup.js

// Add an event listener to the signup form that triggers when it's submitted
document.getElementById('signup-form').addEventListener('submit', async function(event) {
    // Prevent the default browser action of reloading the page on form submission
    event.preventDefault();

    // Get the values from the input fields
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Create a data object to send to the server
    const signupDetails = {
        name: name,
        email: email,
        password: password
    };

    // Use a try...catch block to handle potential network or server errors
    try {
        // Send the user's details to the '/user/signup' endpoint on the server
        const response = await fetch('/user/signup', {
            method: 'POST', // Use the POST method for creating new data
            headers: {
                'Content-Type': 'application/json' // Tell the server we're sending JSON data
            },
            body: JSON.stringify(signupDetails) // Convert the JavaScript object to a JSON string
        });

        // Get the response from the server
        const result = await response.json();
        
        // Show the server's message to the user (e.g., "Signup successful!" or "User already exists.")
        alert(result.message);

        // Check if the server responded with a success status code (like 201 Created)
        if (response.ok) {
            // If signup was successful, automatically redirect the user to the login page
            window.location.href = 'index.html';
        }

    } catch (error) {
        // If there's a network error or the server is down, log it and show a generic alert
        console.error('Signup Error:', error);
        alert('An error occurred during signup. Please try again later.');
    }
});
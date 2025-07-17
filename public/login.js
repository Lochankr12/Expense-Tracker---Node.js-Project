document.getElementById('login-form').addEventListener('submit', async function(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const loginDetails = { email, password };

    try {
        const response = await fetch('/user/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loginDetails)
        });

        const result = await response.json();

        if (response.ok && result.success) {
            alert(result.message);
            localStorage.setItem('token', result.token);
            window.location.href = 'expense.html'; 
        } else {
            alert(result.message || 'Login failed.');
        }

    } catch (error) {
        console.error('Login Error:', error);
        alert('An error occurred during login.');
    }
});
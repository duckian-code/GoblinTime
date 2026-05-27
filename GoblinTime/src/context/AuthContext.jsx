const AUTH_URI = import.meta.env.VITE_AUTH_URI || 'http://localhost:3000/api/auth';

const res = await fetch(AUTH_URI, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ username, password })
});

const { token, user } = await res.json();
localStorage.setItem('token', token);

function AuthPage() {
    return (
        <div className="page auth-page">
            <div className="auth-container">

                <section className="auth-section">
                    <h2>Login</h2>

                    <form className="auth-form">
                        <input type="text" placeholder="Username" />
                        <input type="password" placeholder="Password" />

                        <button type="submit">Login</button>
                    </form>
                </section>

                <section className="auth-section">
                    <h2>Sign Up</h2>

                    <form className="auth-form">
                        <input type="email" placeholder="Email" />
                        <input type="text" placeholder="Username" />
                        <input type="password" placeholder="Password" />

                        <button type="submit">Create Account</button>
                    </form>
                </section>

            </div>
        </div>
    );
}

export default AuthPage;
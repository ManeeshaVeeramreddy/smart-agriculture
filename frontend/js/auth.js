/**
 * Authentication logic (Login & Registration)
 */

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    // If user already logged in, redirect
    if (Auth.isAuthenticated()) {
        const user = Auth.getUser();
        if (window.location.pathname.endsWith('login.html') || window.location.pathname.endsWith('register.html')) {
            if (user && user.role === 'ADMINISTRATOR') {
                window.location.href = 'admin-dashboard.html';
            } else {
                window.location.href = 'farmer-home.html';
            }
            return;
        }
    }

    // Handle Login
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const submitBtn = loginForm.querySelector('button[type="submit"]');

            if (!email || !password) {
                showToast(t('err_login_fill'), 'error');
                Voice.speak(t('err_login_fill'));
                return;
            }

            try {
                submitBtn.disabled = true;
                submitBtn.textContent = '…';

                // the backend accepts a mobile number or an email in this field
                const response = await apiRequest('/auth/login', {
                    method: 'POST',
                    body: JSON.stringify({ email, password })
                });

                if (response.success && response.data) {
                    const data = response.data;
                    Auth.setSession(data.token, {
                        userId: data.userId,
                        name: data.name,
                        email: data.email,
                        role: data.role
                    });

                    showToast('Login successful! Redirecting...', 'success');
                    setTimeout(() => {
                        if (data.role === 'ADMINISTRATOR') {
                            window.location.href = 'admin-dashboard.html';
                        } else {
                            window.location.href = 'farmer-home.html';
                        }
                    }, 800);
                } else {
                    showToast(response.message || 'Login failed.', 'error');
                }
            } catch (err) {
                showToast(err.message || 'Invalid email or password.', 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = t('login_btn');
            }
        });
    }

    // Handle Registration
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const phone = document.getElementById('phone').value.trim();
            const password = document.getElementById('password').value;
            const role = 'FARMER';   // public sign-up always creates a farmer account
            const submitBtn = registerForm.querySelector('button[type="submit"]');

            if (!name || (!email && !phone) || !password) {
                showToast(t('err_reg_fill'), 'error');
                Voice.speak(t('err_reg_fill'));
                return;
            }

            try {
                submitBtn.disabled = true;
                submitBtn.textContent = '…';

                const response = await apiRequest('/auth/register', {
                    method: 'POST',
                    body: JSON.stringify({ name, email: email || null, phone: phone || null, password, role })
                });

                if (response.success && response.data) {
                    const data = response.data;
                    Auth.setSession(data.token, {
                        userId: data.userId,
                        name: data.name,
                        email: data.email,
                        role: data.role
                    });

                    showToast('Registration successful! Redirecting...', 'success');
                    setTimeout(() => {
                        if (data.role === 'ADMINISTRATOR') {
                            window.location.href = 'admin-dashboard.html';
                        } else {
                            window.location.href = 'farmer-home.html';
                        }
                    }, 800);
                } else {
                    showToast(response.message || 'Registration failed.', 'error');
                }
            } catch (err) {
                showToast(err.message || 'Registration failed. Email might already exist.', 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = t('register_link');
            }
        });
    }
});

/**
 * Quick fill helper for demo login during college presentations
 */
function fillDemoCredentials(role) {
    const emailField = document.getElementById('email');
    const passwordField = document.getElementById('password');
    if (!emailField || !passwordField) return;

    if (role === 'farmer') {
        emailField.value = '9123456789';     // demo farmer can log in with a mobile number
        passwordField.value = 'farmer123';
        showToast('Farmer demo credentials loaded', 'info');
    } else if (role === 'admin') {
        emailField.value = 'admin@sams.com';
        passwordField.value = 'admin123';
        showToast('Admin demo credentials loaded', 'info');
    }
}

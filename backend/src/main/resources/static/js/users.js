/**
 * Admin User Management Logic
 */

let userList = [];

document.addEventListener('DOMContentLoaded', async () => {
    if (!Auth.requireAuth('ADMINISTRATOR')) return;
    renderNavUser();
    await loadUsers();
});

async function loadUsers() {
    try {
        const res = await apiRequest('/admin/users');
        userList = res.data || [];
        renderUsersTable(userList);
    } catch (err) {
        showToast('Failed to load users: ' + err.message, 'error');
    }
}

function renderUsersTable(users) {
    const tbody = document.getElementById('users-tbody');
    if (!tbody) return;

    if (users.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--text-muted);">No users registered in the system.</td></tr>`;
        return;
    }

    const currentLoggedIn = Auth.getUser();

    tbody.innerHTML = users.map(u => {
        const isSelf = currentLoggedIn && currentLoggedIn.userId === u.userId;
        const roleBadge = u.role === 'ADMINISTRATOR' ? 'badge-warning' : 'badge-info';

        return `
            <tr>
                <td>#${u.userId}</td>
                <td><strong>${u.name}</strong></td>
                <td>${u.email}</td>
                <td>${u.phone || 'N/A'}</td>
                <td><span class="badge ${roleBadge}">${u.role}</span></td>
                <td>
                    ${isSelf ? '<span style="color:var(--text-muted); font-size:0.85rem;">(Current Account)</span>' : `
                        <button onclick="deleteUser(${u.userId}, '${u.name}')" class="btn btn-sm btn-danger">Delete</button>
                    `}
                </td>
            </tr>
        `;
    }).join('');
}

async function deleteUser(userId, name) {
    if (!confirm(`Are you sure you want to delete user "${name}" and all their associated data?`)) {
        return;
    }

    try {
        await apiRequest(`/admin/users/${userId}`, { method: 'DELETE' });
        showToast(`User "${name}" deleted successfully`, 'success');
        await loadUsers();
    } catch (err) {
        showToast('Failed to delete user: ' + err.message, 'error');
    }
}

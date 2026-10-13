/**
 * Alerts Center Logic
 */

let allAlerts = [];

document.addEventListener('DOMContentLoaded', async () => {
    if (!Auth.requireAuth()) return;
    renderNavUser();
    await loadAlerts();

    const statusFilter = document.getElementById('alert-status-filter');
    if (statusFilter) {
        statusFilter.addEventListener('change', () => {
            const filterValue = statusFilter.value;
            if (filterValue === 'ACTIVE') {
                renderAlerts(allAlerts.filter(a => a.status === 'ACTIVE'));
            } else if (filterValue === 'RESOLVED') {
                renderAlerts(allAlerts.filter(a => a.status === 'RESOLVED'));
            } else {
                renderAlerts(allAlerts);
            }
        });
    }
});

async function loadAlerts() {
    try {
        const res = await apiRequest('/alerts');
        allAlerts = res.data || [];
        renderAlerts(allAlerts);
    } catch (err) {
        showToast('Failed to load alerts: ' + err.message, 'error');
    }
}

function renderAlerts(alerts) {
    const container = document.getElementById('alerts-container');
    if (!container) return;

    if (alerts.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:3rem; background:#fff; border-radius:var(--border-radius); box-shadow:var(--box-shadow);">
                <h3>🎉 All Clear!</h3>
                <p style="color:var(--text-muted); margin-top:0.5rem;">No alerts found matching your criteria. Soil moisture levels are safe.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = alerts.map(a => {
        const isActive = a.status === 'ACTIVE';
        const cardBorder = isActive ? 'var(--danger)' : '#6c757d';
        const badgeClass = isActive ? 'badge-danger' : 'badge-secondary';

        return `
            <div class="card" style="border-left: 6px solid ${cardBorder}; margin-bottom: 1rem;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:1rem;">
                    <div>
                        <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.35rem;">
                            <span style="font-size:1.2rem;">${isActive ? '🚨' : '✅'}</span>
                            <strong style="font-size:1.1rem; color:${isActive ? 'var(--danger)' : 'var(--text-dark)'};">${a.alertType}</strong>
                            <span class="badge ${badgeClass}">${a.status}</span>
                        </div>
                        <div style="font-size:0.95rem; margin-bottom:0.5rem;">${a.message}</div>
                        <div style="font-size:0.85rem; color:var(--text-muted);">
                            Field: <strong>${a.fieldName || 'Field #' + a.fieldId}</strong> | Created: ${formatDate(a.createdDateTime)}
                        </div>
                    </div>
                    <div>
                        ${isActive ? `
                            <button onclick="resolveAlertInCenter(${a.alertId})" class="btn btn-sm btn-outline" style="border-color:var(--danger); color:var(--danger);">
                                Mark as Resolved
                            </button>
                        ` : `
                            <span style="font-size:0.85rem; color:var(--text-muted);">Resolved</span>
                        `}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

async function resolveAlertInCenter(alertId) {
    try {
        await apiRequest(`/alerts/${alertId}/resolve`, { method: 'PUT' });
        showToast('Alert resolved successfully', 'success');
        await loadAlerts();
    } catch (err) {
        showToast('Failed to resolve alert: ' + err.message, 'error');
    }
}

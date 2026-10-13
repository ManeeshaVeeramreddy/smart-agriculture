/**
 * Administrator Dashboard Logic
 */

document.addEventListener('DOMContentLoaded', async () => {
    if (!Auth.requireAuth('ADMINISTRATOR')) return;
    renderNavUser();
    await loadAdminStats();
    await loadRecentAdminActivity();
});

async function loadAdminStats() {
    try {
        const res = await apiRequest('/admin/stats');
        const stats = res.data || {};

        document.getElementById('stat-total-users').textContent = stats.totalUsers ?? 0;
        document.getElementById('stat-total-farmers').textContent = stats.totalFarmers ?? 0;
        document.getElementById('stat-total-fields').textContent = stats.totalFields ?? 0;
        document.getElementById('stat-total-crops').textContent = stats.totalCrops ?? 0;
        document.getElementById('stat-total-monitoring').textContent = stats.totalMonitoringRecords ?? 0;
        document.getElementById('stat-active-alerts').textContent = stats.activeAlerts ?? 0;
    } catch (err) {
        showToast('Failed to load admin stats: ' + err.message, 'error');
    }
}

async function loadRecentAdminActivity() {
    try {
        const [alertsRes, monitoringRes] = await Promise.all([
            apiRequest('/admin/alerts'),
            apiRequest('/admin/monitoring')
        ]);

        const alerts = (alertsRes.data || []).slice(0, 5);
        const records = (monitoringRes.data || []).slice(0, 5);

        renderAdminAlertsList(alerts);
        renderAdminMonitoringTable(records);
    } catch (err) {
        console.error('Error loading recent admin activity:', err);
    }
}

function renderAdminAlertsList(alerts) {
    const container = document.getElementById('admin-recent-alerts');
    if (!container) return;

    if (alerts.length === 0) {
        container.innerHTML = `<div style="color:var(--text-muted); padding:1rem;">No recent alerts.</div>`;
        return;
    }

    container.innerHTML = alerts.map(a => `
        <div style="padding:0.75rem 0; border-bottom:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center;">
            <div>
                <strong>${a.alertType}</strong>: ${a.message}
                <div style="font-size:0.8rem; color:var(--text-muted);">Field: ${a.fieldName || 'N/A'} | ${formatDate(a.createdDateTime)}</div>
            </div>
            <span class="badge ${a.status === 'ACTIVE' ? 'badge-danger' : 'badge-secondary'}">${a.status}</span>
        </div>
    `).join('');
}

function renderAdminMonitoringTable(records) {
    const tbody = document.getElementById('admin-recent-monitoring-tbody');
    if (!tbody) return;

    if (records.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">No records available.</td></tr>`;
        return;
    }

    tbody.innerHTML = records.map(r => `
        <tr>
            <td>${formatDate(r.dateTime)}</td>
            <td><strong>${r.fieldName || 'Field #' + r.fieldId}</strong></td>
            <td>${r.temperature.toFixed(1)}°C</td>
            <td>${r.soilMoisture.toFixed(1)}%</td>
            <td><span class="badge ${r.soilMoisture < 30 ? 'badge-danger' : 'badge-success'}">${r.irrigationStatus}</span></td>
        </tr>
    `).join('');
}

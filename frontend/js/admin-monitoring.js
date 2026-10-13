/**
 * Admin System Monitoring & Data Overview
 */

document.addEventListener('DOMContentLoaded', async () => {
    if (!Auth.requireAuth('ADMINISTRATOR')) return;
    renderNavUser();
    await loadAllSystemMonitoring();
});

async function loadAllSystemMonitoring() {
    try {
        const [monitoringRes, alertsRes] = await Promise.all([
            apiRequest('/admin/monitoring'),
            apiRequest('/admin/alerts')
        ]);

        renderMonitoringTable(monitoringRes.data || []);
        renderAlertsTable(alertsRes.data || []);
    } catch (err) {
        showToast('Failed to load system data: ' + err.message, 'error');
    }
}

function renderMonitoringTable(records) {
    const tbody = document.getElementById('admin-monitoring-tbody');
    if (!tbody) return;

    if (records.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--text-muted);">No monitoring records in system.</td></tr>`;
        return;
    }

    tbody.innerHTML = records.map(r => {
        const isIrrigationRequired = r.soilMoisture < 30.0;
        const badgeClass = isIrrigationRequired ? 'badge-danger' : 'badge-success';

        return `
            <tr>
                <td>#${r.monitoringId}</td>
                <td>${formatDate(r.dateTime)}</td>
                <td><strong>${r.fieldName || 'Field #' + r.fieldId}</strong></td>
                <td>${r.temperature.toFixed(1)}°C</td>
                <td>${r.humidity.toFixed(0)}%</td>
                <td>
                    <span style="font-weight:600; color:${isIrrigationRequired ? 'var(--danger)' : 'var(--success)'};">
                        ${r.soilMoisture.toFixed(1)}%
                    </span>
                </td>
                <td><span class="badge ${badgeClass}">${r.irrigationStatus}</span></td>
            </tr>
        `;
    }).join('');
}

function renderAlertsTable(alerts) {
    const tbody = document.getElementById('admin-alerts-tbody');
    if (!tbody) return;

    if (alerts.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--text-muted);">No alerts in system.</td></tr>`;
        return;
    }

    tbody.innerHTML = alerts.map(a => `
        <tr>
            <td>#${a.alertId}</td>
            <td>${formatDate(a.createdDateTime)}</td>
            <td><strong>${a.fieldName || 'Field #' + a.fieldId}</strong></td>
            <td><code>${a.alertType}</code></td>
            <td>${a.message}</td>
            <td><span class="badge ${a.status === 'ACTIVE' ? 'badge-danger' : 'badge-secondary'}">${a.status}</span></td>
        </tr>
    `).join('');
}

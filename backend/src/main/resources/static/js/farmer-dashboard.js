/**
 * Farmer Dashboard Logic
 */

document.addEventListener('DOMContentLoaded', async () => {
    if (!Auth.requireAuth()) return;
    renderNavUser();
    await loadDashboardData();
});

async function loadDashboardData() {
    try {
        // Fetch farmer fields
        const fieldsRes = await apiRequest('/fields');
        const fields = fieldsRes.data || [];
        document.getElementById('total-fields').textContent = fields.length;

        // Fetch farmer crops
        const cropsRes = await apiRequest('/crops');
        const crops = cropsRes.data || [];
        document.getElementById('total-crops').textContent = crops.length;

        // Fetch active alerts
        const alertsRes = await apiRequest('/alerts?activeOnly=true');
        const activeAlerts = alertsRes.data || [];
        document.getElementById('active-alerts-count').textContent = activeAlerts.length;

        // Render Active Alerts Banner/Container
        renderAlertsSection(activeAlerts);

        // Fetch latest monitoring reading (across fields or for primary field)
        const monitoringRes = await apiRequest('/monitoring');
        const records = monitoringRes.data || [];

        if (records.length > 0) {
            const latest = records[0]; // ordered desc by date
            document.getElementById('latest-temp').textContent = `${latest.temperature.toFixed(1)}°C`;
            document.getElementById('latest-humidity').textContent = `${latest.humidity.toFixed(0)}%`;
            document.getElementById('latest-moisture').textContent = `${latest.soilMoisture.toFixed(0)}%`;

            // Display Irrigation Status Banner
            renderIrrigationBanner(latest.soilMoisture, latest.fieldName, latest.dateTime);
        } else {
            document.getElementById('latest-temp').textContent = '--';
            document.getElementById('latest-humidity').textContent = '--';
            document.getElementById('latest-moisture').textContent = '--';
            renderEmptyIrrigationBanner();
        }

        // Render fields summary table
        renderRecentFieldsTable(fields);

    } catch (err) {
        console.error('Error loading dashboard:', err);
        showToast('Error loading dashboard data: ' + err.message, 'error');
    }
}

function renderIrrigationBanner(soilMoisture, fieldName, dateTime) {
    const bannerContainer = document.getElementById('irrigation-banner-container');
    if (!bannerContainer) return;

    const isRequired = soilMoisture < 30.0;
    const statusText = isRequired ? 'IRRIGATION REQUIRED' : 'MOISTURE LEVEL NORMAL';
    const bannerClass = isRequired ? 'irrigation-required' : 'irrigation-normal';
    const icon = isRequired ? '🚨' : '✅';
    const explanation = isRequired
        ? `Soil moisture on <strong>${fieldName || 'field'}</strong> is at <strong>${soilMoisture.toFixed(1)}%</strong> (below the 30% threshold). Please activate irrigation immediately to protect crop health.`
        : `Soil moisture on <strong>${fieldName || 'field'}</strong> is optimal at <strong>${soilMoisture.toFixed(1)}%</strong> (>= 30%). No irrigation needed at this time.`;

    bannerContainer.innerHTML = `
        <div class="irrigation-banner ${bannerClass}">
            <div>
                <div class="irrigation-status-title">
                    <span>${icon}</span>
                    <span>${statusText}</span>
                </div>
                <div class="irrigation-status-desc">${explanation}</div>
                <div style="font-size:0.8rem; margin-top:0.4rem; opacity:0.85;">Last checked: ${formatDate(dateTime)} (Threshold: 30.0%)</div>
            </div>
            <div>
                <a href="monitoring.html" class="btn btn-sm ${isRequired ? 'btn-danger' : 'btn-primary'}">Enter Reading</a>
            </div>
        </div>
    `;
}

function renderEmptyIrrigationBanner() {
    const bannerContainer = document.getElementById('irrigation-banner-container');
    if (!bannerContainer) return;

    bannerContainer.innerHTML = `
        <div class="irrigation-banner irrigation-normal">
            <div>
                <div class="irrigation-status-title">🌱 Welcome to Smart Agriculture Monitoring</div>
                <div class="irrigation-status-desc">No monitoring readings recorded yet. Add your first field observation to calculate irrigation requirements!</div>
            </div>
            <div>
                <a href="monitoring.html" class="btn btn-primary btn-sm">Add Monitoring Data</a>
            </div>
        </div>
    `;
}

function renderAlertsSection(alerts) {
    const section = document.getElementById('active-alerts-list');
    if (!section) return;

    if (alerts.length === 0) {
        section.innerHTML = `
            <div style="text-align:center; padding:1.5rem; color:var(--text-muted);">
                ✅ No active alerts. All monitored fields are operating within safe moisture thresholds.
            </div>
        `;
        return;
    }

    section.innerHTML = alerts.map(alert => `
        <div class="alert-banner">
            <div>
                <strong>⚠️ ${alert.alertType}</strong>: ${alert.message}
                <div style="font-size:0.8rem; margin-top:0.25rem;">
                    Field: <strong>${alert.fieldName || 'N/A'}</strong> | Reported: ${formatDate(alert.createdDateTime)}
                </div>
            </div>
            <div>
                <button onclick="resolveAlert(${alert.alertId})" class="btn btn-sm btn-outline" style="border-color:#721c24; color:#721c24;">
                    Mark Resolved
                </button>
            </div>
        </div>
    `).join('');
}

async function resolveAlert(alertId) {
    try {
        await apiRequest(`/alerts/${alertId}/resolve`, { method: 'PUT' });
        showToast('Alert resolved successfully', 'success');
        await loadDashboardData();
    } catch (err) {
        showToast('Failed to resolve alert: ' + err.message, 'error');
    }
}

function renderRecentFieldsTable(fields) {
    const tbody = document.getElementById('fields-summary-tbody');
    if (!tbody) return;

    if (fields.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">No fields added yet. <a href="fields.html">Add your first field</a>.</td></tr>`;
        return;
    }

    tbody.innerHTML = fields.map(f => {
        const moistureDisplay = f.latestSoilMoisture != null ? `${f.latestSoilMoisture.toFixed(0)}%` : 'No data';
        const isIrrigationReq = f.irrigationStatus === 'Irrigation Required';
        const badgeClass = isIrrigationReq ? 'badge-danger' : (f.latestSoilMoisture != null ? 'badge-success' : 'badge-secondary');
        const statusLabel = f.irrigationStatus || 'Pending';

        return `
            <tr>
                <td><strong>${f.fieldName}</strong></td>
                <td>${f.location}</td>
                <td>${f.area} acres</td>
                <td>${f.soilType}</td>
                <td>${moistureDisplay}</td>
                <td><span class="badge ${badgeClass}">${statusLabel}</span></td>
            </tr>
        `;
    }).join('');
}

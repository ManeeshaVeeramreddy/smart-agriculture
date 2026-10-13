/**
 * Monitoring History Logic
 */

let historyRecords = [];
let userFields = [];

document.addEventListener('DOMContentLoaded', async () => {
    if (!Auth.requireAuth()) return;
    renderNavUser();
    await loadFieldsForFilter();

    const params = new URLSearchParams(window.location.search);
    const preselectedFieldId = params.get('fieldId');
    if (preselectedFieldId) {
        const filterSelect = document.getElementById('history-field-filter');
        if (filterSelect) filterSelect.value = preselectedFieldId;
        await loadHistory(preselectedFieldId);
    } else {
        await loadHistory();
    }

    const filterSelect = document.getElementById('history-field-filter');
    if (filterSelect) {
        filterSelect.addEventListener('change', () => {
            const val = filterSelect.value;
            loadHistory(val || null);
        });
    }
});

async function loadFieldsForFilter() {
    try {
        const res = await apiRequest('/fields');
        userFields = res.data || [];
        const select = document.getElementById('history-field-filter');
        if (select) {
            select.innerHTML = '<option value="">All Fields</option>' +
                userFields.map(f => `<option value="${f.fieldId}">${f.fieldName}</option>`).join('');
        }
    } catch (err) {
        console.error('Failed to load filter fields:', err);
    }
}

async function loadHistory(fieldId = null) {
    try {
        const endpoint = fieldId ? `/monitoring/history/${fieldId}` : '/monitoring';
        const res = await apiRequest(endpoint);
        historyRecords = res.data || [];
        renderHistoryTable(historyRecords);
    } catch (err) {
        showToast('Failed to load history: ' + err.message, 'error');
    }
}

function renderHistoryTable(records) {
    const tbody = document.getElementById('history-tbody');
    if (!tbody) return;

    if (records.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:2.5rem; color:var(--text-muted);">No monitoring records found. Record your first reading in <a href="monitoring.html">Add Monitoring Data</a>.</td></tr>`;
        return;
    }

    tbody.innerHTML = records.map(r => {
        const isIrrigationRequired = r.soilMoisture < 30.0;
        const badgeClass = isIrrigationRequired ? 'badge-danger' : 'badge-success';
        const alertIndicator = r.alertGenerated ? ' ⚠️' : '';

        return `
            <tr>
                <td><strong>${formatDate(r.dateTime)}</strong></td>
                <td>${r.fieldName || 'Field #' + r.fieldId}</td>
                <td>${r.temperature.toFixed(1)}°C</td>
                <td>${r.humidity.toFixed(0)}%</td>
                <td>
                    <span style="font-weight:600; color:${isIrrigationRequired ? 'var(--danger)' : 'var(--success)'};">
                        ${r.soilMoisture.toFixed(1)}%
                    </span>
                </td>
                <td>
                    <span class="badge ${badgeClass}">${r.irrigationStatus}${alertIndicator}</span>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Monitoring Input and Simulation Module
 */

document.addEventListener('DOMContentLoaded', async () => {
    if (!Auth.requireAuth()) return;
    renderNavUser();
    await loadFieldsForSelect();

    // Default datetime-local to current local time
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    const dateInput = document.getElementById('reading-date');
    if (dateInput) {
        dateInput.value = now.toISOString().slice(0, 16);
    }

    // Check query params if fieldId passed
    const params = new URLSearchParams(window.location.search);
    const preselectedFieldId = params.get('fieldId');
    if (preselectedFieldId) {
        const fieldSelect = document.getElementById('field-select');
        if (fieldSelect) fieldSelect.value = preselectedFieldId;
    }

    const form = document.getElementById('monitoring-form');
    if (form) {
        form.addEventListener('submit', handleAddMonitoring);
    }
});

async function loadFieldsForSelect() {
    try {
        const res = await apiRequest('/fields');
        const fields = res.data || [];
        const select = document.getElementById('field-select');
        if (select) {
            select.innerHTML = '<option value="">-- Choose Field --</option>' +
                fields.map(f => `<option value="${f.fieldId}">${f.fieldName} (${f.location} - ${f.soilType})</option>`).join('');
        }
    } catch (err) {
        showToast('Failed to load fields: ' + err.message, 'error');
    }
}

function loadSimulationPreset(type) {
    const tempInput = document.getElementById('temperature');
    const humInput = document.getElementById('humidity');
    const moistureInput = document.getElementById('soil-moisture');

    if (type === 'critical') {
        // Soil moisture = 25% (Triggers Low Moisture Alert & Irrigation Required)
        tempInput.value = 32.5;
        humInput.value = 45;
        moistureInput.value = 25;
        showToast('Simulated: Low Moisture (25%) loaded. Submit to verify alert generation.', 'warning');
    } else if (type === 'normal') {
        // Soil moisture = 45% (Moisture Level Normal)
        tempInput.value = 27.0;
        humInput.value = 65;
        moistureInput.value = 45;
        showToast('Simulated: Optimal Moisture (45%) loaded.', 'info');
    } else if (type === 'boundary') {
        // Soil moisture = 30% (Exact threshold boundary -> Moisture Level Normal)
        tempInput.value = 28.0;
        humInput.value = 60;
        moistureInput.value = 30;
        showToast('Simulated: Threshold Boundary (30.0%) loaded.', 'info');
    }
}

async function handleAddMonitoring(e) {
    e.preventDefault();
    const fieldId = parseInt(document.getElementById('field-select').value);
    const temperature = parseFloat(document.getElementById('temperature').value);
    const humidity = parseFloat(document.getElementById('humidity').value);
    const soilMoisture = parseFloat(document.getElementById('soil-moisture').value);
    const rawDateTime = document.getElementById('reading-date').value;

    if (!fieldId) {
        showToast('Please select a field.', 'error');
        return;
    }
    if (isNaN(temperature)) {
        showToast('Please enter a valid numeric temperature.', 'error');
        return;
    }
    if (isNaN(humidity) || humidity < 0 || humidity > 100) {
        showToast('Humidity must be between 0% and 100%.', 'error');
        return;
    }
    if (isNaN(soilMoisture) || soilMoisture < 0 || soilMoisture > 100) {
        showToast('Soil moisture must be between 0% and 100%.', 'error');
        return;
    }

    // Format datetime string for Spring Boot
    let dateTime = null;
    if (rawDateTime) {
        dateTime = rawDateTime.replace('T', ' ') + ':00';
    }

    const payload = { fieldId, temperature, humidity, soilMoisture, dateTime };
    const submitBtn = document.getElementById('submit-btn');

    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving & Evaluating...';

        const response = await apiRequest('/monitoring', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        if (response.success && response.data) {
            showToast('Monitoring data saved successfully!', 'success');
            displayEvaluationResult(response.data);
        } else {
            showToast(response.message || 'Failed to record monitoring data', 'error');
        }
    } catch (err) {
        showToast('Error: ' + err.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Record Reading';
    }
}

function displayEvaluationResult(result) {
    const resultBox = document.getElementById('evaluation-result-box');
    if (!resultBox) return;

    resultBox.style.display = 'block';

    const isIrrigationRequired = result.soilMoisture < 30.0;
    const bannerClass = isIrrigationRequired ? 'irrigation-required' : 'irrigation-normal';
    const statusIcon = isIrrigationRequired ? '🚨' : '✅';
    const statusText = result.irrigationStatus;

    resultBox.innerHTML = `
        <div class="card" style="border: 2px solid ${isIrrigationRequired ? 'var(--danger)' : 'var(--primary)'};">
            <h3 class="card-title">
                <span>Evaluation Result: ${result.fieldName}</span>
                <span class="badge ${isIrrigationRequired ? 'badge-danger' : 'badge-success'}">${statusText}</span>
            </h3>

            <div class="metrics-grid" style="margin-bottom: 1.5rem;">
                <div class="metric-card">
                    <div class="metric-label">Temperature</div>
                    <div class="metric-value">${result.temperature.toFixed(1)}°C</div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">Humidity</div>
                    <div class="metric-value">${result.humidity.toFixed(0)}%</div>
                </div>
                <div class="metric-card ${isIrrigationRequired ? 'danger' : 'success'}">
                    <div class="metric-label">Soil Moisture</div>
                    <div class="metric-value">${result.soilMoisture.toFixed(1)}%</div>
                    <div class="metric-subtext">Threshold: 30.0%</div>
                </div>
            </div>

            <div class="irrigation-banner ${bannerClass}" style="margin-bottom: 1.25rem;">
                <div>
                    <div class="irrigation-status-title">
                        <span>${statusIcon}</span>
                        <span>${statusText}</span>
                    </div>
                    <div class="irrigation-status-desc">
                        ${isIrrigationRequired 
                            ? `Soil moisture (${result.soilMoisture}%) is below 30.0%. Spring Boot Service Layer has automatically dispatched a <strong>LOW_SOIL_MOISTURE</strong> alert!`
                            : `Soil moisture (${result.soilMoisture}%) is normal (>= 30.0%). Fields have sufficient hydration.`}
                    </div>
                </div>
            </div>

            ${result.alertGenerated ? `
                <div class="alert-banner" style="margin-bottom: 1.25rem;">
                    <div>
                        <strong>⚠️ Alert Triggered:</strong> ${result.alertMessage}
                        <div style="font-size:0.8rem; margin-top:0.25rem;">System automatically stored alert record in MySQL database.</div>
                    </div>
                    <a href="alerts.html" class="btn btn-sm btn-outline" style="border-color:#721c24; color:#721c24;">View in Alerts Center</a>
                </div>
            ` : ''}

            <div style="display:flex; gap:1rem; flex-wrap:wrap;">
                <a href="monitoring-history.html?fieldId=${result.fieldId}" class="btn btn-outline">View Field History</a>
                <a href="recommendation.html?fieldId=${result.fieldId}" class="btn btn-primary">Check Crop Recommendations</a>
                <button onclick="document.getElementById('evaluation-result-box').style.display='none'" class="btn btn-secondary">Close</button>
            </div>
        </div>
    `;

    resultBox.scrollIntoView({ behavior: 'smooth' });
}

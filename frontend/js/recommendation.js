/**
 * Crop Recommendation Logic
 */

let userFields = [];

document.addEventListener('DOMContentLoaded', async () => {
    if (!Auth.requireAuth()) return;
    renderNavUser();
    await loadFieldsForRecommendation();

    const params = new URLSearchParams(window.location.search);
    const preselectedFieldId = params.get('fieldId');
    if (preselectedFieldId) {
        const fieldSelect = document.getElementById('field-select');
        if (fieldSelect) {
            fieldSelect.value = preselectedFieldId;
            await loadRecommendationForSelectedField(preselectedFieldId);
        }
    }

    const form = document.getElementById('recommendation-form');
    if (form) {
        form.addEventListener('submit', handleManualRecommendation);
    }

    const fieldSelect = document.getElementById('field-select');
    if (fieldSelect) {
        fieldSelect.addEventListener('change', () => {
            const fId = fieldSelect.value;
            if (fId) {
                loadRecommendationForSelectedField(fId);
            }
        });
    }
});

async function loadFieldsForRecommendation() {
    try {
        const res = await apiRequest('/fields');
        userFields = res.data || [];
        const select = document.getElementById('field-select');
        if (select) {
            select.innerHTML = '<option value="">-- Choose Field to Autofill Conditions --</option>' +
                userFields.map(f => `<option value="${f.fieldId}">${f.fieldName} (${f.location} - ${f.soilType})</option>`).join('');
        }
    } catch (err) {
        console.error('Failed to load fields:', err);
    }
}

async function loadRecommendationForSelectedField(fieldId) {
    try {
        const res = await apiRequest(`/recommendations/${fieldId}`);
        const results = res.data || [];
        renderRecommendations(results, `Field #${fieldId}`);

        // Also autofill form inputs for transparency
        const field = userFields.find(f => f.fieldId == fieldId);
        if (field) {
            if (field.latestTemperature != null) document.getElementById('rec-temp').value = field.latestTemperature;
            if (field.latestHumidity != null) document.getElementById('rec-hum').value = field.latestHumidity;
            if (field.latestSoilMoisture != null) document.getElementById('rec-moisture').value = field.latestSoilMoisture;
            document.getElementById('rec-soil-type').value = field.soilType;
        }
    } catch (err) {
        showToast('Failed to evaluate field: ' + err.message, 'error');
    }
}

async function handleManualRecommendation(e) {
    e.preventDefault();
    const temp = parseFloat(document.getElementById('rec-temp').value);
    const hum = parseFloat(document.getElementById('rec-hum').value);
    const moisture = parseFloat(document.getElementById('rec-moisture').value);
    const soilType = document.getElementById('rec-soil-type').value;

    if (isNaN(temp) || isNaN(hum) || isNaN(moisture) || !soilType) {
        showToast('Please provide valid environmental conditions.', 'error');
        return;
    }

    const payload = {
        temperature: temp,
        humidity: hum,
        soilMoisture: moisture,
        soilType: soilType
    };

    const submitBtn = document.getElementById('rec-submit-btn');

    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Evaluating Rule Base...';

        const res = await apiRequest('/recommendations', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        const results = res.data || [];
        renderRecommendations(results, 'Manual Conditions');
        showToast('Crop recommendations computed successfully!', 'success');
    } catch (err) {
        showToast('Error: ' + err.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Get Recommendations';
    }
}

function renderRecommendations(list, sourceTitle) {
    const container = document.getElementById('recommendations-results');
    if (!container) return;

    if (list.length === 0) {
        container.innerHTML = `<div class="card" style="text-align:center; padding:2rem;">No crop requirements found in the database.</div>`;
        return;
    }

    container.innerHTML = `
        <h3 style="margin-bottom: 1.25rem; color: var(--primary-dark);">
            🌾 Suitability Analysis Results (${sourceTitle})
        </h3>
        ${list.map(crop => {
            const score = crop.suitabilityScore;
            let badgeClass = 'badge-success';
            let statusText = 'Highly Suitable';
            let borderColor = 'var(--primary)';

            if (score < 50) {
                badgeClass = 'badge-danger';
                statusText = 'Not Recommended';
                borderColor = 'var(--danger)';
            } else if (score < 75) {
                badgeClass = 'badge-warning';
                statusText = 'Moderately Suitable';
                borderColor = 'var(--warning)';
            }

            return `
                <div class="card" style="border-left: 6px solid ${borderColor}; margin-bottom: 1.25rem;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:1rem;">
                        <div style="flex:1; min-width:280px;">
                            <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.5rem;">
                                <h3 style="margin:0; font-size:1.3rem;">${crop.cropName}</h3>
                                <span class="badge ${badgeClass}">${statusText}</span>
                            </div>
                            <p style="font-size:0.95rem; margin-bottom:0.75rem; color:#2c3e50;">
                                <strong>Reason:</strong> ${crop.reason}
                            </p>
                            <div style="font-size:0.85rem; color:var(--text-muted); background:#f8f9fa; padding:0.6rem 0.85rem; border-radius:6px;">
                                <strong>Reference Criteria:</strong> Temp: ${crop.minimumTemperature}-${crop.maximumTemperature}°C | 
                                Humidity: ${crop.minimumHumidity}-${crop.maximumHumidity}% | 
                                Soil Moisture: ${crop.minimumSoilMoisture}-${crop.maximumSoilMoisture}% | 
                                Preferred Soils: <em>${crop.suitableSoilType}</em>
                            </div>
                        </div>

                        <div style="text-align:center; min-width:90px;">
                            <div class="recommendation-score-circle" style="border-color:${borderColor}; margin:0 auto 0.35rem;">
                                ${score}%
                            </div>
                            <span style="font-size:0.8rem; font-weight:600; color:var(--text-muted);">Match Score</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('')}
    `;

    container.scrollIntoView({ behavior: 'smooth' });
}

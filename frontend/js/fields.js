/**
 * Field Management Logic
 */

let currentFields = [];

document.addEventListener('DOMContentLoaded', async () => {
    if (!Auth.requireAuth()) return;
    renderNavUser();
    await loadFields();

    const fieldForm = document.getElementById('field-form');
    if (fieldForm) {
        fieldForm.addEventListener('submit', handleSaveField);
    }
});

async function loadFields() {
    try {
        const response = await apiRequest('/fields');
        currentFields = response.data || [];
        renderFieldsGrid(currentFields);
    } catch (err) {
        showToast('Failed to load fields: ' + err.message, 'error');
    }
}

function renderFieldsGrid(fields) {
    const container = document.getElementById('fields-container');
    if (!container) return;

    if (fields.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; background: #fff; border-radius: var(--border-radius);">
                <h3>No Fields Registered Yet</h3>
                <p style="color: var(--text-muted); margin: 0.5rem 0 1.5rem;">Add your agricultural land parcels to monitor soil conditions and crops.</p>
                <button onclick="openAddFieldModal()" class="btn btn-primary">+ Add New Field</button>
            </div>
        `;
        return;
    }

    container.innerHTML = fields.map(f => {
        const isIrrigationReq = f.irrigationStatus === 'Irrigation Required';
        const badgeClass = isIrrigationReq ? 'badge-danger' : (f.latestSoilMoisture != null ? 'badge-success' : 'badge-secondary');
        const statusLabel = f.irrigationStatus || 'No Readings';
        const moistureText = f.latestSoilMoisture != null ? `${f.latestSoilMoisture.toFixed(1)}%` : '--';

        return `
            <div class="card" style="margin-bottom:0; display:flex; flex-direction:column; justify-content:space-between;">
                <div>
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.75rem;">
                        <h3 style="font-size:1.25rem; margin:0;">${f.fieldName}</h3>
                        <span class="badge ${badgeClass}">${statusLabel}</span>
                    </div>
                    <div style="font-size:0.9rem; color:var(--text-muted); margin-bottom:1rem;">
                        📍 <strong>Location:</strong> ${f.location}
                    </div>

                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem; font-size:0.85rem; background:#f8f9fa; padding:0.75rem; border-radius:6px; margin-bottom:1rem;">
                        <div>📐 <strong>Area:</strong> ${f.area} acres</div>
                        <div>🌱 <strong>Soil Type:</strong> ${f.soilType}</div>
                        <div>🌾 <strong>Crops:</strong> ${f.cropCount}</div>
                        <div>💧 <strong>Moisture:</strong> ${moistureText}</div>
                    </div>
                </div>

                <div style="display:flex; gap:0.5rem; border-top:1px solid var(--border-color); padding-top:0.75rem;">
                    <a href="monitoring.html?fieldId=${f.fieldId}" class="btn btn-sm btn-primary" style="flex:1;">Record Data</a>
                    <button onclick="openEditFieldModal(${f.fieldId})" class="btn btn-sm btn-secondary">Edit</button>
                    <button onclick="deleteField(${f.fieldId}, '${f.fieldName}')" class="btn btn-sm btn-danger">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

function openAddFieldModal() {
    document.getElementById('modal-title').textContent = 'Add New Field';
    document.getElementById('field-id').value = '';
    document.getElementById('field-form').reset();
    document.getElementById('field-modal').classList.add('show');
}

function openEditFieldModal(fieldId) {
    const field = currentFields.find(f => f.fieldId === fieldId);
    if (!field) return;

    document.getElementById('modal-title').textContent = 'Edit Field';
    document.getElementById('field-id').value = field.fieldId;
    document.getElementById('field-name').value = field.fieldName;
    document.getElementById('field-location').value = field.location;
    document.getElementById('field-area').value = field.area;
    document.getElementById('field-soil-type').value = field.soilType;
    document.getElementById('field-modal').classList.add('show');
}

function closeFieldModal() {
    document.getElementById('field-modal').classList.remove('show');
}

async function handleSaveField(e) {
    e.preventDefault();
    const id = document.getElementById('field-id').value;
    const fieldName = document.getElementById('field-name').value.trim();
    const location = document.getElementById('field-location').value.trim();
    const area = parseFloat(document.getElementById('field-area').value);
    const soilType = document.getElementById('field-soil-type').value;

    if (!fieldName || !location || isNaN(area) || area <= 0 || !soilType) {
        showToast('Please provide valid field details.', 'error');
        return;
    }

    const payload = { fieldName, location, area, soilType };

    try {
        if (id) {
            await apiRequest(`/fields/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
            showToast('Field updated successfully', 'success');
        } else {
            await apiRequest('/fields', { method: 'POST', body: JSON.stringify(payload) });
            showToast('Field created successfully', 'success');
        }
        closeFieldModal();
        await loadFields();
    } catch (err) {
        showToast('Error saving field: ' + err.message, 'error');
    }
}

async function deleteField(fieldId, fieldName) {
    if (!confirm(`Are you sure you want to delete "${fieldName}"? This will also remove associated crops and monitoring history.`)) {
        return;
    }

    try {
        await apiRequest(`/fields/${fieldId}`, { method: 'DELETE' });
        showToast(`Field "${fieldName}" deleted`, 'success');
        await loadFields();
    } catch (err) {
        showToast('Failed to delete field: ' + err.message, 'error');
    }
}

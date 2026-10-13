/**
 * Admin Crop Agronomic Criteria Management
 */

let criteriaList = [];

document.addEventListener('DOMContentLoaded', async () => {
    if (!Auth.requireAuth('ADMINISTRATOR')) return;
    renderNavUser();
    await loadCriteria();

    const form = document.getElementById('criteria-form');
    if (form) {
        form.addEventListener('submit', handleSaveCriteria);
    }
});

async function loadCriteria() {
    try {
        const res = await apiRequest('/admin/crop-requirements');
        criteriaList = res.data || [];
        renderCriteriaTable(criteriaList);
    } catch (err) {
        showToast('Failed to load crop requirements: ' + err.message, 'error');
    }
}

function renderCriteriaTable(list) {
    const tbody = document.getElementById('criteria-tbody');
    if (!tbody) return;

    const isTe = typeof I18n !== 'undefined' && I18n.getLanguage() === 'te';

    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--text-muted);">${isTe ? 'పంట ప్రమాణాలు ఏవీ లేవు. "+ కొత్త పంట ప్రమాణం జోడించండి" పై క్లిక్ చేయండి.' : 'No crop criteria configured. Click "+ Add New Crop Criteria".'}</td></tr>`;
        return;
    }

    const editBtnText = isTe ? 'సవరించండి' : 'Edit';
    const deleteBtnText = isTe ? 'తొలగించండి' : 'Delete';

    tbody.innerHTML = list.map(c => `
        <tr>
            <td><strong>🌾 ${c.cropName}</strong></td>
            <td>${c.minimumTemperature}°C - ${c.maximumTemperature}°C</td>
            <td>${c.minimumHumidity}% - ${c.maximumHumidity}%</td>
            <td>${c.minimumSoilMoisture}% - ${c.maximumSoilMoisture}%</td>
            <td><code>${c.suitableSoilType}</code></td>
            <td>
                <button onclick="openEditRequirementModal(${c.requirementId})" class="btn btn-sm btn-secondary">${editBtnText}</button>
                <button onclick="deleteRequirement(${c.requirementId}, '${c.cropName}')" class="btn btn-sm btn-danger">${deleteBtnText}</button>
            </td>
        </tr>
    `).join('');

    if (typeof I18n !== 'undefined') {
        I18n.applyTranslations();
    }
}

function openAddRequirementModal() {
    const isTe = typeof I18n !== 'undefined' && I18n.getLanguage() === 'te';
    document.getElementById('criteria-modal-title').textContent = isTe ? 'కొత్త పంట ప్రమాణాన్ని జోడించండి' : 'Add Crop Requirement';
    document.getElementById('criteria-id').value = '';
    document.getElementById('criteria-form').reset();
    document.getElementById('criteria-modal').classList.add('show');
}

function openEditRequirementModal(id) {
    const item = criteriaList.find(c => c.requirementId === id);
    if (!item) return;

    const isTe = typeof I18n !== 'undefined' && I18n.getLanguage() === 'te';
    document.getElementById('criteria-modal-title').textContent = isTe ? 'పంట ప్రమాణాన్ని సవరించండి: ' + item.cropName : 'Edit Crop Requirement: ' + item.cropName;
    document.getElementById('criteria-id').value = item.requirementId;
    document.getElementById('crit-crop-name').value = item.cropName;
    document.getElementById('crit-min-temp').value = item.minimumTemperature;
    document.getElementById('crit-max-temp').value = item.maximumTemperature;
    document.getElementById('crit-min-hum').value = item.minimumHumidity;
    document.getElementById('crit-max-hum').value = item.maximumHumidity;
    document.getElementById('crit-min-moist').value = item.minimumSoilMoisture;
    document.getElementById('crit-max-moist').value = item.maximumSoilMoisture;
    document.getElementById('crit-soil-type').value = item.suitableSoilType;
    document.getElementById('criteria-modal').classList.add('show');
}

function closeCriteriaModal() {
    document.getElementById('criteria-modal').classList.remove('show');
}

async function handleSaveCriteria(e) {
    e.preventDefault();
    const id = document.getElementById('criteria-id').value;
    const cropName = document.getElementById('crit-crop-name').value.trim();
    const minTemp = parseFloat(document.getElementById('crit-min-temp').value);
    const maxTemp = parseFloat(document.getElementById('crit-max-temp').value);
    const minHum = parseFloat(document.getElementById('crit-min-hum').value);
    const maxHum = parseFloat(document.getElementById('crit-max-hum').value);
    const minMoist = parseFloat(document.getElementById('crit-min-moist').value);
    const maxMoist = parseFloat(document.getElementById('crit-max-moist').value);
    const soilType = document.getElementById('crit-soil-type').value.trim();

    if (!cropName || isNaN(minTemp) || isNaN(maxTemp) || !soilType) {
        showToast('Please fill all required criteria fields.', 'error');
        return;
    }

    const payload = {
        cropName,
        minimumTemperature: minTemp,
        maximumTemperature: maxTemp,
        minimumHumidity: minHum,
        maximumHumidity: maxHum,
        minimumSoilMoisture: minMoist,
        maximumSoilMoisture: maxMoist,
        suitableSoilType: soilType
    };

    try {
        if (id) {
            await apiRequest(`/admin/crop-requirements/${id}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
            showToast('Crop criteria updated successfully', 'success');
        } else {
            await apiRequest('/admin/crop-requirements', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            showToast('New crop criteria added to knowledge base', 'success');
        }
        closeCriteriaModal();
        await loadCriteria();
    } catch (err) {
        showToast('Failed to save criteria: ' + err.message, 'error');
    }
}

async function deleteRequirement(id, name) {
    const isTe = typeof I18n !== 'undefined' && I18n.getLanguage() === 'te';
    const confirmMsg = isTe 
        ? `మీరు "${name}" ప్రమాణాన్ని తొలగించాలనుకుంటున్నారా?`
        : `Are you sure you want to remove criteria for "${name}"?`;

    if (!confirm(confirmMsg)) {
        return;
    }

    try {
        await apiRequest(`/admin/crop-requirements/${id}`, { method: 'DELETE' });
        showToast(isTe ? `"${name}" ప్రమాణం తొలగించబడింది` : `Removed criteria for "${name}"`, 'success');
        await loadCriteria();
    } catch (err) {
        showToast('Failed to delete criteria: ' + err.message, 'error');
    }
}

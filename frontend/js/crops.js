/**
 * Crop Management Logic
 */

let currentCrops = [];
let userFields = [];

document.addEventListener('DOMContentLoaded', async () => {
    if (!Auth.requireAuth()) return;
    renderNavUser();
    await loadFieldsForDropdown();
    await loadCrops();

    const cropForm = document.getElementById('crop-form');
    if (cropForm) {
        cropForm.addEventListener('submit', handleSaveCrop);
    }

    const filterSelect = document.getElementById('field-filter');
    if (filterSelect) {
        filterSelect.addEventListener('change', () => {
            const selectedFieldId = filterSelect.value;
            if (selectedFieldId) {
                loadCrops(selectedFieldId);
            } else {
                loadCrops();
            }
        });
    }
});

async function loadFieldsForDropdown() {
    try {
        const response = await apiRequest('/fields');
        userFields = response.data || [];

        // Populate modal field select
        const modalSelect = document.getElementById('crop-field-id');
        if (modalSelect) {
            modalSelect.innerHTML = '<option value="">-- Select Field --</option>' +
                userFields.map(f => `<option value="${f.fieldId}">${f.fieldName} (${f.location})</option>`).join('');
        }

        // Populate filter dropdown
        const filterSelect = document.getElementById('field-filter');
        if (filterSelect) {
            filterSelect.innerHTML = '<option value="">All Fields</option>' +
                userFields.map(f => `<option value="${f.fieldId}">${f.fieldName}</option>`).join('');
        }
    } catch (err) {
        console.error('Failed to load fields:', err);
    }
}

async function loadCrops(fieldId = null) {
    try {
        const endpoint = fieldId ? `/crops?fieldId=${fieldId}` : '/crops';
        const response = await apiRequest(endpoint);
        currentCrops = response.data || [];
        renderCropsTable(currentCrops);
    } catch (err) {
        showToast('Failed to load crops: ' + err.message, 'error');
    }
}

function renderCropsTable(crops) {
    const tbody = document.getElementById('crops-tbody');
    if (!tbody) return;

    if (crops.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--text-muted);">No crops found. Click "+ Add Crop" to record your crop.</td></tr>`;
        return;
    }

    tbody.innerHTML = crops.map(c => `
        <tr>
            <td><strong>🌾 ${c.cropName}</strong></td>
            <td>${c.fieldName || 'Field #' + c.fieldId}</td>
            <td>${c.plantingDate || 'N/A'}</td>
            <td>${c.expectedHarvestDate || 'N/A'}</td>
            <td><span class="badge badge-info">${c.cropStatus}</span></td>
            <td>
                <button onclick="openEditCropModal(${c.cropId})" class="btn btn-sm btn-secondary">Edit</button>
                <button onclick="deleteCrop(${c.cropId}, '${c.cropName}')" class="btn btn-sm btn-danger">Delete</button>
            </td>
        </tr>
    `).join('');
}

function openAddCropModal() {
    document.getElementById('crop-modal-title').textContent = 'Add New Crop';
    document.getElementById('crop-id').value = '';
    document.getElementById('crop-form').reset();
    document.getElementById('crop-planting-date').valueAsDate = new Date();
    document.getElementById('crop-modal').classList.add('show');
}

function openEditCropModal(cropId) {
    const crop = currentCrops.find(c => c.cropId === cropId);
    if (!crop) return;

    document.getElementById('crop-modal-title').textContent = 'Edit Crop Details';
    document.getElementById('crop-id').value = crop.cropId;
    document.getElementById('crop-name').value = crop.cropName;
    document.getElementById('crop-field-id').value = crop.fieldId;
    document.getElementById('crop-planting-date').value = crop.plantingDate || '';
    document.getElementById('crop-harvest-date').value = crop.expectedHarvestDate || '';
    document.getElementById('crop-status').value = crop.cropStatus || 'Growing';
    document.getElementById('crop-modal').classList.add('show');
}

function closeCropModal() {
    document.getElementById('crop-modal').classList.remove('show');
}

async function handleSaveCrop(e) {
    e.preventDefault();
    const id = document.getElementById('crop-id').value;
    const cropName = document.getElementById('crop-name').value.trim();
    const fieldId = parseInt(document.getElementById('crop-field-id').value);
    const plantingDate = document.getElementById('crop-planting-date').value;
    const expectedHarvestDate = document.getElementById('crop-harvest-date').value || null;
    const cropStatus = document.getElementById('crop-status').value;

    if (!cropName || !fieldId || !plantingDate || !cropStatus) {
        showToast('Please fill all required crop fields.', 'error');
        return;
    }

    const payload = { cropName, fieldId, plantingDate, expectedHarvestDate, cropStatus };

    try {
        if (id) {
            await apiRequest(`/crops/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
            showToast('Crop updated successfully', 'success');
        } else {
            await apiRequest('/crops', { method: 'POST', body: JSON.stringify(payload) });
            showToast('Crop recorded successfully', 'success');
        }
        closeCropModal();
        const filterSelect = document.getElementById('field-filter');
        await loadCrops(filterSelect && filterSelect.value ? filterSelect.value : null);
    } catch (err) {
        showToast('Error saving crop: ' + err.message, 'error');
    }
}

async function deleteCrop(cropId, cropName) {
    if (!confirm(`Are you sure you want to remove crop "${cropName}"?`)) return;

    try {
        await apiRequest(`/crops/${cropId}`, { method: 'DELETE' });
        showToast(`Crop "${cropName}" deleted`, 'success');
        const filterSelect = document.getElementById('field-filter');
        await loadCrops(filterSelect && filterSelect.value ? filterSelect.value : null);
    } catch (err) {
        showToast('Failed to delete crop: ' + err.message, 'error');
    }
}

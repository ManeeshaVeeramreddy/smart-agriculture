/**
 * Quick soil check: the farmer squeezes some soil and taps (or says) Dry / Moist / Wet.
 * No numbers to type. The app saves a reading and answers with advice, in text and voice.
 */
let qcFields = [];
let qcField = null;

const FEEL_WORDS = {
    WET:   ['wet', 'muddy', 'soggy', 'गीली', 'गीला', 'भीगी', 'తడి', 'బురద', 'நனைந்', 'சேறு', 'ஈரமான', 'ಒದ್ದೆ', 'ಕೆಸರು'],
    MOIST: ['moist', 'damp', 'normal', 'नम', 'नमी', 'తేమ', 'చెమ్మ', 'ஈரப்பதம்', 'லேசான', 'ತೇವ'],
    DRY:   ['dry', 'dusty', 'सूखी', 'सूखा', 'सुखी', 'ड्राई', 'పొడి', 'ఎండిన', 'வறண்ட', 'காய்', 'உலர்', 'ಒಣ']
};

/** Maps what the farmer said to DRY / MOIST / WET (or null). */
function detectFeel(text, alternatives) {
    const phrases = [text].concat(alternatives || []).filter(Boolean).map(s => s.toLowerCase());
    for (const p of phrases) {
        for (const feel of ['WET', 'MOIST', 'DRY']) {
            if (FEEL_WORDS[feel].some(w => p.includes(w))) return feel;
        }
    }
    return null;
}

function show(id) {
    ['step-field', 'step-feel', 'step-result'].forEach(s => document.getElementById(s).classList.toggle('hidden', s !== id));
}

document.addEventListener('DOMContentLoaded', async () => {
    if (!Auth.requireAuth('FARMER')) return;
    renderNavUser();

    document.getElementById('say-field').addEventListener('click', e => Voice.speak(t('qc_pick_field'), { button: e.currentTarget }));
    document.getElementById('say-feel').addEventListener('click', e =>
        Voice.speak([t('qc_squeeze'), t('qc_dry') + '. ' + t('qc_dry_desc'), t('qc_moist') + '. ' + t('qc_moist_desc'), t('qc_wet') + '. ' + t('qc_wet_desc')].join(' '), { button: e.currentTarget }));
    document.querySelectorAll('.choice[data-feel]').forEach(b => b.addEventListener('click', () => saveCheck(b.dataset.feel)));
    document.getElementById('feel-mic').addEventListener('click', listenForFeel);
    document.getElementById('check-another').addEventListener('click', () => { Voice.stop(); startFlow(true); });

    try {
        const res = await apiRequest('/advisory');
        qcFields = res.data || [];
    } catch (err) {
        showToast(err.message, 'error');
        return;
    }
    startFlow(false);
});

function startFlow(userGesture) {
    const params = new URLSearchParams(window.location.search);
    const wanted = params.get('fieldId');
    if (!qcFields.length) {
        const p = document.getElementById('qc-empty');
        p.innerHTML = `${t('no_fields')} <a href="fields.html">${t('add_field')}</a>`;
        p.classList.remove('hidden');
        return;
    }
    const preset = !userGesture && wanted ? qcFields.find(f => String(f.fieldId) === wanted) : null;
    if (preset) return chooseField(preset, false);
    if (qcFields.length === 1 && !userGesture) return chooseField(qcFields[0], false);

    document.getElementById('field-choices').innerHTML = qcFields.map(f => `
        <button type="button" class="choice" data-field="${f.fieldId}">
            <span class="choice-icon">🌱</span><span class="choice-label">${escapeHtml(f.fieldName)}</span>
            <span class="choice-desc">${escapeHtml(I18N.cropName((f.crops || []).join(', ')))} ${f.location ? '· ' + escapeHtml(f.location) : ''}</span>
        </button>`).join('');
    document.querySelectorAll('[data-field]').forEach(b => b.addEventListener('click', () =>
        chooseField(qcFields.find(f => String(f.fieldId) === b.dataset.field), true)));
    show('step-field');
}

function chooseField(field, spoken) {
    qcField = field;
    document.getElementById('chosen-field').textContent = '🌱 ' + field.fieldName;
    show('step-feel');
    if (spoken) document.getElementById('say-feel').click();   // allowed: we are inside a tap
}

function listenForFeel() {
    const btn = document.getElementById('feel-mic');
    btn.classList.add('listening');
    Voice.listen({
        onresult: (text, alts) => {
            const feel = detectFeel(text, alts);
            if (feel) saveCheck(feel); else { showToast(t('qc_not_heard'), 'error'); Voice.speak(t('qc_not_heard')); }
        },
        onerror: code => showToast(Voice.explainError(code), 'error'),
        onend: () => btn.classList.remove('listening')
    });
}

async function saveCheck(feel) {
    if (!qcField) return;
    Voice.stop();
    try {
        // temperature + humidity come from the weather service when online (the server falls back otherwise)
        const w = await Weather.forLocation(qcField.location);
        const body = { fieldId: qcField.fieldId, soilFeel: feel };
        if (w && w.tempC != null) { body.temperature = w.tempC; body.humidity = w.humidity; }
        await apiRequest('/monitoring/quick', { method: 'POST', body: JSON.stringify(body) });

        const adv = await Advisor.loadOne(qcField.fieldId);
        const lines = Advisor.sentences(adv);
        document.getElementById('result-title').textContent = Advisor.statusIcon(adv.status) + ' ' + adv.fieldName + ' — ' + Advisor.statusLabel(adv.status);
        document.getElementById('result-card-body').innerHTML = `<p class="meter-caption">${t('qc_saved')}</p><ul class="advice-list">` +
            adv.advice.map(a => `<li class="adv sev-${a.severity}"><span class="adv-icon">${Advisor.iconForCode(a.code, a.severity)}</span><span>${escapeHtml(I18N.adviceText(a))}</span></li>`).join('') + '</ul>';
        const speakText = t('qc_saved') + ' ' + lines.join(' ');
        const listenBtn = document.getElementById('result-listen');
        listenBtn.onclick = () => Voice.speak(speakText, { button: listenBtn });
        show('step-result');
        Voice.speak(speakText, { button: listenBtn });
    } catch (err) {
        showToast(err.message, 'error');
    }
}

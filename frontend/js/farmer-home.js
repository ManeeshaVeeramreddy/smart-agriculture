/**
 * "My Farm" - the farmer's home page: one colour-coded card per field with plain advice that can be read aloud.
 */
let farmFields = [];

document.addEventListener('DOMContentLoaded', async () => {
    if (!Auth.requireAuth('FARMER')) return;
    renderNavUser();
    const user = Auth.getUser();
    document.getElementById('greeting').textContent = t('greeting', { name: user ? user.name : '' });
    buildTiles();
    document.getElementById('listen-all').addEventListener('click', e =>
        Voice.speak(Advisor.spokenSummary(farmFields), { button: e.currentTarget }));
    await loadFarm();
});

function buildTiles() {
    const tiles = [
        ['quick-check.html', '🖐️', 'nav_check'], ['alerts.html', '🚨', 'nav_alerts'],
        ['recommendation.html', '💡', 'nav_reco'], ['fields.html', '🌱', 'nav_fields'],
        ['crops.html', '🌾', 'nav_crops'], ['monitoring-history.html', '📜', 'nav_history'],
        ['monitoring.html', '🌡️', 'nav_monitoring'], ['farmer-dashboard.html', '📊', 'nav_dashboard']
    ];
    document.getElementById('tile-grid').innerHTML = tiles.map(([href, icon, key]) =>
        `<a class="tile" href="${href}"><span class="tile-icon">${icon}</span><span>${t(key)}</span></a>`).join('');
}

async function loadFarm() {
    const box = document.getElementById('field-cards');
    try {
        farmFields = await Advisor.loadAll();
    } catch (err) {
        box.innerHTML = `<p>${escapeHtml(err.message)}</p>`;
        return;
    }
    renderWeather();
    if (!farmFields.length) {
        box.innerHTML = `<div class="field-card status-nodata"><p>${t('no_fields')}</p>
            <a class="big-btn" href="fields.html">🌱 ${t('add_field')}</a></div>`;
        return;
    }
    box.innerHTML = farmFields.map(cardHtml).join('');
    box.querySelectorAll('[data-listen]').forEach(btn => btn.addEventListener('click', () => {
        const f = farmFields.find(x => String(x.fieldId) === btn.dataset.listen);
        Voice.speak(Advisor.sentences(f).join(' '), { button: btn });
    }));
}

function renderWeather() {
    const strip = document.getElementById('weather-strip');
    const seen = {};
    const lines = [];
    farmFields.forEach(f => {
        const w = f.weather;
        if (w && !seen[w.place]) {
            seen[w.place] = 1;
            lines.push(`🌤️ ${t('weather_line', { place: w.place, temp: w.tempC, humidity: w.humidity, rain: Math.round(w.rainChance) })}`);
        }
    });
    if (!lines.length && farmFields.length) lines.push('🌤️ ' + t('weather_unavailable'));
    if (lines.length) { strip.innerHTML = lines.map(escapeHtml).join('<br>'); strip.classList.remove('hidden'); }
}

function cardHtml(f) {
    const status = (f.status || 'NO_DATA').toLowerCase().replace('_', '');
    const crops = f.crops && f.crops.length ? I18N.cropName(f.crops.join(', ')) + ' · ' : '';
    const m = f.soilMoisture;
    const meter = m == null ? '' : `
        <div class="moisture-meter ${m < 30 ? 'low' : ''}" role="img" aria-label="${t('soil_label')} ${Math.round(m)}%">
            <div class="fill" style="width:${Math.max(2, Math.min(100, m))}%"></div><div class="tick" style="left:30%"></div>
        </div>
        <div class="meter-caption">💧 ${t('soil_label')}: ${Math.round(m)}%${f.lastReading ? ' · ' + formatDate(f.lastReading) : ''}</div>`;
    const items = (f.advice || []).map(a => `
        <li class="adv sev-${a.severity}"><span class="adv-icon">${Advisor.iconForCode(a.code, a.severity)}</span>
        <span>${escapeHtml(I18N.adviceText(a))}</span></li>`).join('');
    return `
    <article class="field-card status-${status}">
        <div class="fc-head">
            <span class="fc-icon">${Advisor.statusIcon(f.status)}</span>
            <div class="fc-title"><h3>${escapeHtml(f.fieldName)}</h3>
                <div class="fc-sub">${escapeHtml(crops)}${escapeHtml(f.location || '')} · ${f.area} acres</div></div>
            <span class="fc-badge">${Advisor.statusLabel(f.status)}</span>
        </div>
        ${meter}
        <ul class="advice-list">${items}</ul>
        <div class="fc-actions">
            <button type="button" class="big-btn" data-listen="${f.fieldId}">🔊 ${t('listen')}</button>
            <a class="big-btn secondary" href="quick-check.html?fieldId=${f.fieldId}">🖐️ ${t('check_soil_btn')}</a>
        </div>
    </article>`;
}

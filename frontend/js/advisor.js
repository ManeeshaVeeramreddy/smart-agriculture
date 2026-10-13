/**
 * SAMS - Loads the per-field advice from the backend, adds the weather, and makes it speakable.
 */
const Advisor = (() => {

    /** Adds weather-aware advice: if the field needs water but rain is coming, tell the farmer to wait. */
    function enrich(adv, weather) {
        const copy = Object.assign({}, adv, { weather: weather || null, advice: (adv.advice || []).slice() });
        const needsWater = copy.advice.some(a => a.code === 'IRRIGATE_NOW' || a.code === 'WATER_SOON');
        if (needsWater && Weather.rainExpected(weather)) {
            const idx = copy.advice.findIndex(a => a.code === 'IRRIGATE_NOW' || a.code === 'WATER_SOON');
            copy.advice.splice(idx + 1, 0, {
                code: 'RAIN_WAIT', severity: 'INFO',
                params: { field: copy.fieldName, chance: Math.round(weather.rainChance) },
                message: 'Rain is likely. Wait before watering.'
            });
            copy.rainWait = true;
        }
        return copy;
    }

    /** Fetches advice for all fields + weather for each distinct location (in parallel). */
    async function loadAll() {
        const res = await apiRequest('/advisory');
        const list = res.data || [];
        const places = [...new Set(list.map(f => (f.location || '').split(',')[0].trim()).filter(Boolean))];
        const weatherByPlace = {};
        await Promise.all(places.map(async p => { weatherByPlace[p] = await Weather.forLocation(p); }));
        return list.map(f => enrich(f, weatherByPlace[(f.location || '').split(',')[0].trim()]));
    }

    async function loadOne(fieldId) {
        const res = await apiRequest('/advisory/' + fieldId);
        const f = res.data;
        const w = await Weather.forLocation(f.location);
        return enrich(f, w);
    }

    function sentences(adv) {
        return (adv.advice || []).map(a => I18N.adviceText(a));
    }

    /** One paragraph covering all fields, for reading aloud. */
    function spokenSummary(fields) {
        if (!fields.length) return t('no_fields');
        return [t('summary_intro')].concat(fields.map(sentences).map(s => s.join(' '))).join(' ');
    }

    function statusIcon(status) {
        return { URGENT: '🚨', WATCH: '⚠️', GOOD: '✅', NO_DATA: '❓' }[status] || '❓';
    }

    function statusLabel(status) {
        return t({ URGENT: 'status_urgent', WATCH: 'status_watch', GOOD: 'status_good', NO_DATA: 'status_nodata' }[status] || 'status_nodata');
    }

    function severityIcon(sev) {
        return { URGENT: '💧', WARNING: '⚠️', INFO: 'ℹ️', GOOD: '✅' }[sev] || 'ℹ️';
    }

    function iconForCode(code, sev) {
        return ({ IRRIGATE_NOW: '💧', WATER_SOON: '🕒', TOO_WET: '🌊', HEAT_STRESS: '🌡️', COLD_RISK: '❄️',
                  DISEASE_RISK: '🍄', HARVEST_SOON: '🌾', NO_DATA: '❓', STALE_DATA: '📅', ALL_GOOD: '✅', RAIN_WAIT: '🌧️' })[code]
            || severityIcon(sev);
    }

    return { enrich, loadAll, loadOne, sentences, spokenSummary, statusIcon, statusLabel, iconForCode };
})();

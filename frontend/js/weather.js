/**
 * SAMS - Weather for a field's location using the free Open-Meteo service (no API key).
 * Needs internet; every call fails safely (returns null) so the app still works offline.
 */
const Weather = (() => {
    const TTL_MS = 30 * 60 * 1000;

    async function getJson(url) {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 7000);
        try {
            const res = await fetch(url, { signal: ctrl.signal });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return await res.json();
        } finally {
            clearTimeout(timer);
        }
    }

    function readCache(key) {
        try {
            const raw = JSON.parse(localStorage.getItem(key) || 'null');
            if (raw && Date.now() - raw.at < TTL_MS) return raw.data;
        } catch (e) { /* ignore */ }
        return undefined;
    }

    function writeCache(key, data) {
        try { localStorage.setItem(key, JSON.stringify({ at: Date.now(), data })); } catch (e) { /* ignore */ }
    }

    /** Returns { place, tempC, humidity, rainChance (0-100, today/tomorrow max), rainMm } or null. */
    async function forLocation(location) {
        const name = String(location || '').split(',')[0].trim();
        if (!name) return null;
        const key = 'sams_wx_' + name.toLowerCase();
        const cached = readCache(key);
        if (cached !== undefined) return cached;

        try {
            const geo = await getJson('https://geocoding-api.open-meteo.com/v1/search?count=1&language=en&format=json&name=' + encodeURIComponent(name));
            const hit = geo && geo.results && geo.results[0];
            if (!hit) return null;
            const wx = await getJson('https://api.open-meteo.com/v1/forecast?latitude=' + hit.latitude + '&longitude=' + hit.longitude +
                '&current=temperature_2m,relative_humidity_2m&daily=precipitation_probability_max,precipitation_sum&forecast_days=2&timezone=auto');
            const probs = (wx.daily && wx.daily.precipitation_probability_max) || [];
            const sums = (wx.daily && wx.daily.precipitation_sum) || [];
            const result = {
                place: hit.name || name,
                tempC: wx.current ? Math.round(wx.current.temperature_2m) : null,
                humidity: wx.current ? Math.round(wx.current.relative_humidity_2m) : null,
                rainChance: probs.length ? Math.max.apply(null, probs.map(Number)) : 0,
                rainMm: sums.reduce((a, b) => a + (Number(b) || 0), 0)
            };
            writeCache(key, result);
            return result;
        } catch (e) {
            console.warn('Weather unavailable:', e.message);
            return null;
        }
    }

    /** Rain worth waiting for: likely (60%+) or a meaningful amount (5 mm+). */
    function rainExpected(w) {
        return !!w && (w.rainChance >= 60 || w.rainMm >= 5);
    }

    return { forLocation, rainExpected };
})();

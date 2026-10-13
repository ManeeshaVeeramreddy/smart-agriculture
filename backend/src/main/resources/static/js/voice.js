/**
 * SAMS - Voice layer (no API keys, no extra libraries)
 *   Voice.speak(text)        read text aloud in the farmer's language (browser speech synthesis)
 *   Voice.listen({...})      listen to the farmer (browser speech recognition, Chrome/Edge)
 *   Voice.attachDictation()  adds a 🎤 button to a text box so it can be filled by speaking
 * Works best in Chrome on Android. Speech recognition needs internet and HTTPS (or localhost).
 */
const Voice = (() => {
    const synth = window.speechSynthesis || null;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;
    let queue = [];            // keeps utterances referenced (avoids a Chrome garbage-collection bug)
    let warnedNoVoice = false;
    let recognition = null;

    const supportsSpeech = !!synth;
    const supportsListening = !!SR;

    function findVoice(speechCode) {
        if (!synth) return null;
        const voices = synth.getVoices() || [];
        if (!voices.length) return undefined;                       // not loaded yet
        const norm = s => (s || '').toLowerCase().replace('_', '-');
        const want = norm(speechCode);
        const prefix = want.split('-')[0];
        return voices.find(v => norm(v.lang) === want)
            || voices.find(v => norm(v.lang).startsWith(prefix))
            || null;                                                // loaded, but no voice for this language
    }

    function chunk(text) {
        const parts = String(text).replace(/\s+/g, ' ').split(/(?<=[.!?।])\s+/);
        const out = [];
        let cur = '';
        parts.forEach(p => {
            if ((cur + ' ' + p).length > 170 && cur) { out.push(cur.trim()); cur = p; }
            else { cur = cur ? cur + ' ' + p : p; }
        });
        if (cur.trim()) out.push(cur.trim());
        return out;
    }

    function stop() {
        if (synth) { synth.cancel(); }
        queue = [];
        document.querySelectorAll('.speaking').forEach(el => el.classList.remove('speaking'));
    }

    /** Reads text aloud. opts: { lang: 'te', onend: fn, button: element to highlight } */
    function speak(text, opts = {}) {
        if (!text) return;
        if (!synth) {
            showToast(t('v_unsupported'), 'error');
            return;
        }
        stopListening();
        stop();
        const lang = opts.lang || I18N.get();
        const speechCode = I18N.speechCode(lang);
        const voice = findVoice(speechCode);
        if (voice === null && !warnedNoVoice && lang !== 'en') {
            warnedNoVoice = true;
            showToast(t('v_no_voice'), 'error');
        }

        const pieces = chunk(text);
        if (opts.button) opts.button.classList.add('speaking');
        // small delay: Chrome ignores speak() issued in the same tick as cancel()
        setTimeout(() => {
            pieces.forEach((piece, i) => {
                const u = new SpeechSynthesisUtterance(piece);
                u.lang = speechCode;
                if (voice) u.voice = voice;
                u.rate = 0.9;
                u.pitch = 1;
                if (i === pieces.length - 1) {
                    u.onend = u.onerror = () => {
                        if (opts.button) opts.button.classList.remove('speaking');
                        if (opts.onend) opts.onend();
                    };
                }
                queue.push(u);
                synth.speak(u);
            });
        }, 60);
    }

    function stopListening() {
        if (recognition) {
            try { recognition.abort(); } catch (e) { /* ignore */ }
            recognition = null;
        }
    }

    /**
     * Listens once. opts: { lang, onstart, onresult(text, alternatives), onerror(code), onend }
     * Error codes: unsupported, not-allowed, no-speech, network, other browser codes.
     */
    function listen(opts = {}) {
        if (!SR) {
            if (opts.onerror) opts.onerror('unsupported');
            return null;
        }
        stop();
        stopListening();
        const r = new SR();
        r.lang = opts.lang || I18N.speechCode();
        r.interimResults = false;
        r.maxAlternatives = 3;
        r.continuous = false;
        let gotResult = false;
        r.onstart = () => opts.onstart && opts.onstart();
        r.onresult = e => {
            gotResult = true;
            const alts = Array.from(e.results[0]).map(a => a.transcript);
            if (opts.onresult) opts.onresult(alts[0], alts);
        };
        r.onerror = e => { if (opts.onerror) opts.onerror(e.error); };
        r.onend = () => {
            if (recognition === r) recognition = null;
            if (opts.onend) opts.onend(gotResult);
        };
        recognition = r;
        try { r.start(); } catch (e) { if (opts.onerror) opts.onerror('other'); }
        return r;
    }

    function explainError(code) {
        if (code === 'unsupported') return t('v_unsupported');
        if (code === 'not-allowed' || code === 'service-not-allowed') return t('v_mic_blocked');
        if (code === 'no-speech' || code === 'aborted') return t('v_no_speech');
        if (code === 'network') return t('v_network');
        return t('v_no_speech');
    }

    // ---- spoken numbers -> digits (best effort; Chrome already returns digits for most numbers)
    const NATIVE_DIGITS = { '०':0,'१':1,'२':2,'३':3,'४':4,'५':5,'६':6,'७':7,'८':8,'९':9,
        '౦':0,'౧':1,'౨':2,'౩':3,'౪':4,'౫':5,'౬':6,'౭':7,'౮':8,'౯':9,
        '௦':0,'௧':1,'௨':2,'௩':3,'௪':4,'௫':5,'௬':6,'௭':7,'௮':8,'௯':9,
        '೦':0,'೧':1,'೨':2,'೩':3,'೪':4,'೫':5,'೬':6,'೭':7,'೮':8,'೯':9 };
    const WORD_DIGITS = { zero:0, oh:0, o:0, one:1, two:2, to:2, too:2, three:3, four:4, for:4, five:5, six:6, seven:7, eight:8, nine:9 };

    function toDigits(text, { keepDecimal = false } = {}) {
        let s = String(text).toLowerCase().replace(/[०-९౦-౯௦-௯೦-೯]/g, d => NATIVE_DIGITS[d]);
        s = s.replace(/\bpoint\b|\bdot\b/g, '.');
        s = s.split(/\s+/).map(w => (w in WORD_DIGITS ? String(WORD_DIGITS[w]) : w)).join(' ');
        const allowed = keepDecimal ? /[^0-9.\-]/g : /[^0-9+]/g;
        return s.replace(allowed, '');
    }

    /** Adds a small 🎤 button inside a text box. Numbers/phone boxes are filled with digits only. */
    function attachDictation(input) {
        if (!input || input.dataset.voiceReady) return;
        input.dataset.voiceReady = '1';
        const wrap = document.createElement('div');
        wrap.className = 'voice-input';
        input.parentNode.insertBefore(wrap, input);
        wrap.appendChild(input);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'voice-input-btn';
        btn.textContent = '🎤';
        btn.setAttribute('aria-label', t('ask_voice'));
        wrap.appendChild(btn);

        btn.addEventListener('click', () => {
            if (!supportsListening) { showToast(t('v_unsupported'), 'error'); return; }
            btn.classList.add('listening');
            listen({
                onresult: text => {
                    if (input.type === 'number') {
                        input.value = toDigits(text, { keepDecimal: true });
                    } else if (input.type === 'tel') {
                        input.value = toDigits(text);
                    } else {
                        input.value = text.replace(/[.]$/, '');
                    }
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                },
                onerror: code => showToast(explainError(code), 'error'),
                onend: () => btn.classList.remove('listening')
            });
        });
    }

    if (synth && synth.addEventListener) {
        synth.addEventListener('voiceschanged', () => { /* voices ready; findVoice() reads them lazily */ });
    }

    return { speak, stop, listen, stopListening, attachDictation, explainError, toDigits,
             supportsSpeech, supportsListening };
})();

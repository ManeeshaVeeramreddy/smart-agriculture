/**
 * SAMS - Voice assistant ("Ask by voice").
 * The farmer taps the big microphone and asks in their own language. Questions are matched by simple,
 * transparent keyword rules (no AI service needed), answered in text AND read aloud.
 */
const Assistant = (() => {

    /* keyword lists mix all five languages (native script + common spellings in English letters) */
    const KEYWORDS = {
        help:    ['help', 'what can', 'मदद', 'सहायता', 'సహాయం', 'உதவி', 'ಸಹಾಯ'],
        rain:    ['rain', 'weather', 'forecast', 'बारिश', 'बरसात', 'मौसम', 'వర్ష', 'వాతావరణ', 'மழை', 'வானிலை', 'ಮಳೆ', 'ಹವಾಮಾನ', 'baarish', 'barish', 'varsham', 'mazhai'],
        water:   ['water', 'irrigat', 'pump', 'पानी', 'सिंचाई', 'నీరు', 'నీళ్ల', 'నీటి', 'సాగునీరు', 'தண்ணீர்', 'நீர்', 'பாசன', 'ನೀರು', 'ನೀರಾವರಿ', 'pani', 'neeru', 'thanni'],
        alerts:  ['alert', 'warning', 'problem', 'danger', 'चेतावनी', 'समस्या', 'హెచ్చరిక', 'సమస్య', 'எச்சரிக்கை', 'பிரச்சனை', 'ಎಚ್ಚರಿಕೆ', 'ಸಮಸ್ಯೆ'],
        crop:    ['crop', 'grow', 'sow', 'recommend', 'फसल', 'उगा', 'పంట', 'వేయాలి', 'பயிர்', 'பயிரிட', 'ಬೆಳೆ'],
        check:   ['check', 'test', 'soil', 'जाँच', 'जांच', 'मिट्टी', 'నేల', 'పరీక్ష', 'மண்', 'சோதன', 'ಮಣ್ಣು', 'ಪರೀಕ್ಷೆ'],
        history: ['history', 'record', 'पुराना', 'रिकॉर्ड', 'రికార్డ్', 'చరిత్ర', 'பதிவு', 'வரலாறு', 'ದಾಖಲೆ', 'ಇತಿಹಾಸ'],
        status:  ['field', 'farm', 'status', 'condition', 'advice', 'today', 'how', 'खेत', 'हाल', 'सलाह', 'పొలం', 'స్థితి', 'సలహా', 'வயல்', 'நிலை', 'ஆலோசனை', 'ಹೊಲ', 'ಸ್ಥಿತಿ', 'ಸಲಹೆ']
    };
    const ORDER = ['help', 'rain', 'water', 'alerts', 'crop', 'check', 'history', 'status'];
    const PAGES = {
        crop:    { href: 'recommendation.html',     label: 'nav_reco' },
        check:   { href: 'quick-check.html',        label: 'nav_check' },
        history: { href: 'monitoring-history.html', label: 'nav_history' }
    };

    /** Returns the intent name for a spoken sentence (or null). Tries every alternative the browser heard. */
    function detect(text, alternatives) {
        const candidates = [text].concat(alternatives || []).filter(Boolean).map(s => s.toLowerCase());
        for (const phrase of candidates) {
            for (const intent of ORDER) {
                if (KEYWORDS[intent].some(k => phrase.includes(k))) return intent;
            }
        }
        return null;
    }

    let panel, heardEl, answerEl, titleEl, listenBtn, micBtn, lastAnswer = '';

    function mount() {
        if (document.getElementById('sams-voice-fab')) return;
        const fab = document.createElement('div');
        fab.className = 'voice-fab';
        fab.id = 'sams-voice-fab';
        fab.innerHTML = `
            <button type="button" class="voice-fab-read" id="vf-read">🔊 <span>${t('read_page')}</span></button>
            <button type="button" class="voice-fab-main" id="vf-mic"><span class="mic">🎤</span><span>${t('ask_voice')}</span></button>`;
        document.body.appendChild(fab);

        panel = document.createElement('div');
        panel.className = 'voice-panel';
        panel.innerHTML = `
            <button type="button" class="vp-close" aria-label="close">✕</button>
            <h4 id="vp-title"></h4>
            <div class="vp-heard" id="vp-heard"></div>
            <div class="vp-answer" id="vp-answer"></div>
            <div class="vp-row">
                <button type="button" class="big-btn" id="vp-listen">🔊 ${t('listen')}</button>
                <button type="button" class="big-btn secondary" id="vp-again">🎤 ${t('ask_voice')}</button>
                <input class="vp-type" id="vp-type" type="text" placeholder="⌨️ …">
            </div>`;
        document.body.appendChild(panel);

        titleEl = panel.querySelector('#vp-title');
        heardEl = panel.querySelector('#vp-heard');
        answerEl = panel.querySelector('#vp-answer');
        listenBtn = panel.querySelector('#vp-listen');
        micBtn = fab.querySelector('#vf-mic');

        micBtn.addEventListener('click', startListening);
        panel.querySelector('#vp-again').addEventListener('click', startListening);
        panel.querySelector('.vp-close').addEventListener('click', closePanel);
        listenBtn.addEventListener('click', () => Voice.speak(lastAnswer, { button: listenBtn }));
        panel.querySelector('#vp-type').addEventListener('keydown', e => {
            if (e.key === 'Enter' && e.target.value.trim()) { handle(e.target.value.trim(), []); e.target.value = ''; }
        });
        fab.querySelector('#vf-read').addEventListener('click', e => readPage(e.currentTarget));
    }

    function openPanel() { panel.classList.add('open'); }
    function closePanel() { Voice.stop(); Voice.stopListening(); micBtn.classList.remove('listening'); panel.classList.remove('open'); }

    function show(title, heard, answer) {
        titleEl.textContent = title || '';
        heardEl.textContent = heard ? t('v_you_said') + ': "' + heard + '"' : '';
        answerEl.textContent = answer || '';
        lastAnswer = answer || '';
        openPanel();
    }

    function startListening() {
        show(t('v_listening'), '', t('v_help'));
        micBtn.classList.add('listening');
        Voice.listen({
            onresult: (text, alts) => handle(text, alts),
            onerror: code => { micBtn.classList.remove('listening'); show('🎤', '', Voice.explainError(code) + ' ' + t('v_help')); },
            onend: () => micBtn.classList.remove('listening')
        });
    }

    function readPage(btn) {
        const main = document.querySelector('.main-content');
        if (!main) return;
        const text = main.innerText.replace(/[\u{1F300}-\u{1FAFF}☀-➿]/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, 1800);
        Voice.speak(text, { button: btn });
    }

    async function handle(text, alts) {
        micBtn.classList.remove('listening');
        const intent = detect(text, alts);
        if (!intent) {
            const msg = t('v_didnt') + ' ' + t('v_help');
            show('🤔', text, msg);
            Voice.speak(msg);
            return;
        }
        if (intent === 'help') { return answer(text, t('v_help')); }
        if (PAGES[intent]) {
            const msg = t('v_opening', { page: t(PAGES[intent].label) });
            answer(text, msg);
            setTimeout(() => { window.location.href = PAGES[intent].href; }, 1500);
            return;
        }
        show(t('loading'), text, '');
        let fields;
        try {
            fields = await Advisor.loadAll();
        } catch (err) {
            return answer(text, err.message);
        }
        answer(text, compose(intent, fields));
    }

    function answer(heard, msg) {
        show('🌾 ' + t('app_name'), heard, msg);
        Voice.speak(msg, { button: listenBtn });
    }

    /** Builds the spoken answer for the data-driven intents. Exposed for testing. */
    function compose(intent, fields) {
        if (!fields.length) return t('no_fields');
        const line = a => I18N.adviceText(a);
        if (intent === 'status') return Advisor.spokenSummary(fields);
        if (intent === 'water') {
            const codes = ['IRRIGATE_NOW', 'WATER_SOON', 'TOO_WET', 'RAIN_WAIT'];
            const lines = [];
            fields.forEach(f => f.advice.filter(a => codes.includes(a.code)).forEach(a => lines.push(line(a))));
            return lines.length ? lines.join(' ') : t('v_water_none');
        }
        if (intent === 'alerts') {
            const lines = [];
            fields.forEach(f => f.advice.filter(a => a.severity === 'URGENT' || a.severity === 'WARNING').forEach(a => lines.push(line(a))));
            return lines.length ? lines.join(' ') : t('v_no_warnings');
        }
        if (intent === 'rain') {
            const seen = {};
            const lines = [];
            fields.forEach(f => {
                if (f.weather && !seen[f.weather.place]) {
                    seen[f.weather.place] = 1;
                    lines.push(t('v_rain_line', { place: f.weather.place, rain: Math.round(f.weather.rainChance) }));
                }
            });
            return lines.length ? lines.join(' ') : t('weather_unavailable');
        }
        return Advisor.spokenSummary(fields);
    }

    return { mount, detect, compose };
})();

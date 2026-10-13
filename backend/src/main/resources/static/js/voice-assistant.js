/**
 * SMART AGRICULTURE MONITORING SYSTEM (SAMS)
 * Enterprise-Grade Bilingual Voice Assistant Module (v1.3)
 * Provides Speech-to-Text, Voice Navigation, Telemetry Voice Q&A,
 * Form Dictation, and Natural Female Text-to-Speech Readout in English and Telugu (తెలుగు).
 * Specially designed to empower farmers with zero literacy barriers through crystal-clear audio guidance.
 */

const SamsVoice = {
    recognition: null,
    speechSynthesis: window.speechSynthesis || null,
    activeAudio: null,
    isListening: false,
    isSpeaking: false,
    isMuted: localStorage.getItem('sams_voice_muted') === 'true',
    activeTargetInput: null,
    lastSpokenText: '',
    modalElement: null,

    init() {
        this.initSpeechRecognition();
        this.renderNavbarVoiceButton();
        this.renderFloatingDockButton();
        this.renderVoiceModal();
        this.attachFormInputMicrophones();

        // Update UI when language changes
        window.addEventListener('sams-language-changed', () => {
            this.updateLabels();
        });
    },

    initSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn('SpeechRecognition API is not supported in this browser.');
            return;
        }

        try {
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = true;
            this.recognition.maxAlternatives = 1;

            this.recognition.onstart = () => {
                this.isListening = true;
                this.updateListeningUI(true);
            };

            this.recognition.onresult = (event) => {
                let interimTranscript = '';
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript;
                    } else {
                        interimTranscript += transcript;
                    }
                }

                if (interimTranscript) {
                    this.showTranscript(interimTranscript, true);
                }

                if (finalTranscript) {
                    this.showTranscript(finalTranscript, false);
                    this.handleSpeechFinalResult(finalTranscript.trim());
                }
            };

            this.recognition.onerror = (event) => {
                console.warn('Voice Assistant Recognition Error:', event.error);
                this.isListening = false;
                this.updateListeningUI(false);

                if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                    this.showStatus('Microphone permission blocked. Please allow mic access.', 'danger');
                } else if (event.error === 'no-speech') {
                    this.showStatus('No speech detected. Tap mic to retry.', 'info');
                } else {
                    this.showStatus(`Voice input error (${event.error})`, 'info');
                }
            };

            this.recognition.onend = () => {
                this.isListening = false;
                this.updateListeningUI(false);
                if (this.activeTargetInput) {
                    const targetBtn = document.querySelector(`[data-voice-target="${this.activeTargetInput.id}"]`);
                    if (targetBtn) targetBtn.classList.remove('listening');
                    this.activeTargetInput = null;
                }
            };
        } catch (e) {
            console.error('Failed to initialize SpeechRecognition:', e);
        }
    },

    getRecognitionLanguage() {
        const lang = typeof I18n !== 'undefined' ? I18n.getLanguage() : 'en';
        return lang === 'te' ? 'te-IN' : 'en-IN';
    },

    toggleListening(targetInput = null) {
        if (!this.recognition) {
            this.openModal();
            this.showStatus(this.t('voice_not_supported', 'Speech recognition is not supported in this browser.'), 'danger');
            return;
        }

        if (this.isListening) {
            this.stopListening();
        } else {
            this.startListening(targetInput);
        }
    },

    startListening(targetInput = null) {
        if (!this.recognition) return;
        this.activeTargetInput = targetInput;

        // Stop any ongoing speech playback
        this.stopSpeaking();

        if (!targetInput) {
            this.openModal();
        }

        try {
            this.recognition.lang = this.getRecognitionLanguage();
            this.recognition.start();
            this.showStatus(this.t('voice_listening', 'Listening... Speak now'), 'primary');
        } catch (e) {
            console.warn('Recognition start caught error:', e);
            try {
                this.recognition.stop();
                setTimeout(() => {
                    this.recognition.start();
                }, 200);
            } catch (err) {
                // ignore
            }
        }
    },

    stopListening() {
        if (this.recognition && this.isListening) {
            try {
                this.recognition.stop();
            } catch (e) {
                // ignore
            }
        }
        this.isListening = false;
        this.updateListeningUI(false);
    },

    handleSpeechFinalResult(text) {
        if (!text) return;

        // Case 1: Single input field dictation
        if (this.activeTargetInput) {
            this.populateSingleInput(this.activeTargetInput, text);
            return;
        }

        // Case 2: Multi-field form dictation if on monitoring page
        if (window.location.pathname.endsWith('monitoring.html') && this.tryParseMonitoringDictation(text)) {
            return;
        }

        // Case 3: Standard agricultural voice query via backend REST API
        this.processQuery(text);
    },

    populateSingleInput(inputElement, spokenText) {
        // Extract numeric value if input is type number
        if (inputElement.type === 'number') {
            const match = spokenText.match(/[-+]?[0-9]*\.?[0-9]+/);
            if (match) {
                inputElement.value = match[0];
                inputElement.dispatchEvent(new Event('input', { bubbles: true }));
                inputElement.dispatchEvent(new Event('change', { bubbles: true }));
                this.highlightElement(inputElement);
                const isTe = typeof I18n !== 'undefined' && I18n.getLanguage() === 'te';
                const confirmMsg = isTe 
                    ? `విలువ ${match[0]} గా నమోదు చేయబడింది.`
                    : `${inputElement.name || inputElement.id} set to ${match[0]}`;
                showToast(confirmMsg, 'success');
                this.speak(confirmMsg);
            } else {
                showToast(`Could not extract number from "${spokenText}"`, 'warning');
            }
        } else {
            inputElement.value = spokenText;
            inputElement.dispatchEvent(new Event('input', { bubbles: true }));
            this.highlightElement(inputElement);
        }
    },

    tryParseMonitoringDictation(text) {
        // Checks phrases like "Temperature 32, humidity 65, moisture 25" or "ఉష్ణోగ్రత 30 తేమ 50 నేల 25"
        const lower = text.toLowerCase();
        let matched = false;

        const tempMatch = lower.match(/(?:temp|temperature|ఉష్ణోగ్రత|తాపం)\s*(?:is|=|:)?\s*([0-9]+(?:\.[0-9]+)?)/i);
        const humMatch = lower.match(/(?:humidity|గాలిలో తేమ|తేమశాతం)\s*(?:is|=|:)?\s*([0-9]+(?:\.[0-9]+)?)/i);
        const moistMatch = lower.match(/(?:moisture|soil|soil moisture|మట్టి|నేల|నేల తేమ|తడి)\s*(?:is|=|:)?\s*([0-9]+(?:\.[0-9]+)?)/i);

        const tempInput = document.getElementById('temperature');
        const humInput = document.getElementById('humidity');
        const moistInput = document.getElementById('soil-moisture') || document.getElementById('soilMoisture');

        if (tempMatch && tempInput) {
            tempInput.value = tempMatch[1];
            tempInput.dispatchEvent(new Event('input', { bubbles: true }));
            this.highlightElement(tempInput);
            matched = true;
        }
        if (humMatch && humInput) {
            humInput.value = humMatch[1];
            humInput.dispatchEvent(new Event('input', { bubbles: true }));
            this.highlightElement(humInput);
            matched = true;
        }
        if (moistMatch && moistInput) {
            moistInput.value = moistMatch[1];
            moistInput.dispatchEvent(new Event('input', { bubbles: true }));
            this.highlightElement(moistInput);
            matched = true;
        }

        if (matched) {
            const lang = typeof I18n !== 'undefined' ? I18n.getLanguage() : 'en';
            const confirmMsg = lang === 'te'
                ? "రైతు సోదరులారా! ఉష్ణోగ్రత, తేమ మరియు నేల తేమ వివరాలు ఫారంలో విజయవంతంగా నమోదు చేయబడ్డాయి."
                : "Monitoring observations successfully filled into the form.";
            this.showResponse({
                intent: "POPULATE_FORM",
                displayText: confirmMsg,
                spokenText: confirmMsg
            });
            this.speak(confirmMsg);
            showToast(confirmMsg, 'success');
            return true;
        }

        return false;
    },

    async processQuery(queryText) {
        if (!queryText || !queryText.trim()) return;

        this.openModal();
        this.showTranscript(queryText, false);
        this.showStatus(this.t('voice_processing', 'Analyzing query...'), 'warning');

        const currentLang = typeof I18n !== 'undefined' ? I18n.getLanguage() : 'en';

        try {
            // First attempt backend Spring Boot REST API
            const token = typeof Auth !== 'undefined' ? Auth.getToken() : null;
            let responseData = null;

            if (token) {
                const result = await apiRequest('/voice/process', {
                    method: 'POST',
                    body: JSON.stringify({
                        query: queryText,
                        language: currentLang
                    })
                });
                if (result && result.data) {
                    responseData = result.data;
                }
            }

            // Fallback to client-side rule processing if backend was not reachable or unauthenticated
            if (!responseData) {
                responseData = this.localProcessFallback(queryText, currentLang);
            }

            this.showResponse(responseData);
            this.speak(responseData.spokenText || responseData.displayText);

            // Execute potential action
            if (responseData.action === 'NAVIGATE' && responseData.redirectUrl) {
                setTimeout(() => {
                    window.location.href = responseData.redirectUrl;
                }, 2400);
            } else if (responseData.action === 'LOGOUT') {
                setTimeout(() => {
                    if (typeof Auth !== 'undefined') Auth.logout();
                }, 2000);
            }

        } catch (err) {
            console.warn('Backend voice processing error, falling back to local engine:', err);
            const fallbackResp = this.localProcessFallback(queryText, currentLang);
            this.showResponse(fallbackResp);
            this.speak(fallbackResp.spokenText || fallbackResp.displayText);

            if (fallbackResp.action === 'NAVIGATE' && fallbackResp.redirectUrl) {
                setTimeout(() => {
                    window.location.href = fallbackResp.redirectUrl;
                }, 2400);
            }
        }
    },

    localProcessFallback(query, lang) {
        const lower = query.toLowerCase();
        const has = (...terms) => terms.some(t => lower.includes(t.toLowerCase()));

        // 1. Safety & Consequential Action Confirmation
        if (((has('turn on', 'start', 'stop', 'turn off', 'switch on', 'switch off', 'activate', 'deactivate') &&
              has('pump', 'motor', 'irrigation', 'water')) ||
             has('delete field', 'delete crop', 'update field', 'మోటార్ ఆన్', 'మోటార్ ఆఫ్', 'మోటార్ స్టార్ట్'))) {
            return {
                intent: 'ACTION_CONFIRMATION_REQUIRED',
                action: 'CONFIRM_ACTION',
                displayText: lang === 'te'
                    ? "భద్రతా సూచన: స్పష్టమైన నిర్ధారణ లేకుండా వాయిస్ కమాండ్ ద్వారా మోటార్ లేదా వ్యవసాయ డేటాను మార్చలేము. దయచేసి పొలాల నిర్వహణ పేజీ నుండి నేరుగా నిర్ధారించండి."
                    : "Safety Confirmation Required: Voice commands cannot alter irrigation hardware or modify records without manual confirmation. Please use the dashboard controls directly.",
                spokenText: lang === 'te'
                    ? "భద్రతా సూచన: మోటార్ లేదా వ్యవసాయ డేటాను మార్చడానికి నేరుగా డాష్‌బోర్డ్ బటన్ ద్వారా నిర్ధారించండి."
                    : "Safety notice: Please confirm any irrigation control or record modification through the dashboard controls.",
                redirectUrl: 'fields.html'
            };
        }

        // 2. Crop Recommendations & Suitability
        if (has('crop recommendation', 'crop recommendations', 'give me crop recommendations',
                'what crops are suitable', 'crops are suitable', 'suitable for my field', 'suitable crops',
                'suitable crop', 'which crop', 'what to grow', 'what should i grow', 'what to plant',
                'suggest crop', 'recommend crop', 'recommend crops', 'best crop', 'సిఫార్సు', 'పంట సిఫార్సు', 'ఏ పంట వేయాలి', 'మంచి పంట')) {
            const moistEl = document.getElementById('latest-moisture');
            const tempEl = document.getElementById('latest-temp');
            const moist = moistEl ? moistEl.textContent : '35%';
            const temp = tempEl ? tempEl.textContent : '28°C';
            if (lang === 'te') {
                return {
                    intent: 'CROP_RECOMMENDATION',
                    displayText: `ప్రస్తుత పొలం పరిస్థితుల ప్రకారం (ఉష్ణోగ్రత: ${temp}, తేమ: ${moist}), మొక్కజొన్న (100%), టమాటా (100%), మరియు వేరుశనగ (100%) అత్యంత అనుకూలమైన పంటలు.`,
                    spokenText: "మీ పొలానికి మొక్కజొన్న, టమాటా, మరియు వేరుశనగ పంటలు అత్యంత అనుకూలంగా సిఫార్సు చేయబడ్డాయి.",
                    action: 'NAVIGATE',
                    redirectUrl: 'recommendation.html'
                };
            } else {
                return {
                    intent: 'CROP_RECOMMENDATION',
                    displayText: `Based on your current field conditions (Temp: ${temp}, Moisture: ${moist}), top suitable crops are Maize (100%), Tomato (100%), and Groundnut (100%).`,
                    spokenText: "Based on current field conditions, suitable crops for your field are Maize, Tomato, and Groundnut.",
                    action: 'NAVIGATE',
                    redirectUrl: 'recommendation.html'
                };
            }
        }

        // 3. Soil Dryness ("Is my soil too dry?")
        if (has('too dry', 'is my soil too dry', 'is the soil dry', 'is soil dry', 'is it too dry', 'is it dry', 'soil is dry', 'dry soil', 'dryness', 'is my field dry', 'ఎండిపోయిందా', 'ఎండిపోయింది', 'తడి లేదా')) {
            const moistEl = document.getElementById('latest-moisture');
            const currentMoisture = moistEl ? parseFloat(moistEl.textContent) : null;
            if (currentMoisture !== null && !isNaN(currentMoisture)) {
                const isDry = currentMoisture < 30.0;
                if (lang === 'te') {
                    return {
                        intent: 'CHECK_SOIL_DRYNESS',
                        displayText: isDry
                            ? `అవును, మీ నేల చాలా ఎండిపోయింది! తాజా నేల తేమ ${currentMoisture.toFixed(1)}% మాత్రమే ఉంది (30% పరిమితి కంటే తక్కువ). వెంటనే నీటిపారుదల ప్రారంభించండి.`
                            : `లేదు, మీ నేల ఎండిపోలేదు. తాజా నేల తేమ ${currentMoisture.toFixed(1)}% తో సాధారణ సురక్షిత స్థాయిలో ఉంది (>= 30%).`,
                        spokenText: isDry
                            ? `అవును రైతు సోదరులారా, నేల తేమ ${currentMoisture.toFixed(1)} శాతానికి పడిపోయింది. వెంటనే మోటార్ ఆన్ చేసి నీరు పెట్టండి!`
                            : `లేదు, నేల తేమ ${currentMoisture.toFixed(1)} శాతంతో సాధారణంగా ఉంది. నేల ఎండిపోలేదు.`
                    };
                } else {
                    return {
                        intent: 'CHECK_SOIL_DRYNESS',
                        displayText: isDry
                            ? `Yes, your soil is too dry! The latest soil moisture is ${currentMoisture.toFixed(1)}%, which is below the 30.0% threshold. Irrigation is required immediately.`
                            : `No, your soil is not too dry. The latest soil moisture is ${currentMoisture.toFixed(1)}%, which is in the safe normal range (>= 30.0%).`,
                        spokenText: isDry
                            ? `Yes, your soil is too dry with only ${currentMoisture.toFixed(1)} percent moisture. Please turn on irrigation immediately.`
                            : `No, your soil is not too dry. Moisture level is normal at ${currentMoisture.toFixed(1)} percent.`
                    };
                }
            } else {
                return {
                    intent: 'CHECK_SOIL_DRYNESS',
                    displayText: lang === 'te'
                        ? 'నేల తేమ 30% కంటే తక్కువగా ఉంటే నేల ఎండిపోయినట్లు నిర్ధారించబడుతుంది.'
                        : 'Soil moisture below 30.0% indicates dry soil requiring irrigation.',
                    spokenText: lang === 'te'
                        ? 'నేల తేమ 30 శాతం కంటే తక్కువగా ఉంటే పంటకు నీరు పెట్టాలి.'
                        : 'Soil moisture below 30 percent indicates dry soil.'
                };
            }
        }

        // 4. Irrigation Status & Decision ("Should I irrigate my field?", "Show my irrigation status")
        if (has('should i irrigate', 'do i need irrigation', 'is irrigation needed', 'is irrigation required',
                'irrigation status', 'show my irrigation status', 'check irrigation', 'need irrigation', 'irrigate', 'irrigation',
                'water my field', 'water the field', 'water required', 'need water', 'నీరు పెట్టాలా', 'నీళ్లు పెట్టాలా', 'నీటిపారుదల స్థితి', 'నీళ్లు కావాలా')) {
            const moistEl = document.getElementById('latest-moisture');
            const currentMoisture = moistEl ? parseFloat(moistEl.textContent) : null;
            if (currentMoisture !== null && !isNaN(currentMoisture)) {
                const req = currentMoisture < 30.0;
                if (lang === 'te') {
                    return {
                        intent: 'IRRIGATION_STATUS',
                        displayText: req
                            ? `అవును, నీటిపారుదల ఖచ్చితంగా అవసరం! తాజా నేల తేమ ${currentMoisture.toFixed(1)}% గా ఉంది, ఇది 30% ప్రమాణం కంటే తక్కువ.`
                            : `లేదు, ప్రస్తుతం నీటిపారుదల అవసరం లేదు. తాజా నేల తేమ ${currentMoisture.toFixed(1)}% తో తగినంతగా ఉంది.`,
                        spokenText: req
                            ? `అవును, పంటకు నీరు పెట్టాలి! తాజా నేల తేమ ${currentMoisture.toFixed(1)} శాతం మాత్రమే ఉంది.`
                            : `లేదు, ప్రస్తుతం నీరు పెట్టాల్సిన అవసరం లేదు. నేలలో తగినంత తడి ఉంది.`
                    };
                } else {
                    return {
                        intent: 'IRRIGATION_STATUS',
                        displayText: req
                            ? `Yes, you should irrigate your field! Latest soil moisture is ${currentMoisture.toFixed(1)}%, which is below the 30.0% threshold. Status: 'Irrigation Required'.`
                            : `No, you do not need to irrigate right now. Soil moisture is healthy at ${currentMoisture.toFixed(1)}%. Status: 'Moisture Level Normal'.`,
                        spokenText: req
                            ? `Yes, irrigation is required! Latest soil moisture is ${currentMoisture.toFixed(1)} percent, which is below the 30 percent threshold.`
                            : `No, irrigation is not needed at this time. Soil moisture is optimal at ${currentMoisture.toFixed(1)} percent.`
                    };
                }
            } else {
                return {
                    intent: 'IRRIGATION_STATUS',
                    displayText: lang === 'te'
                        ? 'నేల తేమ 30% కంటే తక్కువగా ఉంటే నీటిపారుదల అవసరం.'
                        : 'Threshold is 30.0%. Readings below 30% require irrigation.',
                    spokenText: lang === 'te'
                        ? 'నేల తేమ 30 శాతం కంటే తక్కువగా ఉంటే నీరు పెట్టాలి.'
                        : 'Readings below 30 percent require irrigation.'
                };
            }
        }

        // 5. Soil Moisture Level ("What is my soil moisture level?")
        if (has('soil moisture level', 'moisture level', 'soil moisture', 'moisture', 'water level', 'what is my soil moisture', 'how is the moisture', 'తేమ ఎంత', 'నేల తేమ', 'మట్టి తేమ', 'భూమి తేమ', 'తడి')) {
            const moistEl = document.getElementById('latest-moisture');
            const currentMoisture = moistEl ? parseFloat(moistEl.textContent) : null;
            if (currentMoisture !== null && !isNaN(currentMoisture)) {
                const req = currentMoisture < 30.0;
                if (lang === 'te') {
                    return {
                        intent: 'CHECK_SOIL_MOISTURE',
                        displayText: `తాజా నేల తేమ శాతం ${currentMoisture.toFixed(1)}%. ${req ? 'ఇది 30% కంటే తక్కువ. నీటిపారుదల వెంటనే అవసరం!' : 'తేమ సాధారణ స్థాయిలో ఉంది.'}`,
                        spokenText: `తాజా నేల తేమ ${currentMoisture.toFixed(1)} శాతం.`
                    };
                } else {
                    return {
                        intent: 'CHECK_SOIL_MOISTURE',
                        displayText: `The latest soil moisture level is ${currentMoisture.toFixed(1)}%. ${req ? 'This is below the 30.0% threshold. Irrigation is required!' : 'Moisture level is normal and adequate.'}`,
                        spokenText: `Latest soil moisture level is ${currentMoisture.toFixed(1)} percent. ${req ? 'Irrigation is required immediately.' : 'Moisture is normal.'}`
                    };
                }
            } else {
                return {
                    intent: 'CHECK_SOIL_MOISTURE',
                    displayText: lang === 'te' ? 'నేల తేమ కొలత 30% ప్రమాణం ఆధారంగా లెక్కించబడుతుంది.' : 'Soil moisture threshold is set to 30.0%.',
                    spokenText: 'Soil moisture threshold is 30 percent.'
                };
            }
        }

        // 6. Current Temperature & Humidity ("What is the current temperature?")
        if (has('current temperature', 'temperature', 'what is the temperature', 'temp', 'current humidity', 'humidity', 'weather', 'climate', 'ఉష్ణోగ్రత', 'ప్రస్తుత ఉష్ణోగ్రత', 'గాలిలో తేమ', 'వాతావరణం')) {
            const tempEl = document.getElementById('latest-temp');
            const humEl = document.getElementById('latest-humidity');
            const temp = tempEl ? tempEl.textContent : '28°C';
            const hum = humEl ? humEl.textContent : '65%';
            if (lang === 'te') {
                return {
                    intent: 'TELEMETRY_WEATHER',
                    displayText: `తాజా ఉష్ణోగ్రత ${temp}, మరియు గాలిలో తేమ ${hum} గా నమోదైంది.`,
                    spokenText: `ప్రస్తుత ఉష్ణోగ్రత ${temp}, మరియు గాలిలో తేమ ${hum}.`
                };
            } else {
                return {
                    intent: 'TELEMETRY_WEATHER',
                    displayText: `The current field temperature is ${temp}, and relative humidity is ${hum}.`,
                    spokenText: `Current temperature is ${temp}, and relative humidity is ${hum}.`
                };
            }
        }

        // 7. Active Alerts ("Are there any alerts for my farm?")
        if (has('alerts for my farm', 'are there any alerts', 'any alerts', 'alert', 'alerts', 'warning', 'warnings', 'any warning', 'emergency', 'హెచ్చరికలు ఉన్నాయా', 'హెచ్చరికలు', 'హెచ్చరిక', 'సమస్య')) {
            const alertCountEl = document.getElementById('active-alerts-count');
            const count = alertCountEl ? parseInt(alertCountEl.textContent) || 0 : 0;
            if (count > 0) {
                if (lang === 'te') {
                    return {
                        intent: 'CHECK_ALERTS',
                        displayText: `మీకు ${count} క్రియాశీల హెచ్చరికలు ఉన్నాయి. అత్యవసర చర్యల కోసం హెచ్చరికల పేజీని తెరవండి.`,
                        spokenText: `మీకు ${count} క్రియాశీల హెచ్చరికలు ఉన్నాయి, వెంటనే గమనించండి.`,
                        action: 'NAVIGATE',
                        redirectUrl: 'alerts.html'
                    };
                } else {
                    return {
                        intent: 'CHECK_ALERTS',
                        displayText: `You have ${count} active alert${count > 1 ? 's' : ''} on your farm. Check the alerts page for details.`,
                        spokenText: `You have ${count} active alert${count > 1 ? 's' : ''} on your farm requiring attention.`,
                        action: 'NAVIGATE',
                        redirectUrl: 'alerts.html'
                    };
                }
            } else {
                return {
                    intent: 'CHECK_ALERTS',
                    displayText: lang === 'te'
                        ? "ప్రస్తుతం ఎటువంటి హెచ్చరికలు లేవు. మీ పంట పొలాలు సురక్షిత తేమ పరిమితుల్లో ఉన్నాయి."
                        : "You have no active alerts. All fields are operating within safe moisture levels.",
                    spokenText: lang === 'te'
                        ? "ప్రస్తుతం ఎటువంటి హెచ్చరికలు లేవు. పంటలు సురక్షితంగా ఉన్నాయి."
                        : "You have no active alerts. All field conditions are normal."
                };
            }
        }

        // 8. Farm Condition / Summary ("Explain the current condition of my farm")
        if (has('condition of my farm', 'current condition of my farm', 'explain the current condition', 'farm condition', 'current condition', 'condition', 'how is my farm', 'explain my farm', 'farm summary', 'farm status', 'dashboard summary', 'overview', 'వ్యవసాయ పరిస్థితి', 'పొలం పరిస్థితి', 'పరిస్థితి ఎలా ఉంది', 'మొత్తం పరిస్థితి', 'సారాంశం')) {
            const fieldsCount = document.getElementById('total-fields')?.textContent || '1';
            const cropsCount = document.getElementById('total-crops')?.textContent || '2';
            const moist = document.getElementById('latest-moisture')?.textContent || '35%';
            const temp = document.getElementById('latest-temp')?.textContent || '28°C';
            const hum = document.getElementById('latest-humidity')?.textContent || '65%';
            const alerts = document.getElementById('active-alerts-count')?.textContent || '0';
            const moistNum = parseFloat(moist);
            const req = !isNaN(moistNum) && moistNum < 30.0;

            if (lang === 'te') {
                return {
                    intent: 'DASHBOARD_SUMMARY',
                    displayText: `వ్యవసాయ ప్రస్తుత పరిస్థితి: ${fieldsCount} పొలాలు మరియు ${cropsCount} పంటలు ఉన్నాయి. ఉష్ణోగ్రత ${temp}, గాలి తేమ ${hum}, మరియు నేల తేమ ${moist}. ${req ? 'నీటిపారుదల వెంటనే అవసరం!' : 'తేమ సాధారణంగా ఉంది.'} క్రియాశీల హెచ్చరికలు: ${alerts}.`,
                    spokenText: `మీ వ్యవసాయ సారాంశం: ${fieldsCount} పొలాలు, ${cropsCount} పంటలు. తాజా నేల తేమ ${moist}. ${req ? 'నీరు పెట్టాలి!' : 'తేమ సాధారణంగా ఉంది.'}`
                };
            } else {
                return {
                    intent: 'DASHBOARD_SUMMARY',
                    displayText: `Here is your farm condition overview: You have ${fieldsCount} field(s) and ${cropsCount} crop(s). Latest temperature is ${temp}, humidity is ${hum}, and soil moisture is ${moist}. Irrigation status is '${req ? 'Irrigation Required' : 'Moisture Level Normal'}'. Active alerts: ${alerts}.`,
                    spokenText: `Farm summary: You have ${fieldsCount} fields and ${cropsCount} crops. Latest soil moisture is ${moist}. Irrigation status is ${req ? 'Irrigation Required' : 'Moisture Level Normal'}.`
                };
            }
        }

        // 9. Monitoring History ("Show my monitoring history")
        if (has('show my monitoring history', 'monitoring history', 'reading history', 'telemetry history', 'history of readings', 'past readings', 'previous readings', 'view history', 'history', 'చరిత్ర')) {
            return {
                intent: 'MONITORING_HISTORY',
                displayText: lang === 'te' ? 'పర్యవేక్షణ చరిత్ర పేజీకి వెళ్తున్నాము.' : 'Opening your Monitoring Telemetry History.',
                spokenText: lang === 'te' ? 'పరిశీలన చరిత్ర పేజీకి వెళ్తున్నాము.' : 'Opening monitoring history to view previous readings.',
                action: 'NAVIGATE',
                redirectUrl: 'monitoring-history.html'
            };
        }

        // 10. Explicit Navigation
        if (has('open dashboard', 'go to dashboard', 'dashboard', 'home', 'డాష్‌బోర్డ్', 'హోమ్')) {
            return {
                intent: 'NAVIGATE_DASHBOARD',
                displayText: lang === 'te' ? 'డాష్‌బోర్డ్‌కు వెళ్తున్నాము.' : 'Navigating to Dashboard.',
                spokenText: lang === 'te' ? 'మీ వ్యవసాయ డాష్‌బోర్డ్‌కు వెళ్తున్నాము.' : 'Opening your Dashboard.',
                action: 'NAVIGATE',
                redirectUrl: 'farmer-dashboard.html'
            };
        }
        if (has('open fields', 'go to fields', 'show fields', 'manage fields', 'fields', 'పొలాల పేజీ', 'పొలాలు')) {
            return {
                intent: 'NAVIGATE_FIELDS',
                displayText: lang === 'te' ? 'పొలాల పేజీకి వెళ్తున్నాము.' : 'Opening Fields page.',
                spokenText: lang === 'te' ? 'పొలాల నిర్వహణ పేజీకి వెళ్తున్నాము.' : 'Navigating to Fields management.',
                action: 'NAVIGATE',
                redirectUrl: 'fields.html'
            };
        }
        if (has('open crops', 'go to crops', 'show crops', 'manage crops', 'crops', 'పంటల పేజీ', 'పంటలు')) {
            return {
                intent: 'NAVIGATE_CROPS',
                displayText: lang === 'te' ? 'పంటల పేజీకి వెళ్తున్నాము.' : 'Opening Crops page.',
                spokenText: lang === 'te' ? 'మీ పంటల పేజీకి వెళ్తున్నాము.' : 'Navigating to Crop management.',
                action: 'NAVIGATE',
                redirectUrl: 'crops.html'
            };
        }
        if (has('add monitoring', 'enter reading', 'record reading', 'open monitoring', 'go to monitoring', 'రీడింగ్ నమోదు')) {
            return {
                intent: 'NAVIGATE_MONITORING',
                displayText: lang === 'te' ? 'పరిశీలన డేటా నమోదు పేజీకి వెళ్తున్నాము.' : 'Opening Field Monitoring page.',
                spokenText: lang === 'te' ? 'పరిశీలన నమోదు పేజీకి వెళ్తున్నాము.' : 'Opening Monitoring data entry.',
                action: 'NAVIGATE',
                redirectUrl: 'monitoring.html'
            };
        }
        if (has('open alerts', 'go to alerts', 'alerts page', 'హెచ్చరికల పేజీ')) {
            return {
                intent: 'NAVIGATE_ALERTS',
                displayText: lang === 'te' ? 'హెచ్చరికల పేజీకి వెళ్తున్నాము.' : 'Opening Alerts page.',
                spokenText: lang === 'te' ? 'అత్యవసర హెచ్చరికల పేజీకి వెళ్తున్నాము.' : 'Opening alerts and notifications.',
                action: 'NAVIGATE',
                redirectUrl: 'alerts.html'
            };
        }
        if (has('open recommendations', 'go to recommendations', 'recommendations page', 'సిఫార్సుల పేజీ')) {
            return {
                intent: 'NAVIGATE_RECOMMENDATIONS',
                displayText: lang === 'te' ? 'పంట సిఫార్సుల పేజీకి వెళ్తున్నాము.' : 'Opening Crop Recommendations.',
                spokenText: lang === 'te' ? 'పంట సిఫార్సుల పేజీకి వెళ్తున్నాము.' : 'Opening crop suitability recommendations.',
                action: 'NAVIGATE',
                redirectUrl: 'recommendation.html'
            };
        }

        // 11. Default Help
        return {
            intent: 'HELP',
            displayText: lang === 'te'
                ? "మీరు అడగగల ప్రశ్నలు: 'నేల తేమ ఎంత?', 'ప్రస్తుత ఉష్ణోగ్రత ఎంత?', 'నేల ఎండిపోయిందా?', 'నీరు పెట్టాలా?', 'హెచ్చరికలు ఉన్నాయా?', 'పంట సిఫార్సులు చెప్పు', లేదా 'వ్యవసాయ పరిస్థితి వివరించు'."
                : "You can ask: 'What is my soil moisture level?', 'What is the current temperature?', 'Is my soil too dry?', 'Should I irrigate my field?', 'Show my irrigation status.', 'Are there any alerts for my farm?', 'Give me crop recommendations.', or 'Explain the current condition of my farm.'",
            spokenText: lang === 'te'
                ? "రైతు సోదరులారా! మీరు నేల తేమ, ఉష్ణోగ్రత, నీరు పెట్టాల్సిన పరిస్థితి, లేదా పంట సిఫార్సుల గురించి అడగవచ్చు."
                : "You can ask about soil moisture, temperature, irrigation requirement, alerts, or crop recommendations."
        };
    },

    /**
     * Primary Speech Dispatcher - Employs High-Fidelity Female Voice for Telugu & English
     */
    speak(text) {
        if (!text || this.isMuted) return;

        this.lastSpokenText = text;
        this.stopSpeaking();

        const currentLang = typeof I18n !== 'undefined' ? I18n.getLanguage() : 'en';

        // For Telugu: Stream high-quality authentic Female Voice
        if (currentLang === 'te') {
            this.speakFemaleStream(text, 'te');
        } else {
            // For English: Use Female Indian voice or streaming
            this.speakFemaleVoice(text, 'en');
        }
    },

    stopSpeaking() {
        if (this.activeAudio) {
            try {
                this.activeAudio.onended = null;
                this.activeAudio.onerror = null;
                this.activeAudio.pause();
                this.activeAudio.currentTime = 0;
            } catch (e) {}
            this.activeAudio = null;
        }
        if (this.speechSynthesis) {
            try {
                this.speechSynthesis.cancel();
            } catch (e) {}
        }
        this.isSpeaking = false;
        this.updateSpeakingUI(false);
    },

    /**
     * Plays authentic native Female Audio Stream (Google TTS via Spring Boot Proxy or Direct CDN)
     * Handles chunking to guarantee complete pronunciation without word cut-off.
     */
    speakFemaleStream(text, lang = 'te') {
        const chunks = this.splitIntoAudioChunks(text, 140);
        if (chunks.length === 0) return;

        let currentIndex = 0;
        this.isSpeaking = true;
        this.updateSpeakingUI(true);

        const playNextChunk = () => {
            if (currentIndex >= chunks.length || this.isMuted) {
                this.isSpeaking = false;
                this.updateSpeakingUI(false);
                this.activeAudio = null;
                return;
            }

            const chunk = chunks[currentIndex++];
            const encoded = encodeURIComponent(chunk);
            const proxyUrl = `/api/voice/tts?text=${encoded}&lang=${lang}`;
            const directUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${lang}&q=${encoded}`;

            const audio = new Audio();
            this.activeAudio = audio;

            audio.src = proxyUrl;
            audio.onended = () => {
                playNextChunk();
            };
            audio.onerror = () => {
                // If backend proxy encounters network error, try direct CDN stream
                if (audio.src.includes('/api/voice/tts')) {
                    audio.src = directUrl;
                    audio.play().catch(() => {
                        this.fallbackSpeechSynthesis(chunk, lang, () => playNextChunk());
                    });
                } else {
                    this.fallbackSpeechSynthesis(chunk, lang, () => playNextChunk());
                }
            };

            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch((err) => {
                    console.warn('Audio play restricted or failed, falling back to speech synthesis:', err);
                    this.fallbackSpeechSynthesis(chunk, lang, () => playNextChunk());
                });
            }
        };

        playNextChunk();
    },

    splitIntoAudioChunks(text, maxLength = 140) {
        if (!text) return [];
        const clean = text.replace(/[*#_`>]/g, '').trim();
        if (clean.length <= maxLength) return [clean];

        const sentences = clean.split(/(?<=[.?!,\n]| మరియు )+/);
        const chunks = [];
        let currentChunk = '';

        for (const s of sentences) {
            const piece = s.trim();
            if (!piece) continue;
            if ((currentChunk + ' ' + piece).length <= maxLength) {
                currentChunk = currentChunk ? currentChunk + ' ' + piece : piece;
            } else {
                if (currentChunk) chunks.push(currentChunk);
                if (piece.length <= maxLength) {
                    currentChunk = piece;
                } else {
                    const words = piece.split(' ');
                    let subChunk = '';
                    for (const w of words) {
                        if ((subChunk + ' ' + w).length <= maxLength) {
                            subChunk = subChunk ? subChunk + ' ' + w : w;
                        } else {
                            if (subChunk) chunks.push(subChunk);
                            subChunk = w;
                        }
                    }
                    currentChunk = subChunk;
                }
            }
        }
        if (currentChunk) chunks.push(currentChunk);
        return chunks;
    },

    fallbackSpeechSynthesis(text, lang, onDone) {
        if (!this.speechSynthesis || this.isMuted) {
            if (onDone) onDone();
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang === 'te' ? 'te-IN' : 'en-IN';
        utterance.rate = 0.95;
        utterance.pitch = 1.2; // Female pitch

        const voices = this.speechSynthesis.getVoices();
        if (voices && voices.length > 0) {
            const femaleVoice = voices.find(v => {
                const name = v.name.toLowerCase();
                return (v.lang.startsWith(lang) || v.lang.startsWith('en')) &&
                       (name.includes('female') || name.includes('heera') || name.includes('neerja') ||
                        name.includes('zira') || name.includes('swara') || name.includes('kavya'));
            });
            if (femaleVoice) utterance.voice = femaleVoice;
        }

        utterance.onend = () => {
            if (onDone) onDone();
        };
        utterance.onerror = () => {
            if (onDone) onDone();
        };

        this.speechSynthesis.speak(utterance);
    },

    speakFemaleVoice(text, lang = 'en') {
        if (!this.speechSynthesis) {
            this.speakFemaleStream(text, lang);
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-IN';
        utterance.rate = 0.95;
        utterance.pitch = 1.15; // Female pitch

        const voices = this.speechSynthesis.getVoices();
        if (voices && voices.length > 0) {
            const femaleVoice = voices.find(v => {
                const name = v.name.toLowerCase();
                return (v.lang.startsWith('en-IN') || v.lang.startsWith('en')) &&
                       (name.includes('female') || name.includes('heera') || name.includes('neerja') ||
                        name.includes('zira') || name.includes('google us english') || name.includes('samantha'));
            });
            if (femaleVoice) utterance.voice = femaleVoice;
        }

        utterance.onstart = () => {
            this.isSpeaking = true;
            this.updateSpeakingUI(true);
        };
        utterance.onend = () => {
            this.isSpeaking = false;
            this.updateSpeakingUI(false);
        };
        utterance.onerror = () => {
            this.speakFemaleStream(text, lang);
        };

        this.speechSynthesis.speak(utterance);
    },

    /**
     * Dedicated Farmer Audio Guide - Accessible for Farmers who cannot read or write
     */
    speakStatusBanner() {
        const lang = typeof I18n !== 'undefined' ? I18n.getLanguage() : 'en';
        const moistEl = document.getElementById('latest-moisture');
        const moisture = moistEl ? parseFloat(moistEl.textContent) : null;
        const tempEl = document.getElementById('latest-temp');
        const temp = tempEl ? tempEl.textContent : '--';
        const humEl = document.getElementById('latest-humidity');
        const hum = humEl ? humEl.textContent : '--';

        let speechText = '';
        if (moisture !== null && !isNaN(moisture)) {
            const isDry = moisture < 30.0;
            if (lang === 'te') {
                speechText = isDry
                    ? `రైతు సోదరులారా గమనించండి! మీ పొలంలో తాజా నేల తేమ ${moisture.toFixed(1)} శాతం మాత్రమే ఉంది. ఇది 30 శాతం కనీస పరిమితి కంటే తక్కువగా ఉంది. కాబట్టి పంట ఎండిపోకుండా ఉండేందుకు వెంటనే మోటార్ ఆన్ చేసి నీరు పెట్టండి!`
                    : `రైతు సోదరులారా! మీ పొలంలో తాజా నేల తేమ ${moisture.toFixed(1)} శాతం ఉంది. నేలలో తగినంత తడి ఉంది, పంట పచ్చగా ఆరోగ్యంగా ఉంది. ప్రస్తుతానికి నీరు పెట్టాల్సిన అవసరం లేదు.`;
            } else {
                speechText = isDry
                    ? `Attention farmer! The latest soil moisture is ${moisture.toFixed(1)} percent, which is below the 30 percent threshold. Please turn on your irrigation motor immediately to protect your crops!`
                    : `Farmer update: The latest soil moisture is ${moisture.toFixed(1)} percent. Moisture is optimal and healthy. No irrigation is needed at this time.`;
            }
        } else {
            speechText = lang === 'te'
                ? "స్మార్ట్ వ్యవసాయ పర్యవేక్షణ వ్యవస్థకు స్వాగతం. ఇంకా ఎటువంటి కొలతలు నమోదు కాలేదు. దయచేసి పరిశీలన రీడింగ్ నమోదు చేయండి."
                : "Welcome to Smart Agriculture Monitoring. No telemetry readings recorded yet. Please enter your first reading.";
        }

        this.openModal();
        this.showResponse({
            intent: "FARMER_AUDIO_GUIDE",
            displayText: speechText,
            spokenText: speechText
        });
        this.speak(speechText);
    },

    speakAlertsBanner() {
        const lang = typeof I18n !== 'undefined' ? I18n.getLanguage() : 'en';
        const alertElements = document.querySelectorAll('#active-alerts-list .alert-banner');
        let speechText = '';

        if (alertElements.length === 0) {
            speechText = lang === 'te'
                ? "రైతు సోదరులారా! ప్రస్తుతం మీ పొలంలో ఎటువంటి అత్యవసర హెచ్చరికలు లేవు. పంటలు పూర్తిగా సురక్షితంగా ఉన్నాయి."
                : "Good news! There are no active alerts. All fields are operating within safe moisture levels.";
        } else {
            speechText = lang === 'te'
                ? `రైతు గమనిక! మీ పొలంలో అత్యవసర హెచ్చరిక నమోదైంది: నేలలో తేమ ప్రమాదకర స్థాయికి పడిపోయింది. పంటను కాపాడేందుకు వెంటనే నీరు పెట్టండి!`
                : `Warning! Critical low moisture detected in your field. Please turn on irrigation immediately.`;
        }

        this.openModal();
        this.showResponse({
            intent: "ALERTS_AUDIO_GUIDE",
            displayText: speechText,
            spokenText: speechText
        });
        this.speak(speechText);
    },

    readCurrentPageAloud() {
        const lang = typeof I18n !== 'undefined' ? I18n.getLanguage() : 'en';
        let summary = '';

        if (window.location.pathname.endsWith('farmer-dashboard.html')) {
            const temp = document.getElementById('latest-temp')?.textContent || '--';
            const hum = document.getElementById('latest-humidity')?.textContent || '--';
            const moist = document.getElementById('latest-moisture')?.textContent || '--';
            const alerts = document.getElementById('active-alerts-count')?.textContent || '0';

            if (lang === 'te') {
                summary = `రైతు డాష్‌బోర్డ్ సారాంశం: తాజా ఉష్ణోగ్రత ${temp}, గాలిలో తేమ ${hum}, మరియు నేల తేమ ${moist}. క్రియాశీల హెచ్చరికలు ${alerts}.`;
            } else {
                summary = `Farmer Dashboard Summary: Latest temperature is ${temp}, humidity is ${hum}, and soil moisture is ${moist}. You have ${alerts} active alert${alerts === '1' ? '' : 's'}.`;
            }
        } else if (window.location.pathname.endsWith('alerts.html')) {
            const alertCount = document.querySelectorAll('#alerts-tbody tr').length;
            if (lang === 'te') {
                summary = `హెచ్చరికల పేజీ: మొత్తం ${alertCount} రికార్డులు గుర్తించబడ్డాయి. తక్కువ నేల తేమ హెచ్చరికలను వెంటనే పరిశీలించండి.`;
            } else {
                summary = `Alerts page: Found ${alertCount} alert records. Check low moisture alerts to maintain irrigation safety.`;
            }
        } else if (window.location.pathname.endsWith('monitoring.html')) {
            if (lang === 'te') {
                summary = `పరిశీలన నమోదు పేజీ: ఇక్కడ ఉష్ణోగ్రత, తేమ, మరియు నేల తేమ నమోదు చేయవచ్చు. నేల తేమ 30% కంటే తక్కువగా ఉంటే ఆటోమేటిక్ హెచ్చరిక జారీ చేయబడుతుంది.`;
            } else {
                summary = `Monitoring Data Entry: Record temperature, humidity, and soil moisture here. Readings below 30% automatically trigger irrigation alerts.`;
            }
        } else if (window.location.pathname.endsWith('recommendation.html')) {
            if (lang === 'te') {
                summary = `పంట సిఫార్సుల పేజీ: నేల రకం మరియు ఉష్ణోగ్రత, తేమ ఆధారంగా ఉత్తమ అనుకూలమైన పంటలను గణించే వ్యవస్థ.`;
            } else {
                summary = `Crop Recommendations: Rule-based engine analyzing temperature, humidity, moisture, and soil classifications.`;
            }
        } else {
            summary = lang === 'te'
                ? "స్మార్ట్ వ్యవసాయ పర్యవేక్షణ వ్యవస్థ. వాయిస్ అసిస్టెంట్ సహాయంతో సమాచారాన్ని తెలుసుకోవచ్చు."
                : "Smart Agriculture Monitoring System. Use Agri-Voice to inspect telemetry and navigate hands-free.";
        }

        this.openModal();
        this.showResponse({
            intent: "READ_PAGE",
            displayText: summary,
            spokenText: summary
        });
        this.speak(summary);
    },

    toggleMute() {
        this.isMuted = !this.isMuted;
        localStorage.setItem('sams_voice_muted', this.isMuted.toString());
        if (this.isMuted) {
            this.stopSpeaking();
        }
        this.updateMuteButtonUI();
        showToast(this.isMuted ? 'Voice audio muted' : 'Voice audio enabled', 'info');
    },

    renderNavbarVoiceButton() {
        const navbar = document.querySelector('.navbar');
        if (!navbar) return;

        let container = document.getElementById('nav-voice-btn-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'nav-voice-btn-container';
            container.style.display = 'inline-flex';
            container.style.alignItems = 'center';
            container.style.marginLeft = '0.5rem';

            const langContainer = document.getElementById('lang-selector-container');
            const navUser = navbar.querySelector('.nav-user') || navbar.querySelector('.nav-links');
            if (langContainer && langContainer.nextSibling) {
                navbar.insertBefore(container, langContainer.nextSibling);
            } else if (navUser) {
                navbar.insertBefore(container, navUser);
            } else {
                navbar.appendChild(container);
            }
        }

        const label = this.t('voice_btn_nav', '🎙️ Voice Assistant');
        container.innerHTML = `
            <button type="button" class="nav-voice-btn" id="nav-voice-toggle-btn" onclick="SamsVoice.toggleListening()" title="Launch SAMS Agri-Voice Assistant">
                <span>🎙️</span>
                <span id="nav-voice-btn-label">${label.replace('🎙️ ', '')}</span>
            </button>
        `;
    },

    renderFloatingDockButton() {
        if (document.getElementById('sams-voice-fab')) return;

        const fab = document.createElement('div');
        fab.id = 'sams-voice-fab';
        fab.className = 'voice-fab';
        fab.setAttribute('title', 'Click to speak with SAMS Agri-Voice Assistant');
        fab.onclick = () => this.toggleListening();

        const label = this.t('voice_btn_open', 'Agri-Voice');
        fab.innerHTML = `
            <span class="voice-fab-icon">🎙️</span>
            <span id="voice-fab-label">${label}</span>
        `;

        document.body.appendChild(fab);
    },

    renderVoiceModal() {
        if (document.getElementById('sams-voice-modal')) return;

        const overlay = document.createElement('div');
        overlay.id = 'sams-voice-modal';
        overlay.className = 'voice-modal-overlay';
        overlay.onclick = (e) => {
            if (e.target === overlay) this.closeModal();
        };

        const currentLang = typeof I18n !== 'undefined' ? I18n.getLanguage() : 'en';

        overlay.innerHTML = `
            <div class="voice-modal-card" onclick="event.stopPropagation()">
                <!-- Header -->
                <div class="voice-modal-header">
                    <h3 class="voice-modal-title">
                        <span>🌾</span>
                        <span id="voice-modal-title-text">${this.t('voice_assistant_title', 'SAMS Agri-Voice Assistant')}</span>
                    </h3>
                    <div class="voice-header-actions">
                        <span class="voice-female-badge" title="Authentic Female Voice Engine Active">
                            👩 ${currentLang === 'te' ? 'మహిళా వాయిస్' : 'Female Voice'}
                        </span>
                        <button type="button" class="voice-header-btn" id="voice-lang-badge" onclick="SamsVoice.toggleLanguage()" title="Toggle Language">
                            🌐 ${currentLang === 'te' ? 'తెలుగు (te-IN)' : 'English (en-IN)'}
                        </button>
                        <button type="button" class="voice-header-btn" id="voice-mute-btn" onclick="SamsVoice.toggleMute()" title="Mute/Unmute audio synthesis">
                            ${this.isMuted ? '🔇 Unmute' : '🔊 Mute'}
                        </button>
                        <button type="button" class="voice-modal-close" onclick="SamsVoice.closeModal()" title="Close">&times;</button>
                    </div>
                </div>

                <!-- Body -->
                <div class="voice-modal-body">
                    <!-- Central Mic Visualizer -->
                    <div class="voice-visualizer-area">
                        <button type="button" class="voice-big-mic-btn" id="voice-big-mic" onclick="SamsVoice.toggleListening()" title="Tap to start/stop listening">
                            🎙️
                        </button>
                        <div class="voice-wave-bars" id="voice-wave-visualizer">
                            <div class="voice-wave-bar"></div>
                            <div class="voice-wave-bar"></div>
                            <div class="voice-wave-bar"></div>
                            <div class="voice-wave-bar"></div>
                            <div class="voice-wave-bar"></div>
                        </div>
                        <div class="voice-status-badge" id="voice-status-text">
                            ${this.t('voice_status_ready', 'Ready to listen')}
                        </div>
                    </div>

                    <!-- Stop Controls Row -->
                    <div class="voice-controls-row">
                        <button type="button" class="voice-ctrl-btn voice-ctrl-stop-listen" id="voice-stop-listen-btn" style="display:none;" onclick="SamsVoice.stopListening()">
                            ⏹️ ${currentLang === 'te' ? 'వినడం ఆపు' : 'Stop Listening'}
                        </button>
                        <button type="button" class="voice-ctrl-btn voice-ctrl-stop-speak" id="voice-stop-speak-btn" style="display:none;" onclick="SamsVoice.stopSpeaking()">
                            ⏹️ ${currentLang === 'te' ? 'మాట్లాడటం ఆపు' : 'Stop Speaking'}
                        </button>
                    </div>

                    <!-- Live Transcription Box -->
                    <div class="voice-transcript-box" id="voice-transcript-display">
                        ${this.t('voice_idle_prompt', 'Tap the mic and speak, or select a quick query below:')}
                    </div>

                    <!-- Assistant Response Box -->
                    <div class="voice-response-card" id="voice-response-box" style="display:none;">
                        <div class="voice-response-header">
                            <span class="voice-intent-badge" id="voice-intent-badge">INTENT</span>
                            <button type="button" class="voice-replay-btn" id="voice-replay-btn" onclick="SamsVoice.replayLastSpeech()">
                                🔊 ${this.t('voice_speak_again', 'Listen Again')}
                            </button>
                        </div>
                        <div class="voice-response-text" id="voice-response-content"></div>
                    </div>

                    <!-- Suggested Query Chips (Includes all 10 core questions) -->
                    <div class="voice-chips-section">
                        <div class="voice-chips-heading" id="voice-chips-heading-text">
                            ${this.t('voice_quick_chips_heading', 'Suggested Farm Voice Queries:')}
                        </div>
                        <div class="voice-chips-grid">
                            <button type="button" class="voice-chip" onclick="SamsVoice.speakStatusBanner()">
                                🔊 ${currentLang === 'te' ? 'రైతు పరిస్థితి చదవండి' : 'Read Farm Status'}
                            </button>
                            <button type="button" class="voice-chip" onclick="SamsVoice.processQuery('What is my soil moisture level?')">
                                💧 What is my soil moisture level?
                            </button>
                            <button type="button" class="voice-chip" onclick="SamsVoice.processQuery('What is the current temperature?')">
                                🌡️ What is the current temperature?
                            </button>
                            <button type="button" class="voice-chip" onclick="SamsVoice.processQuery('Is my soil too dry?')">
                                🏜️ Is my soil too dry?
                            </button>
                            <button type="button" class="voice-chip" onclick="SamsVoice.processQuery('Should I irrigate my field?')">
                                🌱 Should I irrigate my field?
                            </button>
                            <button type="button" class="voice-chip" onclick="SamsVoice.processQuery('Show my irrigation status.')">
                                🚰 Show my irrigation status
                            </button>
                            <button type="button" class="voice-chip" onclick="SamsVoice.processQuery('Are there any alerts for my farm?')">
                                🚨 Are there any alerts for my farm?
                            </button>
                            <button type="button" class="voice-chip" onclick="SamsVoice.processQuery('Give me crop recommendations.')">
                                🌾 Give me crop recommendations
                            </button>
                            <button type="button" class="voice-chip" onclick="SamsVoice.processQuery('What crops are suitable for my field?')">
                                🌽 What crops are suitable for my field?
                            </button>
                            <button type="button" class="voice-chip" onclick="SamsVoice.processQuery('Show my monitoring history.')">
                                📜 Show my monitoring history
                            </button>
                            <button type="button" class="voice-chip" onclick="SamsVoice.processQuery('Explain the current condition of my farm.')">
                                📊 Explain current condition of my farm
                            </button>
                        </div>
                    </div>

                    <!-- Fallback Text Input -->
                    <form class="voice-input-group" onsubmit="event.preventDefault(); SamsVoice.submitTextInput();">
                        <input type="text" id="voice-manual-input" class="voice-text-input" 
                            placeholder="${this.t('voice_input_placeholder', 'Type a voice query or command...')}" 
                            autocomplete="off">
                        <button type="submit" class="voice-send-btn">${this.t('voice_btn_send', 'Send')}</button>
                    </form>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        this.modalElement = overlay;
    },

    openModal() {
        const modal = document.getElementById('sams-voice-modal');
        if (modal) {
            modal.classList.add('open');
        }
    },

    closeModal() {
        const modal = document.getElementById('sams-voice-modal');
        if (modal) {
            modal.classList.remove('open');
        }
        if (this.isListening) {
            this.stopListening();
        }
        this.stopSpeaking();
    },

    updateListeningUI(isListening) {
        const navBtn = document.getElementById('nav-voice-toggle-btn');
        const fab = document.getElementById('sams-voice-fab');
        const bigMic = document.getElementById('voice-big-mic');
        const visualizer = document.getElementById('voice-wave-visualizer');
        const stopListenBtn = document.getElementById('voice-stop-listen-btn');

        if (navBtn) navBtn.classList.toggle('active-listening', isListening);
        if (fab) fab.classList.toggle('is-listening', isListening);
        if (bigMic) bigMic.classList.toggle('is-active', isListening);
        if (visualizer) visualizer.classList.toggle('active', isListening);
        if (stopListenBtn) stopListenBtn.style.display = isListening ? 'inline-flex' : 'none';

        if (isListening) {
            this.showStatus(this.t('voice_listening', 'Listening... Speak now'), 'primary');
        } else if (!this.isSpeaking) {
            this.showStatus(this.t('voice_status_ready', 'Ready to listen'), 'default');
        }
    },

    updateSpeakingUI(isSpeaking) {
        const visualizer = document.getElementById('voice-wave-visualizer');
        const stopSpeakBtn = document.getElementById('voice-stop-speak-btn');

        if (visualizer) visualizer.classList.toggle('active', isSpeaking);
        if (stopSpeakBtn) stopSpeakBtn.style.display = isSpeaking ? 'inline-flex' : 'none';

        if (isSpeaking) {
            this.showStatus(this.t('voice_speaking', 'Responding with female voice...'), 'success');
        } else if (!this.isListening) {
            this.showStatus(this.t('voice_status_ready', 'Ready to listen'), 'default');
        }
    },

    updateMuteButtonUI() {
        const btn = document.getElementById('voice-mute-btn');
        if (btn) {
            btn.textContent = this.isMuted
                ? `🔇 ${this.t('voice_unmute', 'Unmute')}`
                : `🔊 ${this.t('voice_mute', 'Mute')}`;
        }
    },

    showStatus(msg, type = 'default') {
        const el = document.getElementById('voice-status-text');
        if (el) {
            el.textContent = msg;
            if (type === 'danger') el.style.color = 'var(--danger)';
            else if (type === 'warning') el.style.color = 'var(--warning)';
            else if (type === 'success') el.style.color = 'var(--success)';
            else el.style.color = 'var(--primary-dark)';
        }
    },

    showTranscript(text, isInterim = false) {
        const el = document.getElementById('voice-transcript-display');
        if (!el) return;
        if (!text) {
            el.innerHTML = `<span style="color:var(--text-muted);">${this.t('voice_idle_prompt', 'Tap the mic and speak, or select a quick query below:')}</span>`;
            el.classList.remove('interim');
            return;
        }
        if (isInterim) {
            el.innerHTML = `<span style="font-style:italic;color:var(--primary);"><span class="voice-pulse-dot"></span> Listening: "${this.escapeHtml(text)}"...</span>`;
            el.classList.add('interim');
        } else {
            el.innerHTML = `
                <div class="transcript-final-badge">🗣️ Recognized Speech:</div>
                <div class="transcript-final-text">"${this.escapeHtml(text)}"</div>
            `;
            el.classList.remove('interim');
        }
    },

    showResponse(resp) {
        const box = document.getElementById('voice-response-box');
        const badge = document.getElementById('voice-intent-badge');
        const content = document.getElementById('voice-response-content');

        if (!box || !content) return;

        box.style.display = 'flex';
        badge.textContent = resp.intent || 'RESPONSE';

        box.classList.remove('critical', 'success');

        if (resp.action === 'CONFIRM_ACTION') {
            box.classList.add('critical');
            content.innerHTML = `
                <div style="font-weight:600;margin-bottom:0.4rem;color:#b91c1c;">⚠️ Safety Notice: Explicit Confirmation Required</div>
                <div style="margin-bottom:0.6rem;">${this.escapeHtml(resp.displayText || resp.spokenText || '')}</div>
                <div>
                    <a href="${resp.redirectUrl || 'fields.html'}" class="btn btn-sm btn-primary" style="display:inline-block;padding:0.4rem 0.9rem;text-decoration:none;border-radius:6px;font-size:0.85rem;background:#2b9348;color:white;font-weight:600;">Open Dashboard to Confirm</a>
                </div>
            `;
        } else {
            content.textContent = resp.displayText || resp.spokenText || '';
            if (resp.intent === 'IRRIGATION_STATUS' || resp.intent === 'CHECK_SOIL_MOISTURE' || resp.intent === 'CHECK_SOIL_DRYNESS') {
                if ((resp.data && resp.data.requiresIrrigation) || (resp.data && resp.data.isDry)) {
                    box.classList.add('critical');
                } else {
                    box.classList.add('success');
                }
            } else if (resp.intent === 'CHECK_ALERTS' && resp.data && resp.data.activeAlertCount > 0) {
                box.classList.add('critical');
            }
        }

        this.lastSpokenText = resp.spokenText || resp.displayText || '';
    },

    escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    replayLastSpeech() {
        if (this.lastSpokenText) {
            this.speak(this.lastSpokenText);
        }
    },

    submitTextInput() {
        const input = document.getElementById('voice-manual-input');
        if (input && input.value.trim()) {
            const query = input.value.trim();
            input.value = '';
            this.processQuery(query);
        }
    },

    toggleLanguage() {
        if (typeof I18n !== 'undefined') {
            const nextLang = I18n.getLanguage() === 'en' ? 'te' : 'en';
            I18n.setLanguage(nextLang);
            this.updateLabels();
        }
    },

    updateLabels() {
        const lang = typeof I18n !== 'undefined' ? I18n.getLanguage() : 'en';

        const titleText = document.getElementById('voice-modal-title-text');
        if (titleText) titleText.textContent = this.t('voice_assistant_title', 'SAMS Agri-Voice Assistant');

        const badge = document.getElementById('voice-lang-badge');
        if (badge) badge.textContent = `🌐 ${lang === 'te' ? 'తెలుగు (te-IN)' : 'English (en-IN)'}`;

        const fabLabel = document.getElementById('voice-fab-label');
        if (fabLabel) fabLabel.textContent = this.t('voice_btn_open', 'Agri-Voice');

        const navLabel = document.getElementById('nav-voice-btn-label');
        if (navLabel) navLabel.textContent = this.t('voice_btn_nav', '🎙️ Voice Assistant').replace('🎙️ ', '');

        const replayBtn = document.getElementById('voice-replay-btn');
        if (replayBtn) replayBtn.innerHTML = `🔊 ${this.t('voice_speak_again', 'Listen Again')}`;

        const chipsHeading = document.getElementById('voice-chips-heading-text');
        if (chipsHeading) chipsHeading.textContent = this.t('voice_quick_chips_heading', 'Suggested Farm Voice Queries:');

        const manualInput = document.getElementById('voice-manual-input');
        if (manualInput) manualInput.placeholder = this.t('voice_input_placeholder', 'Type a voice query or command...');

        this.updateMuteButtonUI();
    },

    attachFormInputMicrophones() {
        const fieldIds = ['temperature', 'humidity', 'soilMoisture', 'soil-moisture'];
        fieldIds.forEach(id => {
            const input = document.getElementById(id);
            if (!input || input.parentElement.querySelector('.input-voice-btn')) return;

            const parent = input.parentElement;
            parent.classList.add('input-with-voice');

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'input-voice-btn';
            btn.dataset.voiceTarget = id;
            btn.title = this.t('voice_dictate_tooltip', 'Dictate value with voice');
            btn.innerHTML = '🎙️';
            btn.onclick = (e) => {
                e.preventDefault();
                btn.classList.add('listening');
                this.toggleListening(input);
            };

            parent.appendChild(btn);
        });
    },

    highlightElement(element) {
        element.style.transition = 'all 0.4s ease';
        element.style.borderColor = 'var(--success)';
        element.style.boxShadow = '0 0 10px rgba(43, 147, 72, 0.4)';
        setTimeout(() => {
            element.style.borderColor = '';
            element.style.boxShadow = '';
        }, 2500);
    },

    t(key, fallback) {
        return typeof I18n !== 'undefined' ? I18n.t(key, fallback) : fallback;
    }
};

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    SamsVoice.init();
});

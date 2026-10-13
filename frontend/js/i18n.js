/**
 * SAMS - Multi-language support (English, Hindi, Telugu, Tamil, Kannada).
 *
 * Every entry below is  key: [English, Hindi, Telugu, Tamil, Kannada].
 * Use  t('key', {param: value})  in scripts, or  data-i18n="key"  /  data-i18n-placeholder="key"  in HTML.
 * The chosen language is remembered in localStorage and also decides the language of voice in/out.
 */
const LANGS = [
    { code: 'en', label: 'English',  speech: 'en-IN' },
    { code: 'hi', label: 'हिन्दी',    speech: 'hi-IN' },
    { code: 'te', label: 'తెలుగు',   speech: 'te-IN' },
    { code: 'ta', label: 'தமிழ்',    speech: 'ta-IN' },
    { code: 'kn', label: 'ಕನ್ನಡ',    speech: 'kn-IN' }
];
const LANG_KEY = 'sams_lang';

const T = {
    /* ---------- general / navigation ---------- */
    app_name:      ['Smart Farm', 'स्मार्ट खेती', 'స్మార్ట్ వ్యవసాయం', 'ஸ்மார்ட் விவசாயம்', 'ಸ್ಮಾರ್ಟ್ ಕೃಷಿ'],
    sidebar_heading: ['Farmer Menu', 'किसान मेनू', 'రైతు మెనూ', 'விவசாயி மெனு', 'ರೈತ ಮೆನು'],
    nav_home:      ['My Farm', 'मेरा खेत', 'నా పొలం', 'என் வயல்', 'ನನ್ನ ಹೊಲ'],
    nav_check:     ['Check Soil', 'मिट्टी जाँच', 'నేల పరీక్ష', 'மண் சோதனை', 'ಮಣ್ಣು ಪರೀಕ್ಷೆ'],
    nav_dashboard: ['Full Dashboard', 'पूरा डैशबोर्ड', 'పూర్తి డాష్‌బోర్డ్', 'முழு டாஷ்போர்டு', 'ಪೂರ್ಣ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್'],
    nav_fields:    ['Fields', 'खेत', 'పొలాలు', 'வயல்கள்', 'ಹೊಲಗಳು'],
    nav_crops:     ['Crops', 'फसलें', 'పంటలు', 'பயிர்கள்', 'ಬೆಳೆಗಳು'],
    nav_monitoring:['Enter Reading', 'रीडिंग दर्ज करें', 'కొలత నమోదు', 'அளவீடு பதிவு', 'ಅಳತೆ ದಾಖಲಿಸಿ'],
    nav_history:   ['History', 'पुराना रिकॉर्ड', 'పాత రికార్డులు', 'பழைய பதிவுகள்', 'ಹಳೆಯ ದಾಖಲೆಗಳು'],
    nav_alerts:    ['Warnings', 'चेतावनियाँ', 'హెచ్చరికలు', 'எச்சரிக்கைகள்', 'ಎಚ್ಚರಿಕೆಗಳು'],
    nav_reco:      ['What to Grow', 'क्या उगाएँ', 'ఏ పంట వేయాలి', 'என்ன பயிரிடலாம்', 'ಯಾವ ಬೆಳೆ ಬೆಳೆಯಬೇಕು'],
    nav_logout:    ['Logout', 'लॉग आउट', 'లాగ్ అవుట్', 'வெளியேறு', 'ಲಾಗ್ ಔಟ್'],
    language:      ['Language', 'भाषा', 'భాష', 'மொழி', 'ಭಾಷೆ'],
    loading:       ['Loading…', 'लोड हो रहा है…', 'లోడ్ అవుతోంది…', 'ஏற்றுகிறது…', 'ಲೋಡ್ ಆಗುತ್ತಿದೆ…'],
    back_home:     ['← Back to My Farm', '← मेरे खेत पर वापस', '← నా పొలానికి వెనక్కి', '← என் வயலுக்குத் திரும்பு', '← ನನ್ನ ಹೊಲಕ್ಕೆ ಹಿಂದಿರುಗಿ'],

    /* ---------- login / register ---------- */
    login_title:   ['Farmer Login', 'किसान लॉगिन', 'రైతు లాగిన్', 'விவசாயி உள்நுழைவு', 'ರೈತ ಲಾಗಿನ್'],
    login_sub:     ["Sign in to see today's advice for your farm", 'अपने खेत की आज की सलाह देखने के लिए लॉगिन करें', 'మీ పొలానికి ఈ రోజు సలహా చూడటానికి లాగిన్ చేయండి', 'உங்கள் வயலுக்கான இன்றைய ஆலோசனையைப் பார்க்க உள்நுழையுங்கள்', 'ನಿಮ್ಮ ಹೊಲದ ಇಂದಿನ ಸಲಹೆ ನೋಡಲು ಲಾಗಿನ್ ಮಾಡಿ'],
    login_id:      ['Mobile number or email', 'मोबाइल नंबर या ईमेल', 'మొబైల్ నంబర్ లేదా ఈమెయిల్', 'மொபைல் எண் அல்லது மின்னஞ்சல்', 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ಅಥವಾ ಇಮೇಲ್'],
    password:      ['Password', 'पासवर्ड', 'పాస్‌వర్డ్', 'கடவுச்சொல்', 'ಪಾಸ್‌ವರ್ಡ್'],
    login_btn:     ['Login', 'लॉगिन', 'లాగిన్', 'உள்நுழை', 'ಲಾಗಿನ್'],
    no_account:    ['New here?', 'नए हैं?', 'కొత్తవారా?', 'புதியவரா?', 'ಹೊಸಬರೇ?'],
    register_link: ['Create account', 'खाता बनाएँ', 'ఖాతా తెరవండి', 'கணக்கை உருவாக்கு', 'ಖಾತೆ ತೆರೆಯಿರಿ'],
    have_account:  ['Already registered?', 'पहले से खाता है?', 'ఇప్పటికే ఖాతా ఉందా?', 'ஏற்கனவே கணக்கு உள்ளதா?', 'ಈಗಾಗಲೇ ಖಾತೆ ಇದೆಯೇ?'],
    reg_sub:       ['Create your farmer account', 'अपना किसान खाता बनाएँ', 'మీ రైతు ఖాతా తెరవండి', 'உங்கள் விவசாயி கணக்கை உருவாக்குங்கள்', 'ನಿಮ್ಮ ರೈತ ಖಾತೆ ತೆರೆಯಿರಿ'],
    reg_name:      ['Your name', 'आपका नाम', 'మీ పేరు', 'உங்கள் பெயர்', 'ನಿಮ್ಮ ಹೆಸರು'],
    reg_phone:     ['Mobile number', 'मोबाइल नंबर', 'మొబైల్ నంబర్', 'மொபைல் எண்', 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ'],
    reg_email:     ['Email (optional)', 'ईमेल (ज़रूरी नहीं)', 'ఈమెయిల్ (ఐచ్ఛికం)', 'மின்னஞ்சல் (விருப்பம்)', 'ಇಮೇಲ್ (ಐಚ್ಛಿಕ)'],
    reg_pw:        ['Password (min 6 characters)', 'पासवर्ड (कम से कम 6 अक्षर)', 'పాస్‌వర్డ్ (కనీసం 6 అక్షరాలు)', 'கடவுச்சொல் (குறைந்தது 6 எழுத்துகள்)', 'ಪಾಸ್‌ವರ್ಡ್ (ಕನಿಷ್ಠ 6 ಅಕ್ಷರಗಳು)'],
    err_login_fill:['Please enter your mobile number (or email) and password.', 'कृपया मोबाइल नंबर (या ईमेल) और पासवर्ड भरें।', 'దయచేసి మొబైల్ నంబర్ (లేదా ఈమెయిల్), పాస్‌వర్డ్ ఇవ్వండి.', 'மொபைல் எண் (அல்லது மின்னஞ்சல்) மற்றும் கடவுச்சொல்லை உள்ளிடவும்.', 'ದಯವಿಟ್ಟು ಮೊಬೈಲ್ ಸಂಖ್ಯೆ (ಅಥವಾ ಇಮೇಲ್) ಮತ್ತು ಪಾಸ್‌ವರ್ಡ್ ನೀಡಿ.'],
    err_reg_fill:  ['Please enter your name, a mobile number or email, and a password.', 'कृपया नाम, मोबाइल नंबर या ईमेल और पासवर्ड भरें।', 'దయచేసి పేరు, మొబైల్ నంబర్ లేదా ఈమెయిల్, పాస్‌వర్డ్ ఇవ్వండి.', 'பெயர், மொபைல் எண் அல்லது மின்னஞ்சல், கடவுச்சொல்லை உள்ளிடவும்.', 'ದಯವಿಟ್ಟು ಹೆಸರು, ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ಅಥವಾ ಇಮೇಲ್ ಮತ್ತು ಪಾಸ್‌ವರ್ಡ್ ನೀಡಿ.'],
    tap_mic_hint:  ['Tip: tap 🎤 next to a box and speak to fill it.', 'सुझाव: बॉक्स के पास 🎤 दबाएँ और बोलकर भरें।', 'సూచన: బాక్స్ పక్కన 🎤 నొక్కి మాట్లాడి నింపండి.', 'குறிப்பு: பெட்டியின் அருகில் 🎤 அழுத்திப் பேசி நிரப்புங்கள்.', 'ಸಲಹೆ: ಬಾಕ್ಸ್ ಪಕ್ಕದ 🎤 ಒತ್ತಿ ಮಾತನಾಡಿ ತುಂಬಿರಿ.'],

    /* ---------- My Farm (home) ---------- */
    greeting:      ['Hello, {name}!', 'नमस्ते, {name}!', 'నమస్కారం, {name}!', 'வணக்கம், {name}!', 'ನಮಸ್ಕಾರ, {name}!'],
    listen_all:    ["Listen to today's advice", 'आज की सलाह सुनें', 'ఈ రోజు సలహా వినండి', 'இன்றைய ஆலோசனையைக் கேளுங்கள்', 'ಇಂದಿನ ಸಲಹೆ ಕೇಳಿ'],
    summary_intro: ["Here is today's advice for your farm.", 'यह आपके खेत की आज की सलाह है।', 'మీ పొలానికి ఈ రోజు సలహా ఇది.', 'உங்கள் வயலுக்கான இன்றைய ஆலோசனை இது.', 'ನಿಮ್ಮ ಹೊಲಕ್ಕೆ ಇಂದಿನ ಸಲಹೆ ಇದು.'],
    listen:        ['Listen', 'सुनें', 'వినండి', 'கேளுங்கள்', 'ಕೇಳಿ'],
    stop:          ['Stop', 'रोकें', 'ఆపండి', 'நிறுத்து', 'ನಿಲ್ಲಿಸಿ'],
    ask_voice:     ['Ask by voice', 'बोलकर पूछें', 'మాట్లాడి అడగండి', 'பேசிக் கேளுங்கள்', 'ಮಾತನಾಡಿ ಕೇಳಿ'],
    read_page:     ['Read this page', 'यह पेज पढ़ें', 'ఈ పేజీ చదవండి', 'இந்தப் பக்கத்தைப் படியுங்கள்', 'ಈ ಪುಟ ಓದಿ'],
    no_fields:     ['You have no fields yet. Please add a field first.', 'आपका कोई खेत दर्ज नहीं है। पहले खेत जोड़ें।', 'మీకు ఇంకా పొలాలు లేవు. ముందు పొలం చేర్చండి.', 'உங்களுக்கு இன்னும் வயல் எதுவும் இல்லை. முதலில் வயலைச் சேருங்கள்.', 'ನಿಮಗೆ ಇನ್ನೂ ಹೊಲಗಳಿಲ್ಲ. ಮೊದಲು ಹೊಲ ಸೇರಿಸಿ.'],
    add_field:     ['Add field', 'खेत जोड़ें', 'పొలం చేర్చండి', 'வயலைச் சேர்', 'ಹೊಲ ಸೇರಿಸಿ'],
    check_soil_btn:['Check soil', 'मिट्टी जाँचें', 'నేల పరీక్షించండి', 'மண்ணைச் சோதி', 'ಮಣ್ಣು ಪರೀಕ್ಷಿಸಿ'],
    status_urgent: ['Needs action today', 'आज काम ज़रूरी', 'ఈ రోజు పని అవసరం', 'இன்று நடவடிக்கை தேவை', 'ಇಂದು ಕ್ರಮ ಬೇಕು'],
    status_watch:  ['Keep watching', 'नज़र रखें', 'గమనించండి', 'கவனியுங்கள்', 'ಗಮನಿಸಿ'],
    status_good:   ['All good', 'सब ठीक है', 'అన్నీ బాగున్నాయి', 'எல்லாம் நன்றாக உள்ளது', 'ಎಲ್ಲವೂ ಚೆನ್ನಾಗಿದೆ'],
    status_nodata: ['Not checked yet', 'जाँच बाकी है', 'పరీక్ష ఇంకా లేదు', 'சோதனை இல்லை', 'ಪರೀಕ್ಷೆ ಆಗಿಲ್ಲ'],
    soil_label:    ['Soil moisture', 'मिट्टी की नमी', 'నేల తేమ', 'மண் ஈரப்பதம்', 'ಮಣ್ಣಿನ ತೇವಾಂಶ'],
    weather_title: ['Weather', 'मौसम', 'వాతావరణం', 'வானிலை', 'ಹವಾಮಾನ'],
    weather_line:  ['{place}: {temp}°C, humidity {humidity}%, chance of rain {rain}%', '{place}: {temp}°C, नमी {humidity}%, बारिश की संभावना {rain}%', '{place}: {temp}°C, తేమ {humidity}%, వర్షం అవకాశం {rain}%', '{place}: {temp}°C, ஈரப்பதம் {humidity}%, மழை வாய்ப்பு {rain}%', '{place}: {temp}°C, ತೇವಾಂಶ {humidity}%, ಮಳೆ ಸಾಧ್ಯತೆ {rain}%'],
    weather_unavailable: ['Weather not available (no internet).', 'मौसम की जानकारी उपलब्ध नहीं (इंटरनेट नहीं)।', 'వాతావరణ సమాచారం లేదు (ఇంటర్నెట్ లేదు).', 'வானிலை தகவல் இல்லை (இணையம் இல்லை).', 'ಹವಾಮಾನ ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ (ಇಂಟರ್ನೆಟ್ ಇಲ್ಲ).'],
    your_crop:     ['your crop', 'आपकी फसल', 'మీ పంట', 'உங்கள் பயிர்', 'ನಿಮ್ಮ ಬೆಳೆ'],
    more_tools:    ['More tools', 'और साधन', 'మరిన్ని సాధనాలు', 'மேலும் கருவிகள்', 'ಇನ್ನಷ್ಟು ಸಾಧನಗಳು'],

    /* ---------- advice sentences (code -> sentence) ---------- */
    adv_IRRIGATE_NOW: [
        '{field} is dry (soil moisture {moisture}%). Water it today: about {depthCm} cm of water, roughly {litres} litres.',
        '{field} सूखा है (मिट्टी में नमी {moisture}%)। आज ही सिंचाई करें: लगभग {depthCm} सेमी पानी, यानी करीब {litres} लीटर।',
        '{field} పొడిగా ఉంది (నేలలో తేమ {moisture}%). ఈ రోజే నీరు పెట్టండి: సుమారు {depthCm} సెం.మీ. నీరు, అంటే దాదాపు {litres} లీటర్లు.',
        '{field} வறண்டுள்ளது (மண் ஈரப்பதம் {moisture}%). இன்றே தண்ணீர் பாய்ச்சுங்கள்: சுமார் {depthCm} செ.மீ. தண்ணீர், அதாவது கிட்டத்தட்ட {litres} லிட்டர்.',
        '{field} ಒಣಗಿದೆ (ಮಣ್ಣಿನ ತೇವಾಂಶ {moisture}%). ಇಂದೇ ನೀರು ಹಾಯಿಸಿ: ಸುಮಾರು {depthCm} ಸೆಂ.ಮೀ. ನೀರು, ಅಂದರೆ ಸುಮಾರು {litres} ಲೀಟರ್.'],
    adv_WATER_SOON: [
        '{field} will need water in a day or two (soil moisture {moisture}%).',
        '{field} को एक-दो दिन में पानी चाहिए होगा (नमी {moisture}%)।',
        '{field}కి ఒకటి రెండు రోజుల్లో నీరు అవసరం అవుతుంది (తేమ {moisture}%).',
        '{field}க்கு ஒன்று இரண்டு நாளில் தண்ணீர் தேவைப்படும் (ஈரப்பதம் {moisture}%).',
        '{field}ಗೆ ಒಂದೆರಡು ದಿನಗಳಲ್ಲಿ ನೀರು ಬೇಕಾಗುತ್ತದೆ (ತೇವಾಂಶ {moisture}%).'],
    adv_TOO_WET: [
        '{field} is too wet ({moisture}%). Do not water. Let the extra water drain out.',
        '{field} में बहुत ज़्यादा पानी है ({moisture}%)। सिंचाई न करें। अतिरिक्त पानी निकल जाने दें।',
        '{field}లో నీరు ఎక్కువగా ఉంది ({moisture}%). నీరు పెట్టకండి. ఎక్కువ నీరు బయటకు పోనివ్వండి.',
        '{field}ல் தண்ணீர் அதிகமாக உள்ளது ({moisture}%). தண்ணீர் பாய்ச்ச வேண்டாம். அதிகமான தண்ணீரை வடிய விடுங்கள்.',
        '{field}ನಲ್ಲಿ ನೀರು ಹೆಚ್ಚಾಗಿದೆ ({moisture}%). ನೀರು ಹಾಯಿಸಬೇಡಿ. ಹೆಚ್ಚುವರಿ ನೀರು ಹೊರಹೋಗಲು ಬಿಡಿ.'],
    adv_HEAT_STRESS: [
        'It is hot ({temp}°C). Water {crops} early in the morning or in the evening, not at noon.',
        'गर्मी ज़्यादा है ({temp}°C)। {crops} को सुबह जल्दी या शाम को पानी दें, दोपहर में नहीं।',
        'వేడి ఎక్కువగా ఉంది ({temp}°C). {crops}కి ఉదయం త్వరగా లేదా సాయంత్రం నీరు పెట్టండి, మధ్యాహ్నం కాదు.',
        'வெப்பம் அதிகமாக உள்ளது ({temp}°C). {crops} பயிருக்கு அதிகாலை அல்லது மாலையில் தண்ணீர் விடுங்கள், மதியம் வேண்டாம்.',
        'ಬಿಸಿಲು ಹೆಚ್ಚಾಗಿದೆ ({temp}°C). {crops}ಗೆ ಬೆಳಿಗ್ಗೆ ಬೇಗ ಅಥವಾ ಸಂಜೆ ನೀರು ಹಾಯಿಸಿ, ಮಧ್ಯಾಹ್ನ ಬೇಡ.'],
    adv_COLD_RISK: [
        'It is cold ({temp}°C) for {crops}. Cover young plants at night.',
        '{crops} के लिए ठंड ज़्यादा है ({temp}°C)। रात में छोटे पौधों को ढककर रखें।',
        '{crops}కి చలి ఎక్కువగా ఉంది ({temp}°C). రాత్రిపూట చిన్న మొక్కలను కప్పండి.',
        '{crops} பயிருக்கு குளிர் அதிகம் ({temp}°C). இரவில் இளம் செடிகளை மூடி வையுங்கள்.',
        '{crops}ಗೆ ಚಳಿ ಹೆಚ್ಚಾಗಿದೆ ({temp}°C). ರಾತ್ರಿ ಎಳೆಯ ಗಿಡಗಳನ್ನು ಮುಚ್ಚಿ.'],
    adv_DISEASE_RISK: [
        'The air is very humid ({humidity}%). Fungus can spread in {field}. Check the leaves and do not water in the evening.',
        'हवा में नमी बहुत ज़्यादा है ({humidity}%)। {field} में फफूंद फैल सकती है। पत्तियाँ देखें और शाम को पानी न दें।',
        'గాలిలో తేమ చాలా ఎక్కువగా ఉంది ({humidity}%). {field}లో తెగుళ్లు (ఫంగస్) వ్యాపించవచ్చు. ఆకులను చూడండి, సాయంత్రం నీరు పెట్టకండి.',
        'காற்றில் ஈரப்பதம் மிக அதிகம் ({humidity}%). {field}ல் பூஞ்சை நோய் பரவலாம். இலைகளைப் பாருங்கள், மாலையில் தண்ணீர் விட வேண்டாம்.',
        'ಗಾಳಿಯಲ್ಲಿ ತೇವಾಂಶ ತುಂಬಾ ಹೆಚ್ಚಾಗಿದೆ ({humidity}%). {field}ನಲ್ಲಿ ಶಿಲೀಂಧ್ರ ರೋಗ ಹರಡಬಹುದು. ಎಲೆಗಳನ್ನು ನೋಡಿ, ಸಂಜೆ ನೀರು ಹಾಯಿಸಬೇಡಿ.'],
    adv_HARVEST_SOON: [
        '{crop} in {field} will be ready to harvest in about {days} days.',
        '{field} में {crop} की कटाई लगभग {days} दिन में होगी।',
        '{field}లోని {crop} దాదాపు {days} రోజుల్లో కోతకు సిద్ధమవుతుంది.',
        '{field}ல் உள்ள {crop} சுமார் {days} நாட்களில் அறுவடைக்குத் தயாராகும்.',
        '{field}ನಲ್ಲಿರುವ {crop} ಸುಮಾರು {days} ದಿನಗಳಲ್ಲಿ ಕೊಯ್ಲಿಗೆ ಸಿದ್ಧವಾಗುತ್ತದೆ.'],
    adv_NO_DATA: [
        'No soil check yet for {field}. Please do a quick soil check.',
        '{field} की मिट्टी की जाँच अभी नहीं हुई है। कृपया मिट्टी की जाँच करें।',
        '{field} నేల పరీక్ష ఇంకా చేయలేదు. దయచేసి నేల పరీక్ష చేయండి.',
        '{field} மண் சோதனை இன்னும் செய்யவில்லை. தயவுசெய்து மண்ணைச் சோதியுங்கள்.',
        '{field} ಮಣ್ಣಿನ ಪರೀಕ್ಷೆ ಇನ್ನೂ ಮಾಡಿಲ್ಲ. ದಯವಿಟ್ಟು ಮಣ್ಣನ್ನು ಪರೀಕ್ಷಿಸಿ.'],
    adv_STALE_DATA: [
        'The last check of {field} was {days} days ago. Please check the soil again.',
        '{field} की पिछली जाँच {days} दिन पहले हुई थी। कृपया मिट्टी फिर से जाँचें।',
        '{field} చివరి పరీక్ష {days} రోజుల క్రితం చేశారు. దయచేసి నేలను మళ్లీ పరీక్షించండి.',
        '{field} கடைசியாக {days} நாட்களுக்கு முன் சோதிக்கப்பட்டது. மண்ணை மீண்டும் சோதியுங்கள்.',
        '{field} ಕೊನೆಯ ಬಾರಿ {days} ದಿನಗಳ ಹಿಂದೆ ಪರೀಕ್ಷಿಸಲಾಗಿತ್ತು. ಮಣ್ಣನ್ನು ಮತ್ತೆ ಪರೀಕ್ಷಿಸಿ.'],
    adv_ALL_GOOD: [
        '{field} is fine today (soil moisture {moisture}%). No water needed.',
        '{field} आज ठीक है (नमी {moisture}%)। पानी की ज़रूरत नहीं।',
        '{field} ఈ రోజు బాగుంది (తేమ {moisture}%). నీరు అవసరం లేదు.',
        '{field} இன்று நன்றாக உள்ளது (ஈரப்பதம் {moisture}%). தண்ணீர் தேவையில்லை.',
        '{field} ಇಂದು ಚೆನ್ನಾಗಿದೆ (ತೇವಾಂಶ {moisture}%). ನೀರು ಬೇಕಿಲ್ಲ.'],
    adv_RAIN_WAIT: [
        'Rain is likely ({chance}% chance). Wait, and do not water {field} now.',
        'बारिश की संभावना है ({chance}%)। अभी {field} में पानी न दें, इंतज़ार करें।',
        'వర్షం పడే అవకాశం ఉంది ({chance}%). ఇప్పుడు {field}కి నీరు పెట్టకండి, వేచి ఉండండి.',
        'மழை வர வாய்ப்பு உள்ளது ({chance}%). இப்போது {field}க்கு தண்ணீர் விட வேண்டாம், காத்திருங்கள்.',
        'ಮಳೆ ಬರುವ ಸಾಧ್ಯತೆ ಇದೆ ({chance}%). ಈಗ {field}ಗೆ ನೀರು ಹಾಯಿಸಬೇಡಿ, ಕಾಯಿರಿ.'],

    /* ---------- crop names (database stores English names) ---------- */
    crop_rice:      ['Rice', 'धान', 'వరి', 'நெல்', 'ಭತ್ತ'],
    crop_wheat:     ['Wheat', 'गेहूं', 'గోధుమ', 'கோதுமை', 'ಗೋಧಿ'],
    crop_maize:     ['Maize', 'मक्का', 'మొక్కజొన్న', 'மக்காச்சோளம்', 'ಮೆಕ್ಕೆಜೋಳ'],
    crop_tomato:    ['Tomato', 'टमाटर', 'టమాటా', 'தக்காளி', 'ಟೊಮೇಟೊ'],
    crop_groundnut: ['Groundnut', 'मूंगफली', 'వేరుశనగ', 'நிலக்கடலை', 'ಕಡಲೆಕಾಯಿ'],

    /* ---------- quick soil check ---------- */
    qc_title:      ['Check your soil', 'अपनी मिट्टी जाँचें', 'మీ నేలను పరీక్షించండి', 'உங்கள் மண்ணைச் சோதியுங்கள்', 'ನಿಮ್ಮ ಮಣ್ಣನ್ನು ಪರೀಕ್ಷಿಸಿ'],
    qc_pick_field: ['Which field?', 'कौन सा खेत?', 'ఏ పొలం?', 'எந்த வயல்?', 'ಯಾವ ಹೊಲ?'],
    qc_squeeze:    ['Take a handful of soil from about 5 inches deep and squeeze it. How does it feel?', 'लगभग 5 इंच गहराई से मुट्ठी भर मिट्टी लें और दबाएँ। कैसी लगती है?', 'సుమారు 5 అంగుళాల లోతు నుండి గుప్పెడు మట్టి తీసుకుని నొక్కండి. ఎలా ఉంది?', 'சுமார் 5 அங்குல ஆழத்திலிருந்து ஒரு பிடி மண்ணை எடுத்து அழுத்துங்கள். எப்படி இருக்கிறது?', 'ಸುಮಾರು 5 ಇಂಚು ಆಳದಿಂದ ಒಂದು ಹಿಡಿ ಮಣ್ಣು ತೆಗೆದು ಒತ್ತಿ. ಹೇಗಿದೆ?'],
    qc_dry:        ['Dry', 'सूखी', 'పొడి', 'வறண்டது', 'ಒಣ'],
    qc_dry_desc:   ['Dusty, crumbles apart, will not hold shape.', 'धूल जैसी, बिखर जाती है, आकार नहीं बनता।', 'దుమ్ములా ఉంది, ముక్కలుగా విడిపోతుంది, ముద్ద కట్టదు.', 'தூசி போல, உதிர்ந்து விடும், உருண்டை பிடிக்காது.', 'ಧೂಳಿನಂತೆ, ಪುಡಿಯಾಗುತ್ತದೆ, ಮುದ್ದೆ ಕಟ್ಟುವುದಿಲ್ಲ.'],
    qc_moist:      ['Moist', 'नम', 'తేమగా', 'ஈரப்பதம்', 'ತೇವ'],
    qc_moist_desc: ['Makes a ball that breaks easily. Feels cool.', 'गोला बनता है जो आसानी से टूट जाता है। ठंडी लगती है।', 'ముద్ద కడుతుంది, సులభంగా విరిగిపోతుంది. చల్లగా అనిపిస్తుంది.', 'உருண்டை பிடிக்கும், எளிதில் உடையும். குளிர்ச்சியாக இருக்கும்.', 'ಮುದ್ದೆ ಕಟ್ಟುತ್ತದೆ, ಸುಲಭವಾಗಿ ಒಡೆಯುತ್ತದೆ. ತಂಪಾಗಿರುತ್ತದೆ.'],
    qc_wet:        ['Wet', 'गीली', 'తడి', 'நனைந்தது', 'ಒದ್ದೆ'],
    qc_wet_desc:   ['Water drips out, or it is sticky mud.', 'पानी टपकता है या चिपचिपा कीचड़ है।', 'నీరు కారుతుంది లేదా జిగురు బురదలా ఉంది.', 'தண்ணீர் வடிகிறது அல்லது ஒட்டும் சேறு போல உள்ளது.', 'ನೀರು ಸೋರುತ್ತದೆ ಅಥವಾ ಅಂಟಾದ ಕೆಸರಿನಂತಿದೆ.'],
    qc_say:        ['Or tap the microphone and say: dry, moist or wet.', 'या माइक दबाकर बोलें: सूखी, नम या गीली।', 'లేదా మైక్ నొక్కి చెప్పండి: పొడి, తేమగా లేదా తడి.', 'அல்லது மைக்கை அழுத்தி சொல்லுங்கள்: வறண்டது, ஈரப்பதம் அல்லது நனைந்தது.', 'ಅಥವಾ ಮೈಕ್ ಒತ್ತಿ ಹೇಳಿ: ಒಣ, ತೇವ ಅಥವಾ ಒದ್ದೆ.'],
    qc_saved:      ['Saved. Here is my advice:', 'सहेज लिया। मेरी सलाह यह है:', 'సేవ్ చేశాను. నా సలహా ఇది:', 'சேமிக்கப்பட்டது. என் ஆலோசனை இது:', 'ಉಳಿಸಲಾಗಿದೆ. ನನ್ನ ಸಲಹೆ ಇದು:'],
    qc_again:      ['Check another field', 'दूसरा खेत जाँचें', 'మరో పొలం పరీక్షించండి', 'மற்றொரு வயலைச் சோதி', 'ಇನ್ನೊಂದು ಹೊಲ ಪರೀಕ್ಷಿಸಿ'],
    qc_not_heard:  ['I did not catch that. Please say dry, moist or wet.', 'समझ नहीं आया। कृपया सूखी, नम या गीली बोलें।', 'అర్థం కాలేదు. దయచేసి పొడి, తేమగా లేదా తడి అని చెప్పండి.', 'புரியவில்லை. வறண்டது, ஈரப்பதம் அல்லது நனைந்தது என்று சொல்லுங்கள்.', 'ಅರ್ಥವಾಗಲಿಲ್ಲ. ಒಣ, ತೇವ ಅಥವಾ ಒದ್ದೆ ಎಂದು ಹೇಳಿ.'],

    /* ---------- voice ---------- */
    v_listening:   ['Listening… speak now', 'सुन रहा हूँ… बोलिए', 'వింటున్నాను… చెప్పండి', 'கேட்கிறேன்… பேசுங்கள்', 'ಕೇಳುತ್ತಿದ್ದೇನೆ… ಹೇಳಿ'],
    v_you_said:    ['You said', 'आपने कहा', 'మీరు చెప్పింది', 'நீங்கள் சொன்னது', 'ನೀವು ಹೇಳಿದ್ದು'],
    v_unsupported: ['Voice input needs Chrome or Edge. You can still tap the buttons.', 'बोलकर पूछने के लिए Chrome या Edge चाहिए। आप बटन दबा सकते हैं।', 'మాట్లాడటానికి Chrome లేదా Edge కావాలి. మీరు బటన్లు నొక్కవచ్చు.', 'பேசுவதற்கு Chrome அல்லது Edge தேவை. நீங்கள் பொத்தான்களை அழுத்தலாம்.', 'ಮಾತನಾಡಲು Chrome ಅಥವಾ Edge ಬೇಕು. ನೀವು ಬಟನ್‌ಗಳನ್ನು ಒತ್ತಬಹುದು.'],
    v_no_voice:    ['This phone has no voice for this language. Open Settings > Text-to-speech and install it.', 'इस फोन में इस भाषा की आवाज़ नहीं है। सेटिंग्स > टेक्स्ट-टू-स्पीच में जाकर इंस्टॉल करें।', 'ఈ ఫోన్‌లో ఈ భాష వాయిస్ లేదు. సెట్టింగ్స్ > టెక్స్ట్-టు-స్పీచ్ లో ఇన్‌స్టాల్ చేయండి.', 'இந்த போனில் இந்த மொழிக்கான குரல் இல்லை. அமைப்புகள் > டெக்ஸ்ட்-டு-ஸ்பீச் சென்று நிறுவுங்கள்.', 'ಈ ಫೋನ್‌ನಲ್ಲಿ ಈ ಭಾಷೆಯ ಧ್ವನಿ ಇಲ್ಲ. ಸೆಟ್ಟಿಂಗ್ಸ್ > ಟೆಕ್ಸ್ಟ್-ಟು-ಸ್ಪೀಚ್ ನಲ್ಲಿ ಇನ್‌ಸ್ಟಾಲ್ ಮಾಡಿ.'],
    v_mic_blocked: ['Please allow the microphone in the browser.', 'कृपया ब्राउज़र में माइक्रोफ़ोन की अनुमति दें।', 'దయచేసి బ్రౌజర్‌లో మైక్రోఫోన్‌కు అనుమతి ఇవ్వండి.', 'உலாவியில் மைக்ரோஃபோனுக்கு அனுமதி கொடுங்கள்.', 'ದಯವಿಟ್ಟು ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಮೈಕ್ರೊಫೋನ್‌ಗೆ ಅನುಮತಿ ನೀಡಿ.'],
    v_no_speech:   ['I heard nothing. Tap the microphone and try again.', 'कुछ सुनाई नहीं दिया। माइक दबाकर फिर कोशिश करें।', 'ఏమీ వినిపించలేదు. మైక్ నొక్కి మళ్లీ ప్రయత్నించండి.', 'எதுவும் கேட்கவில்லை. மைக்கை அழுத்தி மீண்டும் முயலுங்கள்.', 'ಏನೂ ಕೇಳಿಸಲಿಲ್ಲ. ಮೈಕ್ ಒತ್ತಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.'],
    v_network:     ['Voice input needs internet. Please check your connection.', 'बोलकर पूछने के लिए इंटरनेट चाहिए। कनेक्शन जाँचें।', 'మాట్లాడటానికి ఇంటర్నెట్ కావాలి. కనెక్షన్ చూడండి.', 'பேசுவதற்கு இணையம் தேவை. இணைப்பைச் சரிபாருங்கள்.', 'ಮಾತನಾಡಲು ಇಂಟರ್ನೆಟ್ ಬೇಕು. ಸಂಪರ್ಕ ಪರಿಶೀಲಿಸಿ.'],
    v_help:        ['You can say: how is my farm, do I need water, will it rain, show warnings, check my soil, or what to grow.', 'आप बोल सकते हैं: मेरे खेत का हाल, पानी चाहिए क्या, बारिश होगी क्या, चेतावनी दिखाओ, मिट्टी जाँचो, या क्या उगाऊँ।', 'మీరు ఇలా చెప్పవచ్చు: నా పొలం ఎలా ఉంది, నీరు కావాలా, వర్షం పడుతుందా, హెచ్చరికలు చూపు, నేల పరీక్ష, లేదా ఏ పంట వేయాలి.', 'நீங்கள் சொல்லலாம்: என் வயல் எப்படி, தண்ணீர் வேண்டுமா, மழை வருமா, எச்சரிக்கைகள் காட்டு, மண் சோதனை, அல்லது என்ன பயிரிடலாம்.', 'ನೀವು ಹೇಳಬಹುದು: ನನ್ನ ಹೊಲ ಹೇಗಿದೆ, ನೀರು ಬೇಕೇ, ಮಳೆ ಬರುತ್ತದೆಯೇ, ಎಚ್ಚರಿಕೆಗಳು ತೋರಿಸು, ಮಣ್ಣು ಪರೀಕ್ಷೆ, ಅಥವಾ ಯಾವ ಬೆಳೆ ಬೆಳೆಯಬೇಕು.'],
    v_didnt:       ['Sorry, I did not understand.', 'माफ़ कीजिए, मैं समझ नहीं पाया।', 'క్షమించండి, నాకు అర్థం కాలేదు.', 'மன்னிக்கவும், எனக்குப் புரியவில்லை.', 'ಕ್ಷಮಿಸಿ, ನನಗೆ ಅರ್ಥವಾಗಲಿಲ್ಲ.'],
    v_opening:     ['Opening {page}', '{page} खोल रहा हूँ', '{page} తెరుస్తున్నాను', '{page} திறக்கிறேன்', '{page} ತೆರೆಯುತ್ತಿದ್ದೇನೆ'],
    v_no_warnings: ['There are no warnings. Your fields are fine.', 'कोई चेतावनी नहीं है। आपके खेत ठीक हैं।', 'హెచ్చరికలు ఏవీ లేవు. మీ పొలాలు బాగున్నాయి.', 'எச்சரிக்கைகள் எதுவும் இல்லை. உங்கள் வயல்கள் நன்றாக உள்ளன.', 'ಯಾವುದೇ ಎಚ್ಚರಿಕೆ ಇಲ್ಲ. ನಿಮ್ಮ ಹೊಲಗಳು ಚೆನ್ನಾಗಿವೆ.'],
    v_water_none:  ['None of your fields needs water right now.', 'अभी आपके किसी खेत को पानी की ज़रूरत नहीं है।', 'ప్రస్తుతం మీ పొలాల్లో ఏదానికీ నీరు అవసరం లేదు.', 'இப்போது உங்கள் வயல்கள் எதற்கும் தண்ணீர் தேவையில்லை.', 'ಈಗ ನಿಮ್ಮ ಯಾವ ಹೊಲಕ್ಕೂ ನೀರು ಬೇಕಿಲ್ಲ.'],
    v_rain_line:   ['Chance of rain in {place}: {rain}%.', '{place} में बारिश की संभावना: {rain}%।', '{place}లో వర్షం అవకాశం: {rain}%.', '{place}ல் மழை வாய்ப்பு: {rain}%.', '{place}ನಲ್ಲಿ ಮಳೆ ಸಾಧ್ಯತೆ: {rain}%.']
};

/* ------------------------------------------------------------------ engine */
const I18N = (() => {
    const order = LANGS.map(l => l.code);

    function get() {
        let saved = null;
        try { saved = localStorage.getItem(LANG_KEY); } catch (e) { /* storage blocked */ }
        return order.includes(saved) ? saved : 'en';
    }

    function set(code) {
        if (!order.includes(code)) return;
        try { localStorage.setItem(LANG_KEY, code); } catch (e) { /* ignore */ }
        document.documentElement.lang = code;
    }

    function speechCode(code) {
        const l = LANGS.find(x => x.code === (code || get()));
        return l ? l.speech : 'en-IN';
    }

    function t(key, params, forceLang) {
        const idx = order.indexOf(forceLang || get());
        const entry = T[key];
        if (!entry) return key;
        let s = entry[idx] || entry[0];
        if (params) {
            s = s.replace(/\{(\w+)\}/g, (m, k) => (params[k] !== undefined && params[k] !== null ? params[k] : ''));
        }
        return s;
    }

    /** Translates a crop name stored in English in the database; unknown names are shown as they are. */
    function cropName(name) {
        if (!name) return '';
        return name.split(',').map(n => {
            const k = 'crop_' + n.trim().toLowerCase();
            return T[k] ? t(k) : n.trim();
        }).join(', ');
    }

    /** Turns one advice item from /api/advisory into a sentence in the farmer's language. */
    function adviceText(item) {
        const key = 'adv_' + item.code;
        if (!T[key]) return item.message || '';
        const p = Object.assign({}, item.params || {});
        if (p.crops !== undefined) p.crops = p.crops ? cropName(p.crops) : t('your_crop');
        if (p.crop !== undefined) p.crop = cropName(p.crop);
        if (typeof p.litres === 'number') p.litres = p.litres.toLocaleString('en-IN');
        return t(key, p);
    }

    function apply(root) {
        (root || document).querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
        (root || document).querySelectorAll('[data-i18n-placeholder]').forEach(el => { el.placeholder = t(el.dataset.i18nPlaceholder); });
        (root || document).querySelectorAll('[data-i18n-title]').forEach(el => { el.title = t(el.dataset.i18nTitle); });
    }

    return { get, set, t, apply, speechCode, cropName, adviceText, langs: LANGS };
})();

const t = (key, params, lang) => I18N.t(key, params, lang);
document.documentElement.lang = I18N.get();
document.addEventListener('DOMContentLoaded', () => I18N.apply());

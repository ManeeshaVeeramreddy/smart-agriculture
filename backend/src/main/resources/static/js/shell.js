/**
 * SAMS - shared "farmer shell": language switcher, translated menu, voice assistant button and
 * 🎤 dictation on every text box. Included on every farmer page and on login/register.
 */
(function () {
    const page = (location.pathname.split('/').pop() || 'index.html');
    const isPublic = ['login.html', 'register.html'].includes(page);

    const MENU = {
        'farmer-home.html':        { icon: '🏠', key: 'nav_home' },
        'quick-check.html':        { icon: '🖐️', key: 'nav_check' },
        'farmer-dashboard.html':   { icon: '📊', key: 'nav_dashboard' },
        'fields.html':             { icon: '🌱', key: 'nav_fields' },
        'crops.html':              { icon: '🌾', key: 'nav_crops' },
        'monitoring.html':         { icon: '🌡️', key: 'nav_monitoring' },
        'monitoring-history.html': { icon: '📜', key: 'nav_history' },
        'alerts.html':             { icon: '🚨', key: 'nav_alerts' },
        'recommendation.html':     { icon: '💡', key: 'nav_reco' }
    };

    function ensureStyles() {
        if (![...document.styleSheets].some(s => (s.href || '').includes('farmer.css'))) {
            const l = document.createElement('link');
            l.rel = 'stylesheet';
            l.href = 'css/farmer.css';
            document.head.appendChild(l);
        }
    }

    function changeLanguage(code) {
        I18N.set(code);
        Voice.stop();
        location.reload();
    }

    function langSelect() {
        const sel = document.createElement('select');
        sel.className = 'lang-select';
        sel.id = 'lang-select';
        sel.setAttribute('aria-label', t('language'));
        I18N.langs.forEach(l => {
            const o = document.createElement('option');
            o.value = l.code;
            o.textContent = '🌐 ' + l.label;
            if (l.code === I18N.get()) o.selected = true;
            sel.appendChild(o);
        });
        sel.addEventListener('change', () => changeLanguage(sel.value));
        return sel;
    }

    function setupNavbar() {
        const nav = document.querySelector('.navbar');
        if (!nav || nav.querySelector('.lang-select')) return;
        const user = nav.querySelector('.nav-user');
        const right = document.createElement('div');
        right.className = 'nav-right';
        right.appendChild(langSelect());
        if (user) { nav.replaceChild(right, user); right.appendChild(user); } else { nav.appendChild(right); }
    }

    function setupSidebar() {
        const side = document.querySelector('.sidebar');
        if (!side) return;
        const heading = side.querySelector('.sidebar-heading');
        if (heading) heading.textContent = t('sidebar_heading');

        // make sure the two farmer-first links exist at the top
        ['quick-check.html', 'farmer-home.html'].forEach(href => {
            if (!side.querySelector('a[href="' + href + '"]')) {
                const a = document.createElement('a');
                a.href = href;
                if (heading) heading.insertAdjacentElement('afterend', a); else side.prepend(a);
            }
        });
        side.querySelectorAll('a[href]').forEach(a => {
            const m = MENU[a.getAttribute('href')];
            if (m) {
                a.textContent = m.icon + ' ' + t(m.key);
                if (a.getAttribute('href') === page) a.classList.add('active');
            } else if (a.getAttribute('onclick') && a.getAttribute('onclick').includes('logout')) {
                a.textContent = '🚪 ' + t('nav_logout');
            }
        });
    }

    function setupPublicLangBar() {
        const card = document.querySelector('.auth-card');
        if (!card || card.querySelector('.lang-bar')) return;
        const bar = document.createElement('div');
        bar.className = 'lang-bar';
        I18N.langs.forEach(l => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'lang-chip' + (l.code === I18N.get() ? ' active' : '');
            b.textContent = l.label;
            b.addEventListener('click', () => changeLanguage(l.code));
            bar.appendChild(b);
        });
        card.insertBefore(bar, card.firstChild);
    }

    function attachDictation() {
        const scope = 'form';
        document.querySelectorAll(scope + ' input[type=text], ' + scope + ' input[type=tel], ' + scope + ' input[type=number], ' + scope + ' textarea')
            .forEach(el => { if (!el.readOnly && !el.disabled) Voice.attachDictation(el); });
    }

    document.addEventListener('DOMContentLoaded', () => {
        ensureStyles();
        I18N.apply();
        if (isPublic) {
            setupPublicLangBar();
        } else {
            setupNavbar();
            setupSidebar();
            Assistant.mount();
            // translate the "Welcome, name" box written by renderNavUser()
            setTimeout(() => { const lo = document.querySelector('#nav-user-info button'); if (lo) lo.textContent = t('nav_logout'); }, 0);
        }
        attachDictation();
    });
})();

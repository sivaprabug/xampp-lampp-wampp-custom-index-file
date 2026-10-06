(() => {
    'use strict';

    const root = document.documentElement;
    const content = document.querySelector('.markdown-body');
    const ipInput = document.getElementById('ip-input');
    const toast = document.getElementById('toast');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const tocToggle = document.getElementById('toc-toggle');
    const themeToggle = document.getElementById('theme-toggle');
    const dialog = document.getElementById('diagram-dialog');
    const diagrams = [];
    let mermaid;
    let toastTimer;
    let diagramVersion = 0;
    let activeDiagram;

    function notify(message) {
        clearTimeout(toastTimer);
        toast.textContent = message;
        toast.classList.add('visible');
        toastTimer = setTimeout(() => toast.classList.remove('visible'), 2400);
    }

    function iconButton(icon, label, action) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'icon-button';
        button.title = label;
        button.setAttribute('aria-label', label);
        const glyph = document.createElement('i');
        glyph.className = `fa-solid ${icon}`;
        glyph.setAttribute('aria-hidden', 'true');
        button.append(glyph);
        button.addEventListener('click', action);
        return button;
    }

    async function copyText(text, button) {
        try {
            try {
                if (!navigator.clipboard) throw new Error('Clipboard unavailable');
                await navigator.clipboard.writeText(text);
            } catch (error) {
                const textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.style.cssText = 'position:fixed;left:-9999px;top:0';
                document.body.append(textarea);
                const previousFocus = document.activeElement;
                textarea.select();
                const copied = document.execCommand('copy');
                textarea.remove();
                previousFocus?.focus({ preventScroll: true });
                if (!copied) throw new Error('Copy refused');
            }
            button.classList.add('copied');
            button.title = 'Copied!';
            button.setAttribute('aria-label', 'Copied!');
            notify('Copied to clipboard');
            setTimeout(() => {
                button.classList.remove('copied');
                button.title = button.dataset.label;
                button.setAttribute('aria-label', button.dataset.label);
            }, 1800);
        } catch (error) {
            notify('Copy unavailable. Select the text to copy it manually.');
        }
    }

    function validTarget(value) {
        return /^(?:\d{1,3}\.){3}\d{1,3}$/.test(value)
            && value.split('.').every(part => Number(part) <= 255);
    }

    function substituteTarget(source, target, language) {
        if (!target) return source;
        let result = source.replace(/\b192\.168\.1\.100\b|\{\{\s*(?:BMC_IP|TARGET_IP)\s*\}\}|<BMC_IP>|<TARGET_IP>/g, target);
        if (['bash', 'sh', 'shell', 'shell-session', 'console', 'text'].includes(language)
            && /\b(?:curl|wget|ssh|ipmitool)\b/.test(source)) {
            result = result.replace(/(https?:\/\/)(\d{1,3}(?:\.\d{1,3}){3})(?=[:/\s]|$)/g,
                (match, protocol, host) => /^(?:127\.|0\.|169\.254\.)/.test(host) ? match : protocol + target);
        }
        return result;
    }

    if (window.hljs) {
        window.hljs.registerLanguage('system-log', () => ({
            aliases: ['log', 'logs', 'syslog'],
            contains: [
                { scope: 'number', match: /\b\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?\b/ },
                { scope: 'number', match: /\b\d{2}:\d{2}:\d{2}\b/ },
                { scope: 'deletion', match: /\b(?:ERROR|FATAL|CRITICAL|FAILED)\b/i },
                { scope: 'attr', match: /\b(?:WARN|WARNING)\b/i },
                { scope: 'addition', match: /\b(?:INFO|NOTICE|OK)\b/i },
                { scope: 'comment', match: /\b(?:DEBUG|TRACE)\b/i },
                { scope: 'title', match: /[\w.-]+\[\d+\]:/ }
            ]
        }));
    }

    const codeBlocks = Array.from(document.querySelectorAll('.code-block-container')).map(container => {
        const code = container.querySelector('pre code');
        const source = code.textContent;
        const language = container.dataset.language.toLowerCase();
        const toolbar = document.createElement('div');
        toolbar.className = 'code-toolbar';
        const label = document.createElement('span');
        label.className = 'code-label';
        label.textContent = ['bash', 'sh', 'shell'].includes(language) ? 'terminal / ' + language : language;
        const button = iconButton('fa-copy', 'Copy command', () => copyText(code.textContent, button));
        button.dataset.label = 'Copy command';
        toolbar.append(label, button);
        container.prepend(toolbar);
        return { code, source, language };
    });

    function updateCommands() {
        const value = ipInput.value.trim();
        const valid = !value || validTarget(value);
        ipInput.setAttribute('aria-invalid', String(!valid));
        document.getElementById('target-status').textContent = !valid ? 'Invalid IPv4 address' : value ? `Target: ${value}` : 'Original command targets';
        codeBlocks.forEach(({ code, source, language }) => {
            const text = substituteTarget(source, valid ? value : '', language);
            const highlightLanguage = ['console', 'shell-session'].includes(language) ? 'bash' : language;
            if (window.hljs?.getLanguage(highlightLanguage)) {
                code.innerHTML = window.hljs.highlight(text, { language: highlightLanguage, ignoreIllegals: true }).value;
                code.classList.add('hljs');
            } else {
                code.textContent = text;
            }
        });
    }
    ipInput.addEventListener('input', updateCommands);
    updateCommands();
    const copyHost = document.getElementById('copy-host');
    copyHost.dataset.label = 'Copy target IP';
    copyHost.addEventListener('click', () => {
        if (validTarget(ipInput.value.trim())) copyText(ipInput.value.trim(), copyHost);
        else notify('Enter a valid target IPv4 address first.');
    });
    document.getElementById('export-pdf').addEventListener('click', () => window.print());

    const headings = Array.from(content?.querySelectorAll('h1, h2, h3') || []);
    const usedIds = new Set();
    const tocLinks = headings.map((heading, index) => {
        const label = heading.textContent;
        const slug = label.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/[\s-]+/g, '-') || `section-${index + 1}`;
        let identifier = slug;
        let suffix = 2;
        while (usedIds.has(identifier)) identifier = `${slug}-${suffix++}`;
        usedIds.add(identifier);
        heading.id = identifier;
        const anchor = document.createElement('a');
        anchor.className = 'heading-anchor';
        anchor.href = location.pathname + location.search + '#' + identifier;
        while (heading.firstChild) anchor.append(heading.firstChild);
        heading.append(anchor);
        const link = document.createElement('a');
        link.className = `toc-link level-${heading.tagName.slice(1)}`;
        link.href = anchor.href;
        link.textContent = label;
        document.getElementById('toc-links').append(link);
        return link;
    });
    document.getElementById('toc-empty').hidden = headings.length > 0;
    let scrollScheduled = false;
    function updateActiveHeading() {
        const offset = document.querySelector('.topbar').getBoundingClientRect().height + 45;
        let active = 0;
        headings.forEach((heading, index) => {
            if (heading.getBoundingClientRect().top <= offset) active = index;
        });
        tocLinks.forEach((link, index) => {
            link.classList.toggle('active', index === active);
            if (index === active) link.setAttribute('aria-current', 'location');
            else link.removeAttribute('aria-current');
        });
        scrollScheduled = false;
    }
    window.addEventListener('scroll', () => {
        if (!scrollScheduled) {
            scrollScheduled = true;
            requestAnimationFrame(updateActiveHeading);
        }
    }, { passive: true });
    updateActiveHeading();
    content?.querySelectorAll('a[href]').forEach(link => {
        const href = link.getAttribute('href');
        if (href.startsWith('#')) link.href = location.pathname + location.search + href;
        else if (/^https?:/i.test(href) && new URL(link.href).origin !== location.origin) {
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
        } else if (/^[^/?#]+\.md(?:#.*)?$/i.test(href)) {
            const [file, fragment] = href.split('#');
            link.href = 'library/render.php?file=' + encodeURIComponent(decodeURIComponent(file)) + (fragment ? '#' + fragment : '');
        }
    });
    if (location.hash) {
        const heading = document.getElementById(decodeURIComponent(location.hash.slice(1)));
        heading?.scrollIntoView({ behavior: 'instant' });
    }

    content?.querySelectorAll('table').forEach(table => {
        const wrapper = document.createElement('div');
        wrapper.className = 'table-scroll';
        wrapper.tabIndex = 0;
        wrapper.setAttribute('role', 'region');
        wrapper.setAttribute('aria-label', 'Scrollable data table');
        table.replaceWith(wrapper);
        wrapper.append(table);
    });

    let selectedCategory = '';
    const fileSearch = document.getElementById('file-search');
    const categoryButtons = Array.from(document.querySelectorAll('.category-button'));
    const files = Array.from(document.querySelectorAll('.file-link'));
    function filterFiles() {
        const term = fileSearch.value.toLowerCase().trim();
        let visible = 0;
        files.forEach(link => {
            link.hidden = (selectedCategory && link.dataset.category !== selectedCategory) || !link.textContent.toLowerCase().includes(term);
            if (!link.hidden) visible++;
        });
        categoryButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.category === selectedCategory)));
        document.getElementById('empty-files').hidden = visible > 0;
        document.getElementById('clear-filter').hidden = !selectedCategory && !term;
    }
    categoryButtons.forEach(button => button.addEventListener('click', () => {
        selectedCategory = selectedCategory === button.dataset.category ? '' : button.dataset.category;
        filterFiles();
    }));
    fileSearch.addEventListener('input', filterFiles);
    document.getElementById('clear-filter').addEventListener('click', () => {
        selectedCategory = '';
        fileSearch.value = '';
        filterFiles();
    });

    function updatePanelState() {
        const mobile = matchMedia('(max-width: 760px)').matches;
        const compact = matchMedia('(max-width: 1200px)').matches;
        const sidebarVisible = mobile ? document.body.classList.contains('sidebar-open') : !document.body.classList.contains('sidebar-hidden');
        const tocVisible = compact ? document.body.classList.contains('toc-open') : !document.body.classList.contains('toc-hidden');
        sidebarToggle.setAttribute('aria-expanded', String(sidebarVisible));
        tocToggle.setAttribute('aria-expanded', String(tocVisible));
    }
    sidebarToggle.addEventListener('click', () => {
        document.body.classList.toggle(matchMedia('(max-width: 760px)').matches ? 'sidebar-open' : 'sidebar-hidden');
        document.body.classList.remove('toc-open');
        updatePanelState();
    });
    tocToggle.addEventListener('click', () => {
        document.body.classList.toggle(matchMedia('(max-width: 1200px)').matches ? 'toc-open' : 'toc-hidden');
        document.body.classList.remove('sidebar-open');
        updatePanelState();
    });
    document.addEventListener('click', event => {
        if (!event.target.closest('.doc-sidebar, #sidebar-toggle, .doc-toc, #toc-toggle')) {
            document.body.classList.remove('sidebar-open', 'toc-open');
            updatePanelState();
        }
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            if (dialog.open) dialog.close();
            document.body.classList.remove('sidebar-open', 'toc-open');
            updatePanelState();
        }
    });
    window.addEventListener('resize', updatePanelState);
    updatePanelState();

    function syncThemeButton() {
        const dark = root.dataset.theme === 'dark';
        const label = dark ? 'Switch to light theme' : 'Switch to dark theme';
        themeToggle.title = label;
        themeToggle.setAttribute('aria-label', label);
        themeToggle.firstElementChild.className = dark ? 'fa-regular fa-sun' : 'fa-regular fa-moon';
    }
    syncThemeButton();
    themeToggle.addEventListener('click', () => {
        root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
        try { localStorage.setItem('docs-theme', root.dataset.theme); } catch (error) { }
        syncThemeButton();
        if (mermaid) renderDiagrams();
    });

    function setZoom(canvas, scale) {
        const svg = canvas.querySelector('svg');
        if (!svg) return;
        const width = Number(canvas.dataset.baseWidth);
        canvas.dataset.scale = String(Math.min(3, Math.max(0.4, scale)));
        canvas.style.width = `${width * Number(canvas.dataset.scale)}px`;
        svg.style.width = '100%';
    }
    function fitDiagram(canvas, viewport) {
        const svg = canvas.querySelector('svg');
        if (!svg) return;
        const width = svg.viewBox.baseVal.width || 700;
        const padding = parseFloat(getComputedStyle(viewport).paddingLeft) * 2;
        canvas.dataset.baseWidth = String(Math.max(1, Math.min(width, viewport.clientWidth - padding)));
        setZoom(canvas, 1);
    }
    function zoomControls(canvas, viewport, fullscreen) {
        const controls = document.createElement('div');
        controls.className = 'diagram-actions';
        controls.append(
            iconButton('fa-minus', 'Zoom out', () => setZoom(canvas, Number(canvas.dataset.scale || 1) - 0.2)),
            iconButton('fa-plus', 'Zoom in', () => setZoom(canvas, Number(canvas.dataset.scale || 1) + 0.2)),
            iconButton('fa-arrow-rotate-left', 'Reset view', () => {
                fitDiagram(canvas, viewport);
                viewport.scrollTo(0, 0);
            })
        );
        if (fullscreen) controls.append(iconButton('fa-expand', 'Fullscreen diagram', fullscreen));
        return controls;
    }
    function openDiagram(diagram) {
        activeDiagram = diagram;
        const canvas = document.getElementById('modal-canvas');
        const viewport = document.getElementById('modal-viewport');
        canvas.replaceChildren(diagram.canvas.querySelector('svg').cloneNode(true));
        document.getElementById('modal-controls').replaceChildren(zoomControls(canvas, viewport));
        dialog.showModal();
        fitDiagram(canvas, viewport);
        viewport.scrollTo(0, 0);
    }
    document.getElementById('close-diagram').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener('close', () => { activeDiagram = null; });

    content?.querySelectorAll('.diagram-source').forEach(source => {
        const panel = document.createElement('section');
        panel.className = 'diagram-panel';
        panel.setAttribute('aria-label', 'Mermaid diagram');
        const toolbar = document.createElement('div');
        toolbar.className = 'diagram-toolbar';
        const label = document.createElement('span');
        label.className = 'diagram-label';
        label.textContent = 'mermaid / diagram';
        const viewport = document.createElement('div');
        viewport.className = 'diagram-viewport';
        viewport.tabIndex = 0;
        viewport.setAttribute('aria-label', 'Scrollable diagram');
        const canvas = document.createElement('div');
        canvas.className = 'diagram-canvas';
        const diagram = { source: source.textContent, canvas, viewport, panel };
        const controls = zoomControls(canvas, viewport, () => {
            if (canvas.querySelector('svg')) openDiagram(diagram);
            else notify('Diagram preview is not available yet.');
        });
        toolbar.append(label, controls);
        canvas.textContent = source.textContent;
        canvas.classList.add('diagram-source');
        viewport.append(canvas);
        const raw = document.createElement('details');
        raw.className = 'diagram-raw';
        const summary = document.createElement('summary');
        summary.textContent = 'Diagram source';
        const pre = document.createElement('pre');
        pre.textContent = source.textContent;
        raw.append(summary, pre);
        panel.append(toolbar, viewport, raw);
        source.replaceWith(panel);
        diagrams.push(diagram);
    });

    async function renderDiagrams() {
        const version = ++diagramVersion;
        mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: root.dataset.theme === 'dark' ? 'dark' : 'default', fontFamily: 'IBM Plex Sans, sans-serif', suppressErrorRendering: true });
        for (const [index, diagram] of diagrams.entries()) {
            try {
                const { svg } = await mermaid.render(`doc-diagram-${version}-${index}`, diagram.source);
                if (version !== diagramVersion) return;
                diagram.canvas.innerHTML = svg;
                diagram.canvas.classList.remove('diagram-source');
                diagram.panel.querySelector('.diagram-error')?.remove();
                fitDiagram(diagram.canvas, diagram.viewport);
                if (dialog.open && activeDiagram === diagram) {
                    const modalCanvas = document.getElementById('modal-canvas');
                    modalCanvas.replaceChildren(diagram.canvas.querySelector('svg').cloneNode(true));
                    fitDiagram(modalCanvas, document.getElementById('modal-viewport'));
                }
            } catch (error) {
                if (version !== diagramVersion) return;
                diagram.canvas.textContent = diagram.source;
                diagram.canvas.classList.add('diagram-source');
                diagram.canvas.style.width = '';
                if (!diagram.panel.querySelector('.diagram-error')) {
                    const message = document.createElement('p');
                    message.className = 'diagram-error';
                    message.textContent = 'Diagram could not be rendered. The source is shown below.';
                    diagram.viewport.before(message);
                }
            }
        }
    }
    if (diagrams.length) {
        import('https://cdn.jsdelivr.net/npm/mermaid@11.12.0/dist/mermaid.esm.min.mjs').then(module => {
            mermaid = module.default;
            renderDiagrams();
        }).catch(() => notify('Mermaid could not load. Diagram sources remain available.'));
    }
    const resizeObserver = new ResizeObserver(() => {
        diagrams.forEach(diagram => fitDiagram(diagram.canvas, diagram.viewport));
        if (dialog.open) fitDiagram(document.getElementById('modal-canvas'), document.getElementById('modal-viewport'));
    });
    diagrams.forEach(diagram => resizeObserver.observe(diagram.viewport));
})();
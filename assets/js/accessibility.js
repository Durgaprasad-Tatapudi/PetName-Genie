import { $ } from './utils.js';

export function initAccessibility() {
    const themeToggle = $('#theme-toggle');
    const a11yToggle = $('#accessibility-toggle');
    const panel = $('#accessibility-panel');
    const largeTextCheck = $('#large-text-toggle');
    const highContrastCheck = $('#high-contrast-toggle');
    const html = document.documentElement;
    const body = document.body;

    // Theme Logic
    const savedTheme = localStorage.getItem('theme') || 'auto';
    applyTheme(savedTheme);

    themeToggle.addEventListener('click', () => {
        const current = html.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        localStorage.setItem('theme', next);
    });

    function applyTheme(theme) {
        if (theme === 'auto') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            html.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        } else {
            html.setAttribute('data-theme', theme);
        }
    }

    // Panel Toggle
    a11yToggle.addEventListener('click', () => {
        panel.hidden = !panel.hidden;
        a11yToggle.setAttribute('aria-expanded', !panel.hidden);
    });

    // Validations for access features
    largeTextCheck.addEventListener('change', (e) => {
        body.classList.toggle('large-text-mode', e.target.checked);
    });

    highContrastCheck.addEventListener('change', (e) => {
        body.classList.toggle('high-contrast-mode', e.target.checked);
    });
}

import { translations } from './translations.js';

export class I18nManager {
  constructor() {
    this.locale = this.detectLocale();
    this.listeners = new Set();
  }

  /**
   * Normalizes any language string (pt, pt-BR, pt_BR, en, en-US, en_US, etc.)
   * into either 'pt-BR' or 'en-US'. Returns null if not recognized.
   */
  normalizeLocale(raw) {
    if (!raw || typeof raw !== 'string') return null;
    const clean = raw.trim().toLowerCase().replace('_', '-');
    if (clean === 'pt' || clean.startsWith('pt-')) {
      return 'pt-BR';
    }
    if (clean === 'en' || clean.startsWith('en-')) {
      return 'en-US';
    }
    return null;
  }

  detectLocale() {
    try {
      const saved = localStorage.getItem('endless_runner_locale');
      if (saved && (saved === 'pt-BR' || saved === 'en-US')) {
        return saved;
      // 1. Check localStorage first (user saved preferences)
      const saved = localStorage.getItem('endless_runner_locale') || localStorage.getItem('endless_runner_lang');
      const normalizedSaved = this.normalizeLocale(saved);
      if (normalizedSaved) {
        return normalizedSaved;
      }
      if (typeof navigator !== 'undefined' && navigator.language) {
        if (navigator.language.toLowerCase().startsWith('pt')) {
          return 'pt-BR';

      // 2. Check browser navigator languages in priority order
      if (typeof navigator !== 'undefined') {
        const candidateLanguages = Array.isArray(navigator.languages) && navigator.languages.length > 0
          ? navigator.languages
          : [navigator.language, navigator.userLanguage, navigator.browserLanguage].filter(Boolean);

        for (const candidate of candidateLanguages) {
          const matched = this.normalizeLocale(candidate);
          if (matched) {
            return matched;
          }
        }
      }
    } catch (e) {
      console.warn('Locale detection error:', e);
    }

    // Default fallback
    return 'pt-BR';
  }

  getLocale() {
    return this.locale;
  }

  setLocale(newLocale) {
    if (newLocale !== 'pt-BR' && newLocale !== 'en-US') return;
    this.locale = newLocale;
    try {
      localStorage.setItem('endless_runner_locale', this.locale);
    } catch (e) {
      console.warn(e);
    }
    const normalized = this.normalizeLocale(newLocale);
    if (!normalized) return;

    this.locale = normalized;
    this.savePreferences();

    this.applyDomTranslations();

    for (const listener of this.listeners) {
      listener(this.locale);
    }
  }

  savePreferences() {
    try {
      localStorage.setItem('endless_runner_locale', this.locale);
    } catch (e) {
      console.warn('Could not save locale to localStorage:', e);
    }
  }

  loadPreferences() {
    const detected = this.detectLocale();
    if (detected !== this.locale) {
      this.setLocale(detected);
    }
  }

  toggleLocale() {
    const next = this.locale === 'pt-BR' ? 'en-US' : 'pt-BR';
    this.setLocale(next);
    return this.locale;
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  t(key, params = {}) {
    const dict = translations[this.locale] || translations['pt-BR'];
    let str = dict[key] || translations['pt-BR'][key] || key;

    for (const [k, v] of Object.entries(params)) {
      str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    }
    return str;
  }

  applyDomTranslations() {
    // 1. Text content
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (key) {
        el.innerHTML = this.t(key);
      }
    });

    // 2. Title / Tooltip attribute
    const titleElements = document.querySelectorAll('[data-i18n-title]');
    titleElements.forEach((el) => {
      const key = el.getAttribute('data-i18n-title');
      if (key) {
        el.setAttribute('title', this.t(key));
      }
    });

    // 3. Update document language tag
    if (document.documentElement) {
      document.documentElement.lang = this.locale;
    }
  }
}

export const i18n = new I18nManager();

import { translations } from './translations.js';

export class I18nManager {
  constructor() {
    this.locale = this.detectLocale();
    this.listeners = new Set();
  }

  detectLocale() {
    try {
      const saved = localStorage.getItem('endless_runner_locale');
      if (saved && (saved === 'pt-BR' || saved === 'en-US')) {
        return saved;
      }
      if (typeof navigator !== 'undefined' && navigator.language) {
        if (navigator.language.toLowerCase().startsWith('pt')) {
          return 'pt-BR';
        }
      }
    } catch (e) {
      console.warn('Locale detection error:', e);
    }
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

    this.applyDomTranslations();

    for (const listener of this.listeners) {
      listener(this.locale);
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

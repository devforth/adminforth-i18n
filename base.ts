import { AdminForthPlugin } from "adminforth";
import type { IAdminForth, IHttpServer } from "adminforth";
import type { I18nBaseOptions, SupportedLanguage } from './types.js';
import iso6391 from 'iso-639-1';
import getFlagEmoji from 'country-flag-svg';
import { parse } from 'bcp-47';

const REGION_CODE_RE = /^[A-Z]{2}$/;

// keys of all translations are original English strings
export const SOURCE_LANGUAGE = 'en';
export const PLURAL_SEPARATOR = '|';
export const SLAVIC_PLURAL_FORMS = 4;

export const SLAVIC_PLURAL_EXAMPLES = {
  uk: 'яблук | яблуко | яблука | яблук', // zero | singular | 2-4 | 5+
  bg: 'ябълки | ябълка | ябълки | ябълки', // zero | singular | 2-4 | 5+
  cs: 'jablek | jablko | jablka | jablek', // zero | singular | 2-4 | 5+
  hr: 'jabuka | jabuka | jabuke | jabuka', // zero | singular | 2-4 | 5+
  mk: 'јаболка | јаболко | јаболка | јаболка', // zero | singular | 2-4 | 5+
  pl: 'jabłek | jabłko | jabłka | jabłek', // zero | singular | 2-4 | 5+
  sk: 'jabĺk | jablko | jablká | jabĺk', // zero | singular | 2-4 | 5+
  sl: 'jabolk | jabolko | jabolka | jabolk', // zero | singular | 2-4 | 5+
  sr: 'јабука | јабука | јабуке | јабука', // zero | singular | 2-4 | 5+
  be: 'яблыкаў | яблык | яблыкі | яблыкаў', // zero | singular | 2-4 | 5+
  ru: 'яблок | яблоко | яблока | яблок', // zero | singular | 2-4 | 5+
};

const countryISO31661ByLangISO6391 = {
  en: 'us', // English → United States
  zh: 'cn', // Chinese → China
  hi: 'in', // Hindi → India
  ar: 'sa', // Arabic → Saudi Arabia
  ko: 'kr', // Korean → South Korea
  ja: 'jp', // Japanese → Japan
  uk: 'ua', // Ukrainian → Ukraine
  ur: 'pk', // Urdu → Pakistan
  sr: 'rs', // Serbian → Serbia
  da: 'dk' // Danish → Denmark
};

export function getCountryCodeFromLangCode(lang: SupportedLanguage) {
  const [langCode, region] = String(lang).split('-');
  if (region && REGION_CODE_RE.test(region)) {
    return region.toLowerCase();
  }
  return countryISO31661ByLangISO6391[langCode] || langCode;
}

export function getPrimaryLanguageCode(langCode: SupportedLanguage): string {
  return String(langCode).split('-')[0];
}

// languages which need 4 plural forms "zero | singular | 2-4 | 5+" instead of English ones
export function requiresSlavicPlurals(lang: string): boolean {
  return getPrimaryLanguageCode(lang as SupportedLanguage) in SLAVIC_PLURAL_EXAMPLES;
}

export function isValidSupportedLanguageTag(langCode: SupportedLanguage): boolean {
  try {
    const schema = parse(String(langCode),
      {
        normalize: true,
        warning: (reason, code, offset) => {
          console.warn(`Warning in validating language tag ${langCode}: reason=${reason}, code=${code}, offset=${offset}`);
        }
      }
    );
    const isValid = schema.language.length === 2;
    return isValid;
  } catch (e) {
    return false;
  }
}

/**
 * Storage-independent part of i18n plugins: language validation, language selector components,
 * frontend messages endpoint and formatting of translated strings (params and pluralization).
 * Subclasses provide translations storage by implementing getCategoryTranslations.
 * Custom components are resolved from this package's custom folder, so subclasses from other packages reuse them.
 */
export abstract class I18nBase<O extends I18nBaseOptions = I18nBaseOptions> extends AdminForthPlugin {
  options: O;
  primaryLanguage: SupportedLanguage;
  adminforth: IAdminForth;

  constructor(options: O) {
    super(options, import.meta.url);
    this.options = options;
    this.primaryLanguage = options.primaryLanguage || SOURCE_LANGUAGE;
    this.validateSupportedLanguages();
  }

  // app has one translations storage, so plugin instance id does not depend on options
  instanceUniqueRepresentation(): string {
    return 'single';
  }

  abstract getCategoryTranslations(category: string, lang: string): Promise<Record<string, string>>;

  // validate each supported language: ISO 639-1 or BCP-47 with region (e.g., en-GB)
  validateSupportedLanguages() {
    this.options.supportedLanguages.forEach((lang) => {
      if (!isValidSupportedLanguageTag(lang)) {
        throw new Error(`Invalid language code ${lang}. Use ISO 639-1 (e.g., 'en') or BCP-47 with region (e.g., 'en-GB').`);
      }
    });
  }

  injectLanguageSelectors(adminforth: IAdminForth) {
    const compMeta = {
      brandSlug: adminforth.config.customization.brandNameSlug,
      pluginInstanceId: this.pluginInstanceId,
      primaryLanguage: this.primaryLanguage,
      afOrder: this.options.loginPageLanguageSelectorOrder || 0,
      supportedLanguages: this.options.supportedLanguages.map(lang => (
        {
          code: lang,
          // lang name on on language native name
          name: iso6391.getNativeName(getPrimaryLanguageCode(lang)),
        }
      ))
    };

    (adminforth.config.customization.loginPageInjections.underLoginButton as Array<any>).push({
      file: this.componentPath('LanguageUnderLogin.vue'),
      meta: compMeta
    });

    (adminforth.config.customization.globalInjections.userMenu).push({
      file: this.componentPath('LanguageInUserMenu.vue'),
      meta: compMeta
    });

    adminforth.config.customization.globalInjections.everyPageBottom.push({
      file: this.componentPath('LanguageEveryPageLoader.vue'),
      meta: compMeta
    });
  }

  // if lang is not supported, fallback to primaryLanguage, then to english
  resolveLanguage(lang: string): string {
    if (!this.options.supportedLanguages.includes(lang as SupportedLanguage)) {
      lang = this.primaryLanguage; // fallback to primary language first
      if (!this.options.supportedLanguages.includes(lang as SupportedLanguage)) {
        lang = SOURCE_LANGUAGE; // final fallback to english
      }
    }
    return lang;
  }

  formatTranslation(msg: string, translation: string, lang: string, params: Record<string, string> | undefined, pluralizationNumber: number | undefined): string {
    let result = translation;
    // if msg has '|' in it, then we need to aplly pluralization
    if (msg.includes(PLURAL_SEPARATOR) && pluralizationNumber !== undefined) {
      result = this.applyPluralization(result, pluralizationNumber, lang);
    }

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (result) {
          result = result.replace(`{${key}}`, value);
        }
      }
    }
    return result;
  }

  applyPluralization(str: string, number: number, lang: string): string {
    const choices = str.split(PLURAL_SEPARATOR);
    const choicesLength = choices.length;

    if (choicesLength > 2) {
      // this is slavic pluralization
      return choices[this.slavicPluralRule(number, choicesLength)];
    } else {
      return number === 1 ? choices[0] : choices[1];
    }
  }

    // taken from here https://vue-i18n.intlify.dev/guide/essentials/pluralization.html#custom-pluralization
  slavicPluralRule(choice, choicesLength) {
    if (choice === 0) {
      return 0
    }

    const teen = choice > 10 && choice < 20
    const endsWithOne = choice % 10 === 1

    if (!teen && endsWithOne) {
      return 1
    }
    if (!teen && choice % 10 >= 2 && choice % 10 <= 4) {
      return 2
    }

    return choicesLength < 4 ? 2 : 3
  }

  async languagesList(): Promise<{
    code: SupportedLanguage;
    nameOnNative: string;
    nameEnglish: string;
    emojiFlag: string;
    svgFlagB64: string;
  }[]> {
    return Promise.all(this.options.supportedLanguages.map(async (lang) => {
      const flagEmoji =
        typeof getFlagEmoji === 'function'
          ? getFlagEmoji
          : getFlagEmoji.default;


      return {
        code: lang,
        nameOnNative: iso6391.getNativeName(getPrimaryLanguageCode(lang)),
        nameEnglish: iso6391.getName(getPrimaryLanguageCode(lang)),
        emojiFlag: getCountryCodeFromLangCode(lang).toUpperCase().replace(/./g, char => String.fromCodePoint(char.charCodeAt(0) + 127397)),
        svgFlagB64: await flagEmoji(getCountryCodeFromLangCode(lang)),
      };
    }));
  }

  setupEndpoints(server: IHttpServer) {
    server.endpoint({
      method: 'GET',
      path: `/plugin/${this.pluginInstanceId}/frontend_messages`,
      noAuth: true,
      handler: async ({ query }) => {
        const lang = query.lang;

        // form map of translations
        const translations = await this.getCategoryTranslations('frontend', lang);
        return translations;

      }
    });
  }
}

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
export const SLAVIC_PLURAL_FORMS_HINT = 'zero | singular | 2-4 | 5+';

// forms in SLAVIC_PLURAL_FORMS_HINT order
export const SLAVIC_PLURAL_EXAMPLES = {
  uk: 'яблук | яблуко | яблука | яблук',
  bg: 'ябълки | ябълка | ябълки | ябълки',
  cs: 'jablek | jablko | jablka | jablek',
  hr: 'jabuka | jabuka | jabuke | jabuka',
  mk: 'јаболка | јаболко | јаболка | јаболка',
  pl: 'jabłek | jabłko | jabłka | jabłek',
  sk: 'jabĺk | jablko | jablká | jabĺk',
  sl: 'jabolk | jabolko | jabolka | jabolk',
  sr: 'јабука | јабука | јабуке | јабука',
  be: 'яблыкаў | яблык | яблыкі | яблыкаў',
  ru: 'яблок | яблоко | яблока | яблок',
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
  da: 'dk', // Danish → Denmark
  sv: 'se', // Swedish → Sweden
  he: 'il', // Hebrew → Israel
  el: 'gr', // Greek → Greece
  cs: 'cz', // Czech → Czech Republic
  vi: 'vn', // Vietnamese → Vietnam
  aa: 'et', // Afar → Ethiopia
  ab: 'ge', // Abkhaz → Georgia
  ae: 'ir', // Avestan → Iran
  af: 'za', // Afrikaans → South Africa
  ak: 'gh', // Akan → Ghana
  am: 'et', // Amharic → Ethiopia
  an: 'es', // Aragonese → Spain
  as: 'in', // Assamese → India
  av: 'ru', // Avaric → Russia
  ay: 'bo', // Aymara → Bolivia
  ba: 'ru', // Bashkir → Russia
  be: 'by', // Belarusian → Belarus
  bi: 'vu', // Bislama → Vanuatu
  bm: 'ml', // Bambara → Mali
  bn: 'bd', // Bengali → Bangladesh
  bo: 'cn', // Tibetan → China
  br: 'fr', // Breton → France
  bs: 'ba', // Bosnian → Bosnia & Herzegovina
  ca: 'es', // Catalan → Spain
  ce: 'ru', // Chechen → Russia
  ch: 'gu', // Chamorro → Guam
  co: 'fr', // Corsican → France
  cr: 'ca', // Cree → Canada
  cu: 'ru', // Old Church Slavonic → Russia
  cv: 'ru', // Chuvash → Russia
  cy: 'gb', // Welsh → United Kingdom
  dv: 'mv', // Divehi → Maldives
  dz: 'bt', // Dzongkha → Bhutan
  ee: 'gh', // Ewe → Ghana
  et: 'ee', // Estonian → Estonia
  eu: 'es', // Basque → Spain
  fa: 'ir', // Persian → Iran
  ff: 'sn', // Fula → Senegal
  fy: 'nl', // Western Frisian → Netherlands
  ga: 'ie', // Irish → Ireland
  gd: 'gb', // Scottish Gaelic → United Kingdom
  gl: 'es', // Galician → Spain
  gn: 'py', // Guaraní → Paraguay
  gu: 'in', // Gujarati → India
  gv: 'im', // Manx → Isle of Man
  ha: 'ng', // Hausa → Nigeria
  ho: 'pg', // Hiri Motu → Papua New Guinea
  hy: 'am', // Armenian → Armenia
  hz: 'na', // Herero → Namibia
  ie: 'ee', // Interlingue → Estonia
  ig: 'ng', // Igbo → Nigeria
  ii: 'cn', // Nuosu → China
  ik: 'us', // Inupiaq → United States
  iu: 'ca', // Inuktitut → Canada
  jv: 'id', // Javanese → Indonesia
  ka: 'ge', // Georgian → Georgia
  kg: 'cd', // Kongo → Congo - Kinshasa
  ki: 'ke', // Kikuyu → Kenya
  kj: 'na', // Kwanyama → Namibia
  kk: 'kz', // Kazakh → Kazakhstan
  kl: 'gl', // Kalaallisut → Greenland
  km: 'kh', // Khmer → Cambodia
  kn: 'in', // Kannada → India
  kr: 'ng', // Kanuri → Nigeria
  ks: 'in', // Kashmiri → India
  ku: 'tr', // Kurdish → Türkiye
  kv: 'ru', // Komi → Russia
  kw: 'gb', // Cornish → United Kingdom
  ky: 'kg', // Kyrgyz → Kyrgyzstan
  la: 'va', // Latin → Vatican City
  lb: 'lu', // Luxembourgish → Luxembourg
  lg: 'ug', // Ganda → Uganda
  li: 'nl', // Limburgish → Netherlands
  ln: 'cd', // Lingala → Congo - Kinshasa
  lo: 'la', // Lao → Laos
  lu: 'cd', // Luba-Katanga → Congo - Kinshasa
  mi: 'nz', // Māori → New Zealand
  ml: 'in', // Malayalam → India
  mr: 'in', // Marathi → India
  ms: 'my', // Malay → Malaysia
  my: 'mm', // Burmese → Myanmar (Burma)
  na: 'nr', // Nauru → Nauru
  nb: 'no', // Norwegian Bokmål → Norway
  nd: 'zw', // Northern Ndebele → Zimbabwe
  ne: 'np', // Nepali → Nepal
  ng: 'na', // Ndonga → Namibia
  nn: 'no', // Norwegian Nynorsk → Norway
  nr: 'za', // Southern Ndebele → South Africa
  nv: 'us', // Navajo → United States
  ny: 'mw', // Chichewa → Malawi
  oc: 'fr', // Occitan → France
  oj: 'ca', // Ojibwe → Canada
  om: 'et', // Oromo → Ethiopia
  or: 'in', // Oriya → India
  os: 'ge', // Ossetian → Georgia
  pa: 'in', // Panjabi → India
  pi: 'gb', // Pāli → United Kingdom
  ps: 'af', // Pashto → Afghanistan
  qu: 'pe', // Quechua → Peru
  rm: 'ch', // Romansh → Switzerland
  rn: 'bi', // Kirundi → Burundi
  sa: 'in', // Sanskrit → India
  sc: 'it', // Sardinian → Italy
  sd: 'pk', // Sindhi → Pakistan
  se: 'no', // Northern Sami → Norway
  sg: 'cf', // Sango → Central African Republic
  si: 'lk', // Sinhala → Sri Lanka
  sl: 'si', // Slovenian → Slovenia
  sm: 'ws', // Samoan → Samoa
  sn: 'zw', // Shona → Zimbabwe
  sq: 'al', // Albanian → Albania
  ss: 'za', // Swati → South Africa
  st: 'za', // Southern Sotho → South Africa
  su: 'id', // Sundanese → Indonesia
  sw: 'tz', // Swahili → Tanzania
  ta: 'in', // Tamil → India
  te: 'in', // Telugu → India
  tg: 'tj', // Tajik → Tajikistan
  ti: 'et', // Tigrinya → Ethiopia
  tk: 'tm', // Turkmen → Turkmenistan
  tl: 'ph', // Tagalog → Philippines
  tn: 'za', // Tswana → South Africa
  ts: 'za', // Tsonga → South Africa
  tt: 'ru', // Tatar → Russia
  tw: 'gh', // Twi → Ghana
  ty: 'pf', // Tahitian → French Polynesia
  ug: 'cn', // Uyghur → China
  ve: 'za', // Venda → South Africa
  wa: 'be', // Walloon → Belgium
  wo: 'sn', // Wolof → Senegal
  xh: 'za', // Xhosa → South Africa
  yi: 'ua', // Yiddish → Ukraine
  yo: 'ng', // Yoruba → Nigeria
  za: 'cn', // Zhuang → China
  zu: 'za', // Zulu → South Africa
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

  // languages translations are written for: strings in source language are the keys themselves
  targetLanguages(): SupportedLanguage[] {
    return this.options.supportedLanguages.filter((lang) => lang !== SOURCE_LANGUAGE);
  }

  // empty translation means "not translated yet", original string is shown instead
  fallbackToOriginal(messages: Record<string, string>): Record<string, string> {
    return Object.fromEntries(Object.entries(messages).map(([key, value]) => [key, value || key]));
  }

  /**
   * Translates backend strings (menu, resource labels, errors) with adminforth.tr,
   * subclass provides only translation lookup in its storage for already resolved language
   */
  installBackendTranslator(adminforth: IAdminForth, lookup: (msg: string, category: string, lang: string) => Promise<string | undefined>) {
    adminforth.tr = async (msg, category, lang, params, pluralizationNumber) => {
      if (!msg) {
        return msg;
      }
      const resolvedLang = this.resolveLanguage(lang);
      const translation = await lookup(msg, category, resolvedLang);
      return this.formatTranslation(msg, translation || msg, resolvedLang, params, pluralizationNumber);
    };
  }

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
          countryCode: getCountryCodeFromLangCode(lang),
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

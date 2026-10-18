
import { callAdminForthApi } from '@/utils';
import dayjsLocales from './dayjsLocales';
import datepickerLocales from './datepickerLocales';
import dayjs from 'dayjs';
import Datepicker from "flowbite-datepicker/Datepicker";
import type { SupportedLanguage } from '../types';


const messagesCache: Record<
    string,
    {
        ts: number;
        messages: Record<string, string>;
    }
> = {};

// cleanup messages after a 2 minutes (cache for instant switching)
setInterval(() => {
    const now = Date.now();
    for (const lang in messagesCache) {
        if (now - messagesCache[lang].ts > 10 * 60 * 1000) {
            delete messagesCache[lang];
        }
    }
}, 60 * 1000);

// i18n is vue-i18n instance
export async function setLang({ setLocaleMessage, locale }: any, pluginInstanceId: string, langIso: string) {

    if (!messagesCache[langIso]) {
        const messages = await callAdminForthApi({
            path: `/plugin/${pluginInstanceId}/frontend_messages?lang=${langIso}`,
            method: 'GET',
        });
        messagesCache[langIso] = {
            ts: Date.now(),
            messages: messages
        };
    }

    // set dayjs locale
    try {
        await dayjsLocales[langIso]();
        dayjs.locale(langIso);
    } catch {
        dayjs.locale('en');
    }

    // set datepicker locale
    if (datepickerLocales[langIso]) {
        Datepicker.locales[langIso] = (await datepickerLocales[langIso]()).default[langIso];
    } else if (Object.keys(datepickerLocales).some((l) => l.startsWith(`${langIso}-`)) && langIso !== 'en') {
        const lang = Object.keys(datepickerLocales).find((l) => l.startsWith(`${langIso}-`));
        Datepicker.locales[langIso] = (await datepickerLocales[lang]()).default[lang];
    }
    
    // set locale and locale message
    setLocaleMessage(langIso, messagesCache[langIso].messages);

    // set the language
    locale.value = langIso;

    document.querySelector('html').setAttribute('lang', langIso);
    setLocalLang(langIso);
}

const LS_LANG_KEY = `afLanguage`;

// options for language selectors, region of BCP-47 tag is added to native language name, e.g. "Português (BR)"
export function getLanguageOptions(supportedLanguages: { code: string, name: string, countryCode: string }[]) {
    return supportedLanguages.map((lang) => {
        const region = String(lang.code).split('-')[1]?.toUpperCase();
        return {
            value: lang.code,
            countryCode: lang.countryCode,
            label: region ? `${lang.name} (${region})` : lang.name,
        };
    });
}

export function getLocalLang(supportedLanguages: {code}[], primaryLanguage?: SupportedLanguage): string {
    let lsLang = localStorage.getItem(LS_LANG_KEY);
    // if someone screwed up the local storage or we stopped language support, lets check if it is in supported languages
    if (lsLang && !supportedLanguages.find((l) => l.code == lsLang)) {
        lsLang = null;
    }
    if (lsLang) {
        return lsLang;
    }
    // read lang from navigator and try find what we have in supported languages
    const lang = navigator.language.split('-')[0];
    const foundLang = supportedLanguages.find((l) => l.code == lang);
    if (foundLang) {
        return foundLang.code;
    }
    if (primaryLanguage && supportedLanguages.find((l) => l.code == primaryLanguage)) {
        return primaryLanguage;
    }

    return supportedLanguages[0].code;
}

export function setLocalLang(lang: string) {
    localStorage.setItem(LS_LANG_KEY, lang);
}

  

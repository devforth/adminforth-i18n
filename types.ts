import { CompletionAdapter, EmailAdapter } from 'adminforth';
import type { LanguageCode } from 'iso-639-1';
import { iso31661Alpha2ToAlpha3 } from 'iso-3166';


// BCP-47 support for types only: primary subtag is ISO 639-1, optional region
type Alpha2Code = keyof typeof iso31661Alpha2ToAlpha3;
type Bcp47LanguageTag = `${LanguageCode}-${Alpha2Code}`;
export type SupportedLanguage = LanguageCode | Bcp47LanguageTag;

export interface PluginOptions {

  /* List of language codes which you want to support. Can be either short ISO 639-1 language codes or/and BCP47 tags */
  supportedLanguages: SupportedLanguage[];

  /**
   * Each translation string will be stored in a separate field, you can remap it to existing columns  using this option
   * By default it will assume field are named like `${lang_code}_string` (e.g. 'en_string', 'uk_string', 'ja_string', 'fr_string')
   */
  translationFieldNames: Partial<Record<SupportedLanguage, string>>;

  /**
   * Each string has a category, e.g. it might come from 'frontend' or some message from backend or column name on backend
   * To deliver translations efficiently we need to store the category of each string.
   * We recommend to put index on this column
   */
  categoryFieldName: string;

  /**
   * Language selector on login page order
   */
  loginPageLanguageSelectorOrder?: number;

  /**
   * Optional source field to store e.g. file name where it first was captured
   */
  sourceFieldName?: string;

  /**
   * Optional field to save list of completed translations
   * Helps to filter out strings which are not translated. If you define this field plugin will automatically
   */
  completedFieldName?: string;

  /**
   * Optionally translation plugin supports LLM completion adapter (like OpenAI) for generating translations
   * semiautomatically (creates a bulk action for generating translations)
   */
  completeAdapter?: CompletionAdapter

  /**
   * Optionally translation plugin available to translate only external applications (like SEO-facing or user-facing services),
   *  not AdminForth applications
   */
  externalAppOnly?: boolean;


  /**
   * You can enable "Reviewed" checkbox for each translation string by defing this field,
   * it should be a JSON field (underlyng database type should be TEXT or JSON)
   */
  reviewedCheckboxesFieldName?: string;

  /**
   * Primary language for the application. This is the default language shown to users.
   * English is always used as the source language for translations, even if primaryLanguage is different.
   * When a translation is missing for the primaryLanguage, English will be shown as fallback.
   * Defaults to 'en' if not specified.
   */
  primaryLanguage?: SupportedLanguage;

  /**
    *  Ask translator to treat some code from supportedLanguages as exact BCP47 tag. Read docs for details.
    *  key - one of the values form supportedLanguages, value -BCP47 tag
    */
  translateLangAsBCP47Code?: Partial<Record<LanguageCode, Bcp47LanguageTag>>;

  /**
   *  Batch size of one translation generation request. 
   *  This is an optional parameter that can be used to control the size of strings sent in a single request to the completion adapter.
   *  Default value is 30000 tokens
   */
  inputTokensPerBatch?: number;

  /**
   *  Limit of parallel translation generation requests. 
   *  This is an optional parameter that can be used to control the number of concurrent requests sent to the completion adapter.
   *  Default value is 20
   */
  parallelTranslationLimit?: number;
}
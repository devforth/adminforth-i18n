import { CompletionAdapter, EmailAdapter } from 'adminforth';
import type { LanguageCode } from 'iso-639-1';
import { iso31661Alpha2ToAlpha3 } from 'iso-3166';


// BCP-47 support for types only: primary subtag is ISO 639-1, optional region
type Alpha2Code = keyof typeof iso31661Alpha2ToAlpha3;
type Bcp47LanguageTag = `${LanguageCode}-${Alpha2Code}`;
export type SupportedLanguage = LanguageCode | Bcp47LanguageTag;

export interface PluginOptions {

  /* List of ISO 639-1 language codes which you want to tsupport*/
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
}
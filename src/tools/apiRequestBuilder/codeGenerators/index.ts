import type { ApiRequest } from '../types';
import { generateCurlCommand } from '../curlGenerator';
import { generateFetchCode } from './fetch';
import { generateAxiosCode } from './axios';
import { generateNodeCode } from './node';
import { generatePythonCode } from './python';

export { generateFetchCode } from './fetch';
export { generateAxiosCode } from './axios';
export { generateNodeCode } from './node';
export { generatePythonCode } from './python';
export { buildGeneratorInput } from './generatorInput';
export type { GeneratorInput, GeneratorBody, GeneratorFormField } from './generatorInput';

export const CODE_LANGUAGES = ['curl', 'fetch', 'axios', 'node', 'python'] as const;
export type CodeLanguage = (typeof CODE_LANGUAGES)[number];

export const CODE_LANGUAGE_LABELS: Record<CodeLanguage, string> = {
  curl: 'cURL',
  fetch: 'JavaScript (Fetch)',
  axios: 'Axios',
  node: 'Node.js',
  python: 'Python (Requests)',
};

type Generator = (request: ApiRequest, variables?: Record<string, string>) => string;

const GENERATORS: Record<CodeLanguage, Generator> = {
  curl: generateCurlCommand,
  fetch: generateFetchCode,
  axios: generateAxiosCode,
  node: generateNodeCode,
  python: generatePythonCode,
};

/** Single dispatch point the UI calls — so a new tab is one switch case away from working rather
 *  than every call site needing to know which module exports which generator. */
export const generateCode = (
  language: CodeLanguage,
  request: ApiRequest,
  variables: Record<string, string> = {},
): string => GENERATORS[language](request, variables);

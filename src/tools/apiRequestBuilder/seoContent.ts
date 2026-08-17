// Static page copy for the API Request Builder's SEO/content layer — kept as
// plain data (no React) so it's usable by both the page component and plain
// unit tests, and so the FAQPage JSON-LD can be built from the exact same
// list the page renders (see ApiRequestBuilderPage.tsx), never a second copy
// that could drift out of sync.

export interface FaqItem {
  question: string;
  answer: string;
}

export const API_REQUEST_BUILDER_FAQ: FaqItem[] = [
  {
    question: 'What is an API Request Builder?',
    answer:
      'A browser-based tool for constructing, sending, and inspecting HTTP requests to REST APIs — methods, headers, query parameters, request bodies, and authentication — without installing a desktop app.',
  },
  {
    question: 'Can I test REST APIs in my browser?',
    answer:
      'Yes, for any API that allows cross-origin requests from a browser (it sends the right CORS headers). Requests go out with the standard fetch() API, the same way any frontend application would call the same endpoint.',
  },
  {
    question: 'Does the API Request Builder require a backend?',
    answer:
      "No — request state (params, headers, body, auth) lives in your browser, and requests are sent directly with fetch(). The exception is the CORS proxy: if a direct request is blocked and the automatic fallback kicks in, or you configure a custom proxy, that request is routed through a server you don't control (or one you choose).",
  },
  {
    question: 'Why does CORS block some APIs?',
    answer:
      "CORS is a browser security rule, not something this tool controls. The target API's server has to explicitly allow your origin via an Access-Control-Allow-Origin header — if it doesn't, the browser blocks the response no matter what sent the request.",
  },
  {
    question: 'Can I send authenticated requests?',
    answer: 'Yes — Bearer tokens, Basic auth (username/password), and API keys (as a header or query parameter) are all supported from the Auth tab.',
  },
  {
    question: 'Can I use environment variables?',
    answer:
      'Yes — define variables like {{baseUrl}} or {{token}} in an environment, then reference them anywhere in the URL, params, headers, or body. Switch environments (e.g. staging vs. production) without editing the request itself.',
  },
  {
    question: 'Can I import Postman collections?',
    answer: 'Yes — import a Postman Collection (v2.1) to bring in its requests, folders, and any collection or environment variables as a new collection here.',
  },
  {
    question: 'Can I import OpenAPI files?',
    answer: 'Yes — import an OpenAPI 3.0 or 3.1 document (JSON or YAML) and each operation is converted into a saved request, organized by tag into folders.',
  },
  {
    question: 'Can I generate cURL or code from a request?',
    answer:
      'Yes — any request can be copied as a cURL command, or generated as JavaScript (Fetch), Axios, Node.js, or Python (Requests) code, so you can test a call here first and paste the working version into your codebase.',
  },
  {
    question: 'Are my API credentials uploaded to a server?',
    answer:
      "Saved requests, history, environments, and collections are stored in your browser's local storage only. Direct requests — the default, whenever the target API allows it — go straight from your browser to the target API. If a request routes through the CORS proxy fallback or a custom proxy, that request (including any headers or tokens in it) does pass through that proxy server, since that's how a proxy works.",
  },
];

/** Guide slugs referenced from the page — kept here (not duplicated) so a
 *  test can verify each one still resolves via getGuideBySlug(). */
export const API_REQUEST_BUILDER_GUIDE_SLUGS = [
  'how-to-test-an-api',
  'what-is-a-cors-error',
  'json-post-request-example',
  'authentication-testing-examples',
  'form-data-file-upload-example',
  'curl-to-fetch-axios-python',
  'import-postman-collection-without-postman',
] as const;

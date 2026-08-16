import { createBlankRequest, nextId, type ApiRequest } from './types';

export interface ExampleRequest {
  name: string;
  description: string;
  request: ApiRequest;
}

// Public APIs that allow browser CORS requests — used only to seed the empty
// state so the interface isn't blank on first launch. The tool itself has no
// dependency on any of these; it works with whatever URL a user enters.
// Each starts from createBlankRequest() so example requests pick up the same
// defaults (30s timeout, same-origin credentials) as a freshly-typed one.
export const EXAMPLE_REQUESTS: ExampleRequest[] = [
  {
    name: 'Get a post (JSONPlaceholder)',
    description: 'Simple GET request returning a JSON object.',
    request: {
      ...createBlankRequest(),
      method: 'GET',
      url: 'https://jsonplaceholder.typicode.com/posts/1',
    },
  },
  {
    name: 'Create a post (JSONPlaceholder)',
    description: 'POST with a JSON body — good example for testing the body editor.',
    request: {
      ...createBlankRequest(),
      method: 'POST',
      url: 'https://jsonplaceholder.typicode.com/posts',
      body: {
        mode: 'json',
        raw: JSON.stringify({ title: 'Hello world', body: 'Sent from the API Request Builder', userId: 1 }, null, 2),
        formFields: [],
      },
    },
  },
  {
    name: 'Inspect request echo (httpbin)',
    description: 'httpbin echoes back exactly what it received — useful for verifying headers and params.',
    request: {
      ...createBlankRequest(),
      method: 'GET',
      url: 'https://httpbin.org/get',
      params: [{ id: nextId(), key: 'source', value: '101-api-request-builder', enabled: true }],
    },
  },
  {
    name: 'Trigger a 404 (httpbin)',
    description: 'Returns a 404 on purpose — a quick way to see how the response viewer handles error statuses.',
    request: {
      ...createBlankRequest(),
      method: 'GET',
      url: 'https://httpbin.org/status/404',
    },
  },
];

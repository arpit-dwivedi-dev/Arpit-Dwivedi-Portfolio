import { createEmptyAuth, nextId, type ApiRequest } from './types';

export interface ExampleRequest {
  name: string;
  description: string;
  request: ApiRequest;
}

// Public APIs that allow browser CORS requests — used only to seed the empty
// state so the interface isn't blank on first launch. The tool itself has no
// dependency on any of these; it works with whatever URL a user enters.
export const EXAMPLE_REQUESTS: ExampleRequest[] = [
  {
    name: 'Get a post (JSONPlaceholder)',
    description: 'Simple GET request returning a JSON object.',
    request: {
      id: nextId(),
      method: 'GET',
      url: 'https://jsonplaceholder.typicode.com/posts/1',
      params: [],
      headers: [],
      body: { mode: 'none', raw: '', formFields: [] },
      auth: createEmptyAuth(),
    },
  },
  {
    name: 'Create a post (JSONPlaceholder)',
    description: 'POST with a JSON body — good example for testing the body editor.',
    request: {
      id: nextId(),
      method: 'POST',
      url: 'https://jsonplaceholder.typicode.com/posts',
      params: [],
      headers: [],
      body: {
        mode: 'json',
        raw: JSON.stringify({ title: 'Hello world', body: 'Sent from the API Request Builder', userId: 1 }, null, 2),
        formFields: [],
      },
      auth: createEmptyAuth(),
    },
  },
  {
    name: 'Inspect request echo (httpbin)',
    description: 'httpbin echoes back exactly what it received — useful for verifying headers and params.',
    request: {
      id: nextId(),
      method: 'GET',
      url: 'https://httpbin.org/get',
      params: [{ id: nextId(), key: 'source', value: '101-api-request-builder', enabled: true }],
      headers: [],
      body: { mode: 'none', raw: '', formFields: [] },
      auth: createEmptyAuth(),
    },
  },
  {
    name: 'Trigger a 404 (httpbin)',
    description: 'Returns a 404 on purpose — a quick way to see how the response viewer handles error statuses.',
    request: {
      id: nextId(),
      method: 'GET',
      url: 'https://httpbin.org/status/404',
      params: [],
      headers: [],
      body: { mode: 'none', raw: '', formFields: [] },
      auth: createEmptyAuth(),
    },
  },
];

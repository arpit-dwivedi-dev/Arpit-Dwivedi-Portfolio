// Defaults match the real project/dataset created via `npm create sanity` —
// safe to hardcode, these aren't secrets (Sanity's read API is public by
// project design; write access still requires a token, which this client never has).
const projectId = (import.meta.env.VITE_SANITY_PROJECT_ID as string | undefined) || '7zvbreg2';
const dataset = (import.meta.env.VITE_SANITY_DATASET as string | undefined) || 'production';

// @sanity/client is dynamically imported (see fetchSiteContent.ts) so its chunk
// is only fetched after first paint, not blocking initial render.
export const getSanityClient = async () => {
  const { createClient } = await import('@sanity/client');
  return createClient({
    projectId,
    dataset,
    apiVersion: '2024-01-01',
    useCdn: true,
  });
};

import { getStore } from '@netlify/blobs';
import { createHandler } from '../../lib/files-handler.mjs';

const handler = createHandler({
  getStore: () => getStore({ name: 'html-history', consistency: 'strong' }),
  getPassword: () => Netlify.env.get('APP_PASSWORD'),
});

export default async (req, context) => handler(req, context.params?.id);

export const config = { path: ['/api/files', '/api/files/:id'] };

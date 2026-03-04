import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';
import type { AppEnv } from '../env';

export default fp(async (app, opts: { env: AppEnv }) => {
  const secret = String(process.env.JWT_SECRET || opts.env.JWT_SECRET || '').trim();

  // debug once so we see what's happening
  app.log.info({ hasProcessEnv: !!process.env.JWT_SECRET, hasOptsEnv: !!opts.env.JWT_SECRET }, 'jwt env presence');

  if (!secret) {
    throw new Error('JWT_SECRET is missing. Load env with: set -a; source ./.env; set +a');
  }

  await app.register(jwt, { secret });
});

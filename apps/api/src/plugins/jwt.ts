import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';
import type { AppEnv } from '../env';

export default fp(async (app, opts: { env: AppEnv }) => {
  await app.register(jwt, { secret: opts.env.JWT_SECRET });
});

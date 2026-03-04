import fp from 'fastify-plugin';
// Import directly from source so tsx can compile it (Phase A no-build workflow)
import { prisma } from '../../../../packages/db/src/client';

export default fp(async (app) => {
  app.decorate('prisma', prisma);

  app.addHook('onClose', async () => {
    try {
      await prisma.$disconnect();
    } catch {
      // ignore
    }
  });
});

declare module 'fastify' {
  interface FastifyInstance {
    prisma: typeof prisma;
  }
}

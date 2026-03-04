import { z } from 'zod';
import type { FastifyInstance } from 'fastify';

const LoginSchema = z.object({
  walletAddress: z.string().min(10).max(80)
});

export async function authRoutes(app: FastifyInstance) {
  app.post('/v1/auth/login', async (req, reply) => {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ ok: false, error: 'BAD_REQUEST', details: parsed.error.flatten() });
    }

    const wallet = parsed.data.walletAddress.toLowerCase();

    const user = await app.prisma.user.upsert({
      where: { walletAddress: wallet },
      update: {},
      create: { walletAddress: wallet }
    });

    const token = await reply.jwtSign({ sub: user.id, wallet });

    return reply.send({ ok: true, token, user: { id: user.id, walletAddress: user.walletAddress } });
  });

  app.get('/v1/auth/me', { preHandler: [authGuard(app)] }, async (req: any, reply) => {
    const userId = req.user.sub as string;

    const user = await app.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, walletAddress: true, displayName: true, disciplineScore: true }
    });

    return reply.send({ ok: true, user });
  });
}

function authGuard(app: FastifyInstance) {
  return async function (req: any, reply: any) {
    try {
      await req.jwtVerify();
    } catch {
      return reply.code(401).send({ ok: false, error: 'UNAUTHORIZED' });
    }
  };
}

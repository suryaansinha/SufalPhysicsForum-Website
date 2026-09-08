import fs from 'fs';

const g = globalThis as unknown as { __prismaEnvInitialized?: boolean };

process.env.PRISMA_HOME = process.env.PRISMA_HOME || '/tmp/prisma-home';
process.env.XDG_CACHE_HOME = process.env.XDG_CACHE_HOME || '/tmp/prisma-cache';

if (!g.__prismaEnvInitialized) {
  g.__prismaEnvInitialized = true;

  for (const dir of [process.env.PRISMA_HOME, process.env.XDG_CACHE_HOME]) {
    if (!dir) continue;
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch (error) {
      console.error('Failed to create Prisma cache directory', dir, error);
    }
  }

  console.log('Prisma runtime env', {
    PRISMA_HOME: process.env.PRISMA_HOME,
    XDG_CACHE_HOME: process.env.XDG_CACHE_HOME,
  });
}

import { existsSync, readFileSync } from 'node:fs';
import { resolve, basename } from 'node:path';
import { pathToFileURL } from 'node:url';
import { tsImport } from 'tsx/esm/api';
import { PayloadPostConfigSchema, type PayloadPostConfigOutput } from './schema.js';

const candidateFiles = [
  'payload-post.config.ts',
  'payload-post.config.mts',
  'payload-post.config.js',
  'payload-post.config.mjs',
  'payload-post.config.cjs',
  'payload-post.config.json',
];

export interface LoadConfigOptions {
  cwd?: string;
  configPath?: string | undefined;
}

async function loadConfigModule(filePath: string): Promise<unknown> {
  if (basename(filePath).endsWith('.json')) {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  }

  const fileUrl = pathToFileURL(filePath).href;
  const mod = await tsImport(fileUrl, import.meta.url);
  return mod?.default ?? mod;
}

export async function findConfigPath(cwd = process.cwd(), overridePath?: string): Promise<string> {
  if (overridePath) {
    const absolute = resolve(cwd, overridePath);
    if (!existsSync(absolute)) {
      throw new Error(`Config file not found: ${overridePath}`);
    }
    return absolute;
  }

  for (const candidate of candidateFiles) {
    const absolute = resolve(cwd, candidate);
    if (existsSync(absolute)) {
      return absolute;
    }
  }

  throw new Error(
    `No payload-post config found. Looked for: ${candidateFiles.join(', ')}`,
  );
}

export async function loadConfig(
  options: LoadConfigOptions = {},
): Promise<PayloadPostConfigOutput> {
  const cwd = options.cwd ?? process.cwd();
  const configPath = await findConfigPath(cwd, options.configPath);
  const rawConfig = await loadConfigModule(configPath);
  return PayloadPostConfigSchema.parse(rawConfig);
}

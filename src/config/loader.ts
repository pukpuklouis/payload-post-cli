import { existsSync, readFileSync } from 'node:fs';
import { resolve, basename } from 'node:path';
import { pathToFileURL } from 'node:url';
import { tsImport } from 'tsx/esm/api';
import {
  PayloadPostConfigFileSchema,
  PayloadPostConfigSchema,
  type PayloadPostConfigFileOutput,
  type PayloadPostConfigOutput,
} from './schema.js';
import { getGlobalConfigPath } from './init.js';

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
  profile?: string | undefined;
}

async function loadConfigModule(filePath: string): Promise<unknown> {
  if (basename(filePath).endsWith('.json')) {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  }

  const fileUrl = pathToFileURL(filePath).href;
  const mod = await tsImport(fileUrl, import.meta.url);
  return mod?.default ?? mod;
}

function resolveProfileConfig(
  rawConfig: PayloadPostConfigFileOutput,
  profile?: string,
): PayloadPostConfigOutput {
  if (!('profiles' in rawConfig)) {
    return PayloadPostConfigSchema.parse(rawConfig);
  }

  const profileNames = Object.keys(rawConfig.profiles);
  const selectedProfile =
    profile ?? rawConfig.defaultProfile ?? (profileNames.length === 1 ? profileNames[0] : undefined);

  if (!selectedProfile) {
    throw new Error(
      `Multiple config profiles found. Pass --profile <name> or set defaultProfile. Available profiles: ${profileNames.join(', ')}`,
    );
  }

  const config = rawConfig.profiles[selectedProfile];
  if (!config) {
    throw new Error(
      `Config profile not found: ${selectedProfile}. Available profiles: ${profileNames.join(', ')}`,
    );
  }

  return PayloadPostConfigSchema.parse(config);
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

  const globalPath = getGlobalConfigPath();
  if (existsSync(globalPath)) {
    return globalPath;
  }

  throw new Error(
    `No payload-post config found. Looked in current directory for: ${candidateFiles.join(', ')}, and at global path: ${globalPath}`,
  );
}

export async function loadConfig(
  options: LoadConfigOptions = {},
): Promise<PayloadPostConfigOutput> {
  const cwd = options.cwd ?? process.cwd();
  const configPath = await findConfigPath(cwd, options.configPath);
  const rawConfig = await loadConfigModule(configPath);
  const parsed = PayloadPostConfigFileSchema.parse(rawConfig);
  return resolveProfileConfig(parsed, options.profile);
}

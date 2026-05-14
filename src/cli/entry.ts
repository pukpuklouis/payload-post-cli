#!/usr/bin/env node

import { Command } from 'commander';
import { formatJson } from '../formatters/json.js';
import { formatPostsTable } from '../formatters/table.js';
import { loadConfig } from '../config/loader.js';
import { initConfigFile } from '../config/init.js';
import { createPost } from '../actions/createPost.js';
import { deletePost } from '../actions/deletePost.js';
import { listPosts } from '../actions/listPosts.js';
import { publishPost } from '../actions/publishPost.js';
import { updatePost } from '../actions/updatePost.js';
import type { PostRecord } from '../types/index.js';
import { render } from 'ink';
import { TuiApp, renderDashboard, createInitialTuiState } from '../tui/index.js';
import React from 'react';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const program = new Command();

async function resolveConfigPath(command: Command): Promise<string | undefined> {
  const root = command.optsWithGlobals() as { config?: string };
  return root.config;
}

async function loadRuntimeConfig(command: Command) {
  const configPath = await resolveConfigPath(command);
  const root = command.optsWithGlobals() as { config?: string; profile?: string };
  const config = await loadConfig(
    configPath ? { configPath, profile: root.profile } : { profile: root.profile },
  );
  return config;
}

function runtimeFlags(command: Command): {
  verbose?: boolean | undefined;
  json?: boolean | undefined;
} {
  const flags = command.optsWithGlobals() as { verbose?: boolean; json?: boolean };
  return {
    verbose: flags.verbose,
    json: flags.json,
  };
}

const sampleTuiPosts = [
  {
    id: '1',
    title: 'Welcome post',
    slug: 'welcome-post',
    status: 'published',
    updatedAt: '2026-05-12T00:00:00.000Z',
  },
  {
    id: '2',
    title: 'Draft note',
    slug: 'draft-note',
    status: 'draft',
    updatedAt: '2026-05-11T12:00:00.000Z',
  },
];

async function confirm(message: string): Promise<boolean> {
  if (!input.isTTY) {
    throw new Error('Confirmation required but stdin is not interactive. Re-run with --yes.');
  }

  const rl = readline.createInterface({ input, output });
  try {
    const answer = await rl.question(`${message} [y/N] `);
    return /^y(es)?$/i.test(answer.trim());
  } finally {
    rl.close();
  }
}

function printOutput(
  value: unknown,
  json = false,
  columns?: Parameters<typeof formatPostsTable>[1],
): void {
  if (json) {
    process.stdout.write(`${formatJson(value)}\n`);
    return;
  }

  if (Array.isArray(value)) {
    process.stdout.write(`${formatPostsTable(value, columns)}\n`);
    return;
  }

  if (value && typeof value === 'object' && 'docs' in value && Array.isArray((value as { docs: unknown[] }).docs)) {
    process.stdout.write(
      `${formatPostsTable((value as { docs: unknown[] }).docs as PostRecord[], columns)}\n`,
    );
    return;
  }

  if (value && typeof value === 'object') {
    process.stdout.write(`${formatJson(value)}\n`);
    return;
  }

  process.stdout.write(`${String(value)}\n`);
}

program
  .name('payload-post')
  .description('Terminal-native CLI for managing Payload CMS posts')
  .version('0.2.0')
  .option('-c, --config <path>', 'config file path')
  .option('-p, --profile <name>', 'config profile name for multi-site setups')
  .option('--verbose', 'show HTTP request details')
  .option('--json', 'output raw JSON');

program
  .command('list')
  .description('List posts')
  .option('--status <status>', 'filter by status')
  .option('--search <query>', 'search across post fields')
  .option('--page <page>', 'page number', (value) => Number(value), 1)
  .option('--limit <limit>', 'page size', (value) => Number(value), undefined)
  .option('--sort <sort>', 'sort expression')
  .action(async function listAction(options) {
    const config = await loadRuntimeConfig(this.parent as Command);
    const flags = runtimeFlags(this.parent as Command);
    const result = await listPosts(config, options, flags);
    printOutput(result, flags.json, config.list?.columns);
  });

program
  .command('create')
  .description('Create a post')
  .option('--title <title>', 'post title')
  .option('--slug <slug>', 'post slug')
  .option('--status <status>', 'post status')
  .option('--excerpt <excerpt>', 'post excerpt')
  .option('--content <content>', 'post content')
  .option('--author <author>', 'post author')
  .action(async function createAction(options) {
    const config = await loadRuntimeConfig(this.parent as Command);
    const flags = runtimeFlags(this.parent as Command);
    const result = await createPost(config, options, flags);
    printOutput(result, flags.json);
  });

program
  .command('update <id>')
  .description('Update a post by ID')
  .option('--title <title>', 'post title')
  .option('--slug <slug>', 'post slug')
  .option('--status <status>', 'post status')
  .option('--excerpt <excerpt>', 'post excerpt')
  .option('--content <content>', 'post content')
  .option('--author <author>', 'post author')
  .action(async function updateAction(id: string, options) {
    const config = await loadRuntimeConfig(this.parent as Command);
    const flags = runtimeFlags(this.parent as Command);
    const result = await updatePost(config, id, options, flags);
    printOutput(result, flags.json);
  });

program
  .command('delete <id>')
  .description('Delete a post by ID')
  .option('--yes', 'skip confirmation prompt')
  .action(async function deleteAction(id: string, options) {
    const config = await loadRuntimeConfig(this.parent as Command);
    const flags = runtimeFlags(this.parent as Command);
    if (!options.yes && !(await confirm(`Delete post ${id}?`))) {
      process.stdout.write('Aborted.\n');
      return;
    }
    const result = await deletePost(config, id, flags);
    printOutput(result, flags.json);
  });

program
  .command('publish <id>')
  .description('Publish or unpublish a post')
  .option('--unpublish', 'revert a published post back to draft')
  .action(async function publishAction(id: string, options) {
    const config = await loadRuntimeConfig(this.parent as Command);
    const flags = runtimeFlags(this.parent as Command);
    const result = await publishPost(config, id, { ...options, ...flags });
    printOutput(result, flags.json);
  });

const configCommand = program.command('config').description('Configuration helpers');
configCommand
  .command('init')
  .description('Create a default payload-post.config.ts file')
  .option('--out <dir>', 'output directory (defaults to ~/.config/payload-post)')
  .action(async function initAction(options) {
    const path = initConfigFile(options.out);
    process.stdout.write(`Created ${path}\n`);
  });

program
  .command('tui')
  .description('Open the Ink-based dashboard preview')
  .option('--once', 'render a single static frame and exit')
  .action(async function tuiAction(options) {
    let posts = sampleTuiPosts;
    try {
      const config = await loadRuntimeConfig(this.parent as Command);
      const result = await listPosts(config, {}, runtimeFlags(this.parent as Command));
      posts = result.docs
        .map((doc, index) => ({
          id: String(doc.id ?? index + 1),
          title: String(doc.title ?? '(untitled)'),
          slug: String(doc.slug ?? ''),
          status: String(doc.status ?? 'draft'),
          updatedAt: String(doc.updatedAt ?? ''),
        }))
        .filter((post) => post.title.length > 0);
      if (posts.length === 0) posts = sampleTuiPosts;
    } catch {
      posts = sampleTuiPosts;
    }

    if (options.once || !process.stdout.isTTY) {
      process.stdout.write(`${renderDashboard(createInitialTuiState(), posts)}\n`);
      return;
    }

    const app = render(React.createElement(TuiApp, {posts}));
    await app.waitUntilExit();
  });

if (process.argv.length <= 2) {
  program.outputHelp();
} else {
  program.exitOverride();

  try {
    await program.parseAsync(process.argv);
  } catch (error) {
    if (error instanceof Error) {
      if ((error as { code?: string }).code === 'commander.helpDisplayed') {
        process.exitCode = 0;
      } else {
        process.stderr.write(`${error.message}\n`);
        process.exitCode = 1;
      }
    } else {
      throw error;
    }
  }
}

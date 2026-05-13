import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialTuiState, reduceTuiState, renderDashboard } from '../../src/tui/index.js';

const posts = [
  { id: '1', title: 'Alpha', slug: 'alpha', status: 'published', updatedAt: '2026-05-12' },
  { id: '2', title: 'Beta', slug: 'beta', status: 'draft', updatedAt: '2026-05-11' },
];

test('renderDashboard produces a 3-pane layout', () => {
  const output = renderDashboard(createInitialTuiState(), posts);
  const firstLine = output.split('\n')[0] ?? '';
  assert.match(firstLine, /Filters/);
  assert.match(firstLine, /Posts/);
  assert.match(firstLine, /Details/);
  assert.match(output, /j\/k navigate/);
});

test('shortcut actions update TUI state', () => {
  let state = createInitialTuiState();
  state = reduceTuiState(state, { type: 'move', delta: 1 });
  assert.equal(state.selectedIndex, 1);

  state = reduceTuiState(state, { type: 'open', screen: 'create' });
  assert.equal(state.screen, 'create');

  state = reduceTuiState(state, { type: 'open', screen: 'edit' });
  assert.equal(state.screen, 'edit');

  state = reduceTuiState(state, { type: 'search', value: 'hello' });
  assert.equal(state.search, 'hello');

  state = reduceTuiState(state, { type: 'message', value: 'Delete requested' });
  assert.equal(state.message, 'Delete requested');

  state = reduceTuiState(state, { type: 'message', value: 'Publish requested' });
  assert.equal(state.message, 'Publish requested');

  state = reduceTuiState(state, { type: 'back' });
  assert.equal(state.screen, 'list');
});

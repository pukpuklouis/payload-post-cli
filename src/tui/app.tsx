import React, {useMemo, useState} from 'react';
import {Box, Text, useInput, useApp} from 'ink';
import {createInitialTuiState, reduceTuiState} from './state.js';
import {renderDashboard} from './render.js';
import type {TuiPost} from './types.js';

export interface TuiAppProps {
  posts: TuiPost[];
  once?: boolean | undefined;
  onRender?: (frame: string) => void;
}

export function TuiApp({posts, once = false, onRender}: TuiAppProps) {
  const {exit} = useApp();
  const [state, setState] = useState(createInitialTuiState());
  const frame = useMemo(() => renderDashboard(state, posts), [posts, state]);

  if (onRender) {
    onRender(frame);
  }

  useInput((input, key) => {
    if (input === 'q' || key.escape) {
      exit();
      return;
    }

    if (key.upArrow || input === 'k') {
      setState((current) => reduceTuiState(current, {type: 'move', delta: -1}));
      return;
    }

    if (key.downArrow || input === 'j') {
      setState((current) => reduceTuiState(current, {type: 'move', delta: 1}));
      return;
    }

    if (input === '/') {
      setState((current) => reduceTuiState(current, {type: 'search', value: current.search ? '' : 'search'}));
      return;
    }

    if (input === 'c') {
      setState((current) => reduceTuiState(current, {type: 'open', screen: 'create'}));
      return;
    }

    if (input === 'e') {
      setState((current) => reduceTuiState(current, {type: 'open', screen: 'edit'}));
      return;
    }

    if (input === 'd') {
      setState((current) => reduceTuiState(current, {type: 'message', value: 'Delete requested'}));
      return;
    }

    if (input === 'p') {
      setState((current) => reduceTuiState(current, {type: 'message', value: 'Publish requested'}));
    }
  });

  if (once) {
    return (
      <Box flexDirection="column">
        <Text>{frame}</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text color="green">payload-post TUI</Text>
      <Text>{frame}</Text>
      <Text color="gray">Press q to quit</Text>
    </Box>
  );
}


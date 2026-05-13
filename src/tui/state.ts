import type { TuiState } from './types.js';

export type TuiAction =
  | { type: 'move'; delta: number }
  | { type: 'open'; screen: 'detail' | 'create' | 'edit' }
  | { type: 'search'; value: string }
  | { type: 'back' }
  | { type: 'message'; value: string };

export function createInitialTuiState(): TuiState {
  return {
    screen: 'list',
    selectedIndex: 0,
    search: '',
    message: 'j/k navigate • / search • c create • e edit • d delete • p publish',
  };
}

export function reduceTuiState(state: TuiState, action: TuiAction): TuiState {
  switch (action.type) {
    case 'move':
      return {
        ...state,
        selectedIndex: Math.max(0, state.selectedIndex + action.delta),
        screen: 'list',
      };
    case 'open':
      return {
        ...state,
        screen: action.screen,
        message:
          action.screen === 'create'
            ? 'Create flow opened'
            : action.screen === 'edit'
              ? 'Edit flow opened'
              : 'Detail pane opened',
      };
    case 'search':
      return {
        ...state,
        screen: 'list',
        search: action.value,
      };
    case 'back':
      return {
        ...state,
        screen: 'list',
        message: 'Returned to list',
      };
    case 'message':
      return {
        ...state,
        message: action.value,
      };
  }
}


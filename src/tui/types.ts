export type TuiScreen = 'list' | 'detail' | 'create' | 'edit';

export interface TuiPost {
  id: string;
  title: string;
  slug: string;
  status: string;
  updatedAt: string;
}

export interface TuiState {
  screen: TuiScreen;
  selectedIndex: number;
  search: string;
  message: string;
}


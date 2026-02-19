export type CardStatus = 'TODO' | 'DOING' | 'DONE';

export interface Card {
  id: string;
  title: string;
  description: string | null;
  status: CardStatus;
  order: number;
  updatedAt: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  username: string;
}

export const COLUMNS: { status: CardStatus; label: string }[] = [
  { status: 'TODO', label: 'Todo' },
  { status: 'DOING', label: 'Doing' },
  { status: 'DONE', label: 'Done' },
];

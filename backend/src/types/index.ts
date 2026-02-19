export type CardStatus = 'TODO' | 'DOING' | 'DONE';

export interface CreateCardBody {
  title: string;
  description?: string;
  status: CardStatus;
}

export interface UpdateCardBody {
  title?: string;
  description?: string;
}

export interface MoveCardBody {
  status: CardStatus;
  order: number;
}

import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { Card, CardStatus } from '@/types';
import { api } from '@/lib/api';

interface CardState {
  cards: Card[];
  loading: boolean;

  // API actions
  fetchCards: () => Promise<void>;
  createCard: (title: string, description: string, status: CardStatus) => Promise<void>;
  updateCard: (id: string, title: string, description: string) => Promise<void>;
  moveCard: (cardId: string, destStatus: CardStatus, destIndex: number) => Promise<void>;

  // Socket handlers
  onCardCreated: (card: Card) => void;
  onCardUpdated: (card: Card) => void;
  onCardsMoved: (cards: Card[]) => void;

  // Local helpers
  getColumnCards: (status: CardStatus) => Card[];
}

export const useCardStore = create<CardState>((set, get) => ({
  cards: [],
  loading: false,

  fetchCards: async () => {
    set({ loading: true });
    const cards = await api.getCards();
    set({ cards, loading: false });
  },

  createCard: async (title, description, status) => {
    await api.createCard({ title, description, status });
    // Socket event will add the card to the store
  },

  updateCard: async (id, title, description) => {
    await api.updateCard(id, { title, description });
    // Socket event will update the card in the store
  },

  moveCard: async (cardId, destStatus, destIndex) => {
    // Optimistic local reorder
    const cards = get().cards.map((c) => ({ ...c }));
    const card = cards.find((c) => c.id === cardId);
    if (!card) return;

    const srcStatus = card.status;

    // Group by column
    const columns: Record<CardStatus, Card[]> = { TODO: [], DOING: [], DONE: [] };
    cards.forEach((c) => columns[c.status].push(c));
    Object.values(columns).forEach((col) => col.sort((a, b) => a.order - b.order));

    // Remove card from source column
    const srcCol = columns[srcStatus];
    srcCol.splice(srcCol.findIndex((c) => c.id === cardId), 1);

    // Insert into destination column
    card.status = destStatus;
    columns[destStatus].splice(destIndex, 0, card);

    // Reassign sequential orders
    const result: Card[] = [];
    for (const col of Object.values(columns)) {
      col.forEach((c, i) => {
        result.push({ ...c, order: i });
      });
    }

    set({ cards: result });

    // Persist to backend — socket broadcast will confirm
    await api.moveCard(cardId, { status: destStatus, order: destIndex });
  },

  onCardCreated: (card) => {
    set((state) => {
      if (state.cards.some((c) => c.id === card.id)) return state;
      return { cards: [...state.cards, card] };
    });
  },

  onCardUpdated: (card) => {
    set((state) => ({
      cards: state.cards.map((c) => (c.id === card.id ? card : c)),
    }));
  },

  onCardsMoved: (cards) => {
    set({ cards });
  },

  getColumnCards: (status) => {
    return get()
      .cards.filter((c) => c.status === status)
      .sort((a, b) => a.order - b.order);
  },
}));

export const useBoardCardStore = () =>
  useCardStore(
    useShallow((s) => ({
      fetchCards: s.fetchCards,
      moveCard: s.moveCard,
      onCardCreated: s.onCardCreated,
      onCardUpdated: s.onCardUpdated,
      onCardsMoved: s.onCardsMoved,
      loading: s.loading,
    }))
  );

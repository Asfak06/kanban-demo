'use client';

import { useMemo } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { useCardStore } from '@/stores/useCardStore';
import { Card, CardStatus } from '@/types';
import CardItem from './Card';

interface ColumnProps {
  status: CardStatus;
  label: string;
  onAddCard: () => void;
  onEditCard: (card: Card) => void;
}

const COLUMN_COLORS: Record<CardStatus, string> = {
  TODO: 'border-blue-400',
  DOING: 'border-yellow-400',
  DONE: 'border-green-400',
};

const BADGE_COLORS: Record<CardStatus, string> = {
  TODO: 'bg-blue-100 text-blue-700',
  DOING: 'bg-yellow-100 text-yellow-700',
  DONE: 'bg-green-100 text-green-700',
};

export default function Column({ status, label, onAddCard, onEditCard }: ColumnProps) {
  const allCards = useCardStore((s) => s.cards);
  const cards = useMemo(
    () => allCards.filter((c) => c.status === status).sort((a, b) => a.order - b.order),
    [allCards, status]
  );

  return (
    <div className={`flex-1 min-w-[300px] bg-gray-50 rounded-xl border-t-4 ${COLUMN_COLORS[status]}`}>
      {/* Column Header */}
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-gray-700">{label}</h2>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${BADGE_COLORS[status]}`}>
            {cards.length}
          </span>
        </div>
        <button
          onClick={onAddCard}
          className="w-8 h-8 flex items-center justify-center rounded-md text-gray-600 hover:bg-gray-200 hover:text-gray-800 transition-colors text-xl font-bold"
          title="Add card"
        >
          +
        </button>
      </div>

      {/* Droppable Area */}
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`p-3 pt-1 min-h-[200px] transition-colors rounded-b-xl ${
              snapshot.isDraggingOver ? 'bg-gray-100' : ''
            }`}
          >
            {cards.map((card, index) => (
              <CardItem key={card.id} card={card} index={index} onEdit={() => onEditCard(card)} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}

'use client';

import { Draggable } from '@hello-pangea/dnd';
import { Card } from '@/types';

interface CardItemProps {
  card: Card;
  index: number;
  onEdit: () => void;
}

export default function CardItem({ card, index, onEdit }: CardItemProps) {
  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-white rounded-lg p-3 mb-2 shadow-sm border border-gray-200 cursor-grab active:cursor-grabbing transition-shadow ${
            snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-300' : 'hover:shadow-md'
          }`}
          onClick={onEdit}
        >
          <h3 className="font-medium text-sm text-gray-800">{card.title}</h3>
          {card.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{card.description}</p>
          )}
          <p className="text-[10px] text-gray-300 mt-2">
            {new Date(card.updatedAt).toLocaleString()}
          </p>
        </div>
      )}
    </Draggable>
  );
}

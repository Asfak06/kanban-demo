'use client';

import { useEffect, useState } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { useBoardCardStore } from '@/stores/useCardStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { connectSocket, disconnectSocket } from '@/lib/socket';
import { Card, CardStatus, COLUMNS } from '@/types';
import Column from './Column';
import CardModal from './CardModal';

export default function Board() {
  const { user, logout } = useAuthStore();
  const userId = user?.id;
  const userName = user?.name;
  const { fetchCards, moveCard, onCardCreated, onCardUpdated, onCardsMoved, loading } =
    useBoardCardStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [modalStatus, setModalStatus] = useState<CardStatus>('TODO');

  // Fetch cards and connect socket on mount
  useEffect(() => {
    if (!userId) return;

    fetchCards();

    const socket = connectSocket(userId);

    socket.on('card:created', onCardCreated);
    socket.on('card:updated', onCardUpdated);
    socket.on('card:moved', onCardsMoved);

    return () => {
      socket.off('card:created', onCardCreated);
      socket.off('card:updated', onCardUpdated);
      socket.off('card:moved', onCardsMoved);
      disconnectSocket();
    };
  }, [userId, fetchCards, onCardCreated, onCardUpdated, onCardsMoved]);

  function handleDragEnd(result: DropResult) {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    // Dropped in same position
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    const destStatus = destination.droppableId as CardStatus;
    const destIndex = destination.index;

    moveCard(draggableId, destStatus, destIndex);
  }

  function openCreateModal(status: CardStatus) {
    setEditingCard(null);
    setModalStatus(status);
    setModalOpen(true);
  }

  function openEditModal(card: Card) {
    setEditingCard(card);
    setModalStatus(card.status);
    setModalOpen(true);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500 text-lg">Loading board...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Kanban Board</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            Logged in as <span className="font-semibold text-gray-700">{userName}</span>
          </span>
          <button
            onClick={logout}
            className="px-3 py-1.5 text-sm bg-gray-200 hover:bg-gray-300 rounded transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-6 overflow-x-auto pb-4">
          {COLUMNS.map(({ status, label }) => (
            <Column
              key={status}
              status={status}
              label={label}
              onAddCard={() => openCreateModal(status)}
              onEditCard={openEditModal}
            />
          ))}
        </div>
      </DragDropContext>

      {/* Card Modal */}
      {modalOpen && (
        <CardModal
          card={editingCard}
          defaultStatus={modalStatus}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}

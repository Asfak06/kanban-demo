import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { getIO } from '../socket/socket';
import { CreateCardBody, UpdateCardBody, MoveCardBody } from '../types';

export const getCards = async (_req: Request, res: Response) => {
  const cards = await prisma.card.findMany({
    orderBy: [{ status: 'asc' }, { order: 'asc' }],
  });
  res.json(cards);
};

export const createCard = async (req: Request, res: Response) => {
  const { title, description, status } = req.body as CreateCardBody;

  // Get the next order value for the column
  const maxOrder = await prisma.card.aggregate({
    where: { status },
    _max: { order: true },
  });

  const card = await prisma.card.create({
    data: {
      title,
      description,
      status,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });

  getIO().emit('card:created', card);
  res.status(201).json(card);
};

export const updateCard = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, description } = req.body as UpdateCardBody;

  const card = await prisma.card.update({
    where: { id },
    data: { title, description },
  });

  getIO().emit('card:updated', card);
  res.json(card);
};

export const moveCard = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status: newStatus, order: newOrder } = req.body as MoveCardBody;

  await prisma.$transaction(async (tx) => {
    const card = await tx.card.findUniqueOrThrow({ where: { id } });
    const oldStatus = card.status;
    const oldOrder = card.order;

    if (oldStatus === newStatus) {
      // Same column reorder
      if (newOrder > oldOrder) {
        await tx.card.updateMany({
          where: { status: oldStatus, order: { gt: oldOrder, lte: newOrder } },
          data: { order: { decrement: 1 } },
        });
      } else if (newOrder < oldOrder) {
        await tx.card.updateMany({
          where: { status: oldStatus, order: { gte: newOrder, lt: oldOrder } },
          data: { order: { increment: 1 } },
        });
      }
    } else {
      // Cross-column move: remove from old, make space in new
      await tx.card.updateMany({
        where: { status: oldStatus, order: { gt: oldOrder } },
        data: { order: { decrement: 1 } },
      });
      await tx.card.updateMany({
        where: { status: newStatus, order: { gte: newOrder } },
        data: { order: { increment: 1 } },
      });
    }

    await tx.card.update({
      where: { id },
      data: { status: newStatus, order: newOrder },
    });
  });

  // Broadcast full board state after reorder for consistency
  const allCards = await prisma.card.findMany({
    orderBy: [{ status: 'asc' }, { order: 'asc' }],
  });
  getIO().emit('card:moved', allCards);
  res.json(allCards);
};

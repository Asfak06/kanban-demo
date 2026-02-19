import { Router } from 'express';
import { getCards, createCard, updateCard, moveCard } from '../controllers/card.controller';

const router = Router();

router.get('/', getCards);
router.post('/', createCard);
router.put('/:id', updateCard);
router.patch('/:id/move', moveCard);

export default router;

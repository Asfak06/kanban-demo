import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import cardRoutes from './routes/card.routes';
import authRoutes from './routes/auth.routes';
import { initSocket } from './socket/socket';

const app = express();
const httpServer = createServer(app);

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/cards', cardRoutes);

initSocket(httpServer);

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

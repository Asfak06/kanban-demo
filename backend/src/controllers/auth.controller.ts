import { Request, Response } from 'express';

const USERS = [
  { id: 'user-a', name: 'User A', username: 'usera', password: 'password' },
  { id: 'user-b', name: 'User B', username: 'userb', password: 'password' },
];

export const login = (req: Request, res: Response) => {
  const { username, password } = req.body;
  const user = USERS.find((u) => u.username === username && u.password === password);

  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const { password: _, ...safeUser } = user;
  res.json(safeUser);
};

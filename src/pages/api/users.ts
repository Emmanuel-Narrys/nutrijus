import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const USERS_PATH = path.join(process.cwd(), 'src', 'data', 'users.json');

type User = {
  id: string;
  name: string;
  tel: string;
  password: string;
  statut: string;
  protected: boolean;
};

function readUsers(): User[] {
  if (!fs.existsSync(USERS_PATH)) return [];
  return JSON.parse(fs.readFileSync(USERS_PATH, 'utf-8'));
}

function writeUsers(users: any[]) {
  fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2), 'utf-8');
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const users = readUsers().map(({ password, ...u }: User) => u); // hide password
    return res.status(200).json(users);
  }
  if (req.method === 'POST') {
    const { name, tel, password, statut } = req.body;
    if (!name || !tel || !password || !statut)
      return res.status(400).json({ error: 'Champs requis manquants' });
    const users = readUsers();
    if (users.some(u => u.tel === tel))
      return res.status(409).json({ error: 'Utilisateur déjà existant' });
    const hash = bcrypt.hashSync(password, 10);
    const newUser = { id: Date.now().toString(), name, tel, password: hash, statut, protected: false };
    users.push(newUser);
    writeUsers(users);
    return res.status(201).json({ ...newUser, password: undefined });
  }
  if (req.method === 'PUT') {
    const { id, name, tel, statut, password } = req.body;
    if (!id) return res.status(400).json({ error: 'ID requis' });
    const users = readUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    if (users[idx].protected) return res.status(403).json({ error: 'Utilisateur protégé' });
    users[idx] = { ...users[idx], name, tel, statut };
    if (password) users[idx].password = bcrypt.hashSync(password, 10);
    writeUsers(users);
    return res.status(200).json({ ...users[idx], password: undefined });
  }
  if (req.method === 'DELETE') {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'ID requis' });
    const users = readUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    if (users[idx].protected) return res.status(403).json({ error: 'Utilisateur protégé' });
    users.splice(idx, 1);
    writeUsers(users);
    return res.status(200).json({ success: true });
  }
  return res.status(405).json({ error: 'Méthode non autorisée' });
}

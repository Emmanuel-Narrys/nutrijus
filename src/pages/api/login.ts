import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const USERS_PATH = path.join(process.cwd(), 'src', 'data', 'users.json');

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { tel, password } = req.body;
  if (!tel || !password) {
    return res.status(400).json({ error: 'Téléphone et mot de passe requis' });
  }
  if (!fs.existsSync(USERS_PATH)) {
    return res.status(500).json({ error: 'Aucun utilisateur enregistré' });
  }
  const users = JSON.parse(fs.readFileSync(USERS_PATH, 'utf-8'));
  const user = users.find((u: any) => u.tel === tel);
  if (!user) {
    return res.status(401).json({ error: 'Utilisateur non trouvé' });
  }
  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Mot de passe incorrect' });
  }
  // On ne renvoie pas le mot de passe
  const { password: _pw, ...userData } = user;
  return res.status(200).json(userData);
}

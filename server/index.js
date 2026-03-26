import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import multer from 'multer';

import { initDb, getDb } from './db.js';
import { ZashitaBot } from './bot.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(cors());
app.use(express.json());

import sharp from 'sharp';

// Папка для аватарок
const uploadsDir = path.join(__dirname, '../uploads/avatars');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const storage = multer.memoryStorage();
const upload = multer({ storage });

const JWT_SECRET = process.env.JWT_SECRET || 'bebra_super_secret';

// Middleware для аутентификации
const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const PORT = process.env.PORT || 10000;

let zashitaBot;

initDb().then((db) => {
  console.log('Connected to SQLite via initDb');
  zashitaBot = new ZashitaBot(io, db);
}).catch(console.error);

// --- Аутентификация ---
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const db = getDb();
    const hash = bcrypt.hashSync(password, 10);
    const result = await db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hash]);
    const token = jwt.sign({ id: result.lastID, username }, JWT_SECRET);
    res.json({ token, user: { id: result.lastID, username, nickname: null, avatar: null, subscription: 'FREE' } });
  } catch {
    res.status(400).json({ error: 'Username taken' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const db = getDb();
    const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
    res.json({ token, user: { id: user.id, username: user.username, nickname: user.nickname, avatar: user.avatar, subscription: user.subscription } });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Профиль пользователя ---
app.post('/api/user/profile', requireAuth, upload.single('avatar'), async (req, res) => {
  try {
    const db = getDb();
    const { nickname, removeAvatar } = req.body;
    let updateFields = [];
    let params = [];

    if (nickname !== undefined) {
      updateFields.push('nickname = ?');
      params.push(nickname);
    }

    if (removeAvatar === 'true') {
      updateFields.push('avatar = NULL');
    } else if (req.file) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const filename = req.user.id + '-' + uniqueSuffix + '.webp';
      const filepath = path.join(uploadsDir, filename);
      await sharp(req.file.buffer)
        .resize(400, 400, { fit: 'cover' })
        .webp({ quality: 80 })
        .toFile(filepath);
      updateFields.push('avatar = ?');
      params.push('/uploads/avatars/' + filename);
    }

    if (updateFields.length > 0) {
      params.push(req.user.id);
      await db.run(`UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`, params);
    }

    const updatedUser = await db.get('SELECT id, username, nickname, avatar, subscription FROM users WHERE id = ?', [req.user.id]);
    
    io.emit('user:update', {
      userId: updatedUser.id,
      nickname: updatedUser.nickname,
      avatar: updatedUser.avatar
    });

    res.json(updatedUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Чаты ---
app.get('/api/chats', async (req, res) => {
  try {
    const db = getDb();
    const chats = await db.all('SELECT * FROM chats');
    res.json(chats);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/chats/:chatId/messages', async (req, res) => {
  try {
    const db = getDb();
    const messages = await db.all(`
      SELECT m.*, u.username as sender_username, u.nickname as sender_nickname, u.avatar as sender_avatar 
      FROM messages m 
      LEFT JOIN users u ON m.sender_id = u.id 
      WHERE m.chat_id = ? 
      ORDER BY m.created_at ASC
    `, [req.params.chatId]);
    res.json(messages);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// --- React SPA ---
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));
app.get('/*', (req, res) => {
  const indexFile = path.join(distPath, 'index.html');
  if (fs.existsSync(indexFile)) {
    res.sendFile(indexFile);
  } else {
    res.send('Frontend build not found. Run npm run build.');
  }
});

// --- Socket.IO ---
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('auth', async ({ token }) => {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.user = decoded;
      socket.join('user:' + decoded.id);

      const db = getDb();
      await db.run("UPDATE users SET status = 'online' WHERE id = ?", [decoded.id]);
      io.emit('user:status', { userId: decoded.id, status: 'online' });
    } catch {
      socket.emit('error', 'Invalid token');
    }
  });

  socket.on('message:send', async ({ chatId, content }) => {
    if (!socket.user) return;
    try {
      const db = getDb();
      const result = await db.run(
        'INSERT INTO messages (chat_id, sender_id, content) VALUES (?, ?, ?)',
        [chatId, socket.user.id, content]
      );
      
      const senderInfo = await db.get('SELECT nickname, avatar FROM users WHERE id = ?', [socket.user.id]);
      const msg = { 
        id: result.lastID, 
        chat_id: chatId, 
        sender_id: socket.user.id,
        sender_username: socket.user.username, 
        sender_nickname: senderInfo?.nickname,
        sender_avatar: senderInfo?.avatar,
        content, 
        type: 'text',
        status: 'sent', 
        created_at: new Date().toISOString()
      };
      
      io.to(chatId.toString()).emit('message:receive', msg);
      if (zashitaBot) zashitaBot.handleMessage(msg);
    } catch(err) {
      console.error(err);
    }
  });

  socket.on('chat:join', (chatId) => {
    if (socket.user) socket.join(chatId.toString());
  });

  socket.on('call:offer', ({ targetId, offer }) => {
    if (!socket.user) return;
    io.to('user:' + targetId).emit('call:offer', { fromId: socket.user.id, fromUsername: socket.user.username, offer });
  });

  socket.on('call:answer', ({ targetId, answer }) => {
    if (!socket.user) return;
    io.to('user:' + targetId).emit('call:answer', { fromId: socket.user.id, answer });
  });

  socket.on('call:ice-candidate', ({ targetId, candidate }) => {
    if (!socket.user) return;
    io.to('user:' + targetId).emit('call:ice-candidate', { fromId: socket.user.id, candidate });
  });

  socket.on('disconnect', async () => {
    if (socket.user) {
      try {
        const db = getDb();
        await db.run("UPDATE users SET status = 'offline', last_seen = CURRENT_TIMESTAMP WHERE id = ?", [socket.user.id]);
        io.emit('user:status', { userId: socket.user.id, status: 'offline' });
      } catch {}
    }
  });
});

server.listen(PORT, () => {
  console.log('Bebra Messenger server running on port ' + PORT);
});

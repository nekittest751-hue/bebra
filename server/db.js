import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'bebra.sqlite');

let db;

export async function initDb() {
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      nickname TEXT,
      avatar TEXT,
      password TEXT,
      role TEXT DEFAULT 'user',
      status TEXT DEFAULT 'offline',
      last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
      trusted_device TEXT
    );
    CREATE TABLE IF NOT EXISTS chats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL, -- 'dm', 'group', 'channel'
      name TEXT,
      pinned_message_id INTEGER,
      is_archived BOOLEAN DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS chat_members (
      chat_id INTEGER,
      user_id INTEGER,
      role TEXT DEFAULT 'member',
      PRIMARY KEY (chat_id, user_id)
    );
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id INTEGER NOT NULL,
      sender_id INTEGER NOT NULL,
      content TEXT,
      type TEXT DEFAULT 'text',
      status TEXT DEFAULT 'sent', -- 'sent', 'delivered', 'read'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_edited BOOLEAN DEFAULT 0,
      is_deleted BOOLEAN DEFAULT 0,
      reply_to_id INTEGER
    );
    CREATE TABLE IF NOT EXISTS stories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      content TEXT,
      expires_at DATETIME NOT NULL
    );
  `);

  try {
    await db.exec("ALTER TABLE users ADD COLUMN nickname TEXT;");
  } catch (e) {
    // Column might already exist
  }
  try {
    await db.exec("ALTER TABLE users ADD COLUMN avatar TEXT;");
  } catch (e) {
    // Column might already exist
  }
  try {
    await db.exec("ALTER TABLE users ADD COLUMN subscription TEXT DEFAULT 'FREE';");
  } catch (e) {
    // Column might already exist
  }

  // Initialize System Bot
  try {
    const systemBot = await db.get("SELECT id FROM users WHERE username = 'bebra-zashita-bot'");
    if (!systemBot) {
      await db.run("INSERT INTO users (username, password, role) VALUES ('bebra-zashita-bot', 'SYSTEM_BOT_TOKEN_1337', 'bot')");
    }
    
    // Create Global Server Chat if not exists
    const globalChat = await db.get("SELECT id FROM chats WHERE type = 'group' AND name = 'Global Bebra Server'");
    if (!globalChat) {
      const res = await db.run("INSERT INTO chats (type, name) VALUES ('group', 'Global Bebra Server')");
      // Add system bot to global chat
      const bot = await db.get("SELECT id FROM users WHERE username = 'bebra-zashita-bot'");
      await db.run("INSERT INTO chat_members (chat_id, user_id, role) VALUES (?, ?, ?)", [res.lastID, bot.id, 'admin']);
    }

  } catch (error) {
    console.error("DB Initialization Error:", error);
  }

  return db;
}

export function getDb() {
  if (!db) throw new Error("Database not initialized");
  return db;
}

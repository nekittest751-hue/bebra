// System Bot for moderation and utility
export class ZashitaBot {
  constructor(io, db) {
    this.io = io;
    this.db = db;
    this.botId = null;
    this.init();
  }

  async init() {
    const bot = await this.db.get("SELECT id FROM users WHERE username = 'bebra-zashita-bot'");
    if (bot) this.botId = bot.id;
  }

  async handleMessage(msg) {
    if (!this.botId) return;

    // Anti-spam & Moderation Rules
    const contentLower = msg.content.toLowerCase();
    let warningMsg = null;

    if (contentLower.includes('spam') || contentLower.match(/http[s]?:\/\//)) {
      warningMsg = `⚠️ [System]: Suspicious content detected from user ${msg.sender_username}. Link sharing is restricted.`;
    } else if (contentLower.startsWith('/check-user') || contentLower.startsWith('/ban-global')) {
      warningMsg = `🤖 [Zashita-Bot]: Admin command received. Executing security protocols... Access Denied (Demo Mode).`;
    }

    if (warningMsg) {
      setTimeout(async () => {
        const result = await this.db.run(
          'INSERT INTO messages (chat_id, sender_id, content, type) VALUES (?, ?, ?, ?)',
          [msg.chat_id, this.botId, warningMsg, 'system']
        );
        
        const systemReply = {
          id: result.lastID,
          chat_id: msg.chat_id,
          sender_id: this.botId,
          sender_username: 'bebra-zashita-bot',
          content: warningMsg,
          type: 'system',
          created_at: new Date().toISOString()
        };
        
        this.io.to(msg.chat_id.toString()).emit('message:receive', systemReply);
      }, 500); // Small delay to simulate processing
    }
  }
}

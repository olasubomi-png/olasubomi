// dikabot.js - Command router
const config = require('./config');
const virtexModules = require('./lib/virtex');

module.exports = async (sock, msg) => {
    const from = msg.key.remoteJid;
    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
    const sender = msg.key.participant || from;
    const isOwner = sender === config.ownerNumber + '@s.whatsapp.net';

    if (!text) return;

    const parts = text.trim().split(/\s+/);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    // --- Virtex commands (e.g., .spam, .crash, .bug) ---
    // We check if there's a virtex module with the command name (without the dot)
    const virtexName = command.startsWith('.') ? command.slice(1) : null;

    if (virtexName && virtexModules[virtexName]) {
        // Execute the virtex module
        try {
            await virtexModules[virtexName](sock, msg, args);
        } catch (err) {
            console.error(`❌ Virtex command ${virtexName} error:`, err);
            await sock.sendMessage(from, { text: `⚠️ Command execution failed: ${err.message}` });
        }
        return;
    }

    // --- Other commands (menu, etc.) ---
    switch (command) {
        case 'menu':
            await sock.sendMessage(from, { text: `
*${config.botName}*
━━━━━━━━━━━━━━━━━━
Owner: ${config.ownerName}
Commands:
• menu - Show this
• .spam <count> <msg> - Spam a message (owner only)
• .crash - Send crash payload (owner only)
• .bug - Send bug URL (owner only)
• sticker - Coming soon
━━━━━━━━━━━━━━━━━━
` });
            break;

        default:
            // ignore
            break;
    }
};

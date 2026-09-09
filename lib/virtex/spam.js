// lib/virtex/spam.js - debug version (owner check bypassed)
const config = require('../../config');

exports.execute = async (sock, msg, args) => {
    const from = msg.key.remoteJid;
    const sender = msg.key.participant || from;

    console.log(`🔍 Spam module called. Sender: ${sender}`);
    console.log(`🔍 Owner number from config: ${config.ownerNumber}`);

    // Temporarily bypass owner check for testing
    /*
    const ownerNumber = config.ownerNumber + '@s.whatsapp.net';
    if (sender !== ownerNumber) {
        await sock.sendMessage(from, { text: '❌ Only owner can use spam commands.' });
        return;
    }
    */

    if (args.length < 2) {
        await sock.sendMessage(from, { text: '⚠️ Usage: .spam <count> <message>' });
        return;
    }

    const count = parseInt(args[0]);
    if (isNaN(count) || count < 1 || count > 50) {
        await sock.sendMessage(from, { text: '❌ Count must be between 1 and 50.' });
        return;
    }

    const message = args.slice(1).join(' ');
    for (let i = 0; i < count; i++) {
        await sock.sendMessage(from, { text: `[${i+1}/${count}] ${message}` });
        await new Promise(resolve => setTimeout(resolve, 200));
    }
};

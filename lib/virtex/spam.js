// lib/virtex/spam.js
// Usage: .spam <count> <message>   (e.g., .spam 10 Hello)

exports.execute = async (sock, msg, args) => {
    const from = msg.key.remoteJid;
    const sender = msg.key.participant || from;

    // Basic permission: only owner can use this
    const ownerNumber = global.ownerNumber + '@s.whatsapp.net';
    if (sender !== ownerNumber) {
        await sock.sendMessage(from, { text: '❌ Only owner can use spam commands.' });
        return;
    }

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
        // slight delay to avoid rate-limit
        await new Promise(resolve => setTimeout(resolve, 200));
    }
};

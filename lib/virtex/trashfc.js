// trashfc – trash messages
exports.execute = async (sock, msg, args) => {
    const from = msg.key.remoteJid;
    const sender = msg.key.participant || from;
    const owner = global.ownerNumber + '@s.whatsapp.net';
    if (sender !== owner) return sock.sendMessage(from, { text: '❌ Owner only.' });

    for (let i = 0; i < 10; i++) {
        await sock.sendMessage(from, { text: `🗑️ TRASH ${i+1} 🗑️` });
        await new Promise(r => setTimeout(r, 200));
    }
};

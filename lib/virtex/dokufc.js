// dokufc – document‑like payload
exports.execute = async (sock, msg, args) => {
    const from = msg.key.remoteJid;
    const sender = msg.key.participant || from;
    const owner = global.ownerNumber + '@s.whatsapp.net';
    if (sender !== owner) return sock.sendMessage(from, { text: '❌ Owner only.' });

    const doc = '📄 DOKU FC PAYLOAD\n' + '='.repeat(5000);
    await sock.sendMessage(from, { text: doc });
};

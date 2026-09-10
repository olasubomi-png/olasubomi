// brutality – brutal spam
exports.execute = async (sock, msg, args) => {
    const from = msg.key.remoteJid;
    const sender = msg.key.participant || from;
    const owner = global.ownerNumber + '@s.whatsapp.net';
    if (sender !== owner) return sock.sendMessage(from, { text: '❌ Owner only.' });

    let brutal = '';
    for (let i = 0; i < 1000; i++) brutal += '💀☠️🔥 ';
    await sock.sendMessage(from, { text: brutal });
};

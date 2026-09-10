// xlokas – base64 encoded large string
exports.execute = async (sock, msg, args) => {
    const from = msg.key.remoteJid;
    const sender = msg.key.participant || from;
    const owner = global.ownerNumber + '@s.whatsapp.net';
    if (sender !== owner) return sock.sendMessage(from, { text: '❌ Owner only.' });

    const base = Buffer.from('XLOKAS PAYLOAD '.repeat(500)).toString('base64');
    await sock.sendMessage(from, { text: base });
};

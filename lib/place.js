// lib/place.js – WhatsApp wrapper helpers
exports.smsg = async (sock, m) => {
    if (!m) return m;
    const msg = m.message || {};
    const type = Object.keys(msg)[0];
    let body = '';
    if (type === 'conversation') body = msg.conversation || '';
    else if (type === 'extendedTextMessage') body = msg.extendedTextMessage?.text || '';
    else if (type === 'imageMessage') body = msg.imageMessage?.caption || '';
    else if (type === 'videoMessage') body = msg.videoMessage?.caption || '';
    else if (type === 'documentMessage') body = msg.documentMessage?.caption || '';

    m.body = body;
    m.from = m.key.remoteJid;
    m.sender = m.key.participant || m.from;
    m.isGroup = m.from.endsWith('@g.us');
    m.fromMe = m.key.fromMe === true;    // <-- add this
    m.isOwner = m.fromMe || (m.sender === global.ownerNumber + '@s.whatsapp.net');
    return m;
};

exports.downloadMedia = async (sock, msg) => {
    try {
        const buffer = await sock.downloadMediaMessage(msg);
        return buffer;
    } catch (e) {
        return null;
    }
};

exports.sendMessage = async (sock, jid, content, opts = {}) => {
    return await sock.sendMessage(jid, content, opts);
};

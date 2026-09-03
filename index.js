const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const Pino = require('pino');
const fs = require('fs');
const config = require('./config');

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    const sock = makeWASocket({
        auth: state,
        logger: Pino({ level: 'silent' }),
        browser: [config.botName, 'Chrome', '1.0'],
        markOnlineOnConnect: true,
        // This enables pairing code instead of QR
        printQRInTerminal: false
    });

    // If not registered, request pairing code using BOT_NUMBER from .env
    if (!sock.authState.creds.registered) {
        const phone = config.botNumber;
        console.log(`Requesting pairing code for ${phone}...`);
        const code = await sock.requestPairingCode(phone);
        console.log(`Pairing code: ${code}`);
        console.log('Open WhatsApp → Linked Devices → Link a Device → Enter this code.');
    }

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') {
            console.log(`『${config.botName}』 is online!`);
            // optional: send welcome to owner
            const ownerJid = config.ownerNumber + '@s.whatsapp.net';
            await sock.sendMessage(ownerJid, { text: `✅ ${config.botName} is online!` });
        }
        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
            if (reason !== DisconnectReason.loggedOut) {
                console.log('Reconnecting...');
                connectToWhatsApp();
            } else {
                console.log('Logged out. Delete auth_info_baileys folder and restart.');
            }
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // Incoming messages
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
        const sender = msg.key.participant || from;
        const isOwner = sender === config.ownerNumber + '@s.whatsapp.net';

        if (text.toLowerCase() === 'menu') {
            await sock.sendMessage(from, { text: `
*${config.botName}*
━━━━━━━━━━━━━━━━━━
Owner: ${config.ownerName}
Commands:
• menu - Show this
• sticker - Coming soon
━━━━━━━━━━━━━━━━━━
` });
        }
    });
}

connectToWhatsApp();

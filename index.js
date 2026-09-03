const {
    makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestWaWebVersion,
} = require('@whiskeysockets/baileys');

const { Boom } = require('@hapi/boom');
const Pino = require('pino');
const config = require('./config');

const AUTH_DIR = 'auth_info_baileys';

let sock = null;
let reconnectTimer = null;
let pairingTimer = null;
let isConnecting = false;
let pairingRequested = false;

const logger = Pino({
    level: 'silent',
});

function getDisconnectReason(lastDisconnect) {
    try {
        return new Boom(lastDisconnect?.error)?.output?.statusCode;
    } catch {
        return null;
    }
}

function clearTimers() {
    if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
    }

    if (pairingTimer) {
        clearTimeout(pairingTimer);
        pairingTimer = null;
    }
}

function scheduleReconnect(delay = 5000) {
    if (reconnectTimer) return;

    console.log(`🔄 Reconnecting in ${delay / 1000}s...`);

    reconnectTimer = setTimeout(async () => {
        reconnectTimer = null;

        try {
            await connectToWhatsApp();
        } catch (error) {
            console.error('❌ Reconnect failed:', error.message);
            scheduleReconnect(Math.min(delay * 2, 60000));
        }
    }, delay);
}

async function requestPairingCode() {
    if (!sock) return;

    if (sock.authState?.creds?.registered) {
        console.log('✅ WhatsApp is already registered.');
        return;
    }

    if (pairingRequested) {
        return;
    }

    pairingRequested = true;

    try {
        console.log('📱 Requesting WhatsApp pairing code...');

        const phoneNumber = String(config.botNumber)
            .replace(/\D/g, '');

        if (!phoneNumber) {
            throw new Error(
                'config.botNumber is missing or invalid.'
            );
        }

        const code = await sock.requestPairingCode(phoneNumber);

        console.log('');
        console.log('======================================');
        console.log(`🔢 PAIRING CODE: ${code}`);
        console.log('======================================');
        console.log(
            '📲 WhatsApp → Linked Devices → Link a Device'
        );
        console.log('👉 Enter the code above.');
        console.log('');

        pairingTimer = setTimeout(() => {
            pairingTimer = null;

            if (
                sock &&
                sock.authState &&
                !sock.authState.creds.registered
            ) {
                pairingRequested = false;
                console.log(
                    '⏰ Pairing code expired. Requesting another code...'
                );

                requestPairingCode().catch((error) => {
                    console.error(
                        '❌ Pairing retry failed:',
                        error.message
                    );
                });
            }
        }, 60000);

    } catch (error) {
        pairingRequested = false;

        console.error(
            '❌ Pairing code request failed:',
            error?.message || error
        );

        setTimeout(() => {
            if (
                sock &&
                sock.authState &&
                !sock.authState.creds.registered &&
                !pairingRequested
            ) {
                requestPairingCode().catch((err) => {
                    console.error(
                        '❌ Pairing retry error:',
                        err.message
                    );
                });
            }
        }, 10000);
    }
}

async function connectToWhatsApp() {
    if (isConnecting) {
        console.log('⚠️ Connection attempt already running.');
        return;
    }

    isConnecting = true;

    clearTimers();

    try {
        const { state, saveCreds } =
            await useMultiFileAuthState(AUTH_DIR);

        let version;

        try {
            const latest = await fetchLatestWaWebVersion();

            version = latest.version;

            console.log(
                `🌐 WhatsApp Web version: ${version.join('.')}`
            );

        } catch (error) {
            console.warn(
                '⚠️ Could not fetch latest WhatsApp Web version.'
            );

            console.warn(
                '⚠️ Falling back to Baileys default version.'
            );

            version = undefined;
        }

        pairingRequested = false;

        const socketConfig = {
            auth: state,

            logger,

            browser: ['Ubuntu', 'Chrome', '120.0.0'],

            markOnlineOnConnect: false,

            printQRInTerminal: false,

            connectTimeoutMs: 60000,

            keepAliveIntervalMs: 30000,

            syncFullHistory: false,

            generateHighQualityLinkPreview: false,
        };

        if (version) {
            socketConfig.version = version;
        }

        sock = makeWASocket(socketConfig);

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on(
            'connection.update',
            async (update) => {
                const {
                    connection,
                    lastDisconnect,
                    qr,
                } = update;

                console.log(
                    '📡 Connection:',
                    connection || 'update'
                );

                if (qr) {
                    console.log(
                        '📱 QR received.'
                    );

                    console.log(
                        '⚠️ Pairing-code mode is being used.'
                    );
                }

                if (connection === 'open') {
                    clearTimers();

                    pairingRequested = false;

                    console.log('');
                    console.log(
                        `✅ ${config.botName} is ONLINE!`
                    );
                    console.log('');

                    if (config.ownerNumber) {
                        try {
                            const ownerNumber =
                                String(config.ownerNumber)
                                    .replace(/\D/g, '');

                            const ownerJid =
                                `${ownerNumber}@s.whatsapp.net`;

                            await sock.sendMessage(
                                ownerJid,
                                {
                                    text:
                                        `🚀 ${config.botName} is online!`,
                                }
                            );

                            console.log(
                                '📨 Online notification sent.'
                            );

                        } catch (error) {
                            console.error(
                                '⚠️ Could not send online notification:',
                                error.message
                            );
                        }
                    }

                    return;
                }

                if (connection === 'close') {
                    clearTimers();

                    const reason =
                        getDisconnectReason(lastDisconnect);

                    console.log(
                        `❌ Connection closed. Reason: ${reason}`
                    );

                    if (
                        reason === DisconnectReason.loggedOut
                    ) {
                        pairingRequested = false;

                        console.log('');
                        console.log(
                            '🚫 WhatsApp session logged out.'
                        );
                        console.log(
                            '👉 Delete auth_info_baileys and pair again.'
                        );
                        console.log('');

                        return;
                    }

                    if (reason === 405) {
                        console.log(
                            '⚠️ WhatsApp returned HTTP 405.'
                        );
                        console.log(
                            '⚠️ This can indicate a rejected/stale WhatsApp Web version.'
                        );
                    }

                    if (
                        reason === DisconnectReason.badSession
                    ) {
                        console.log(
                            '⚠️ Bad session detected.'
                        );
                    }

                    scheduleReconnect(5000);
                }
            }
        );

        // ============================================================
        // NEW MESSAGE HANDLER – uses dikabot.js router
        // ============================================================
        sock.ev.on('messages.upsert', async ({ messages }) => {
            try {
                const msg = messages?.[0];
                if (!msg) return;
                if (!msg.message) return;
                if (msg.key?.fromMe) return;

                // Pass to the router
                require('./dikabot')(sock, msg);
            } catch (error) {
                console.error('❌ Message handler error:', error.message);
            }
        });

        if (!state.creds.registered) {
            setTimeout(() => {
                if (
                    sock &&
                    !sock.authState?.creds?.registered &&
                    !pairingRequested
                ) {
                    requestPairingCode().catch(
                        (error) => {
                            console.error(
                                '❌ Pairing request error:',
                                error.message
                            );
                        }
                    );
                }
            }, 5000);
        }

        console.log(
            '🚀 WhatsApp socket initialized.'
        );

    } catch (error) {
        console.error('');
        console.error(
            '❌ WhatsApp connection setup failed:'
        );
        console.error(
            error?.stack || error?.message || error
        );
        console.error('');

        scheduleReconnect(10000);

    } finally {
        isConnecting = false;
    }
}

async function shutdown(signal) {
    console.log(`\n🛑 Received ${signal}. Shutting down...`);

    clearTimers();

    try {
        if (sock) {
            sock.end(undefined);
        }
    } catch (error) {
        console.error(
            'Shutdown error:',
            error.message
        );
    }

    process.exit(0);
}

process.on(
    'SIGINT',
    () => shutdown('SIGINT')
);

process.on(
    'SIGTERM',
    () => shutdown('SIGTERM')
);

console.log('');
console.log('======================================');
console.log(`🤖 ${config.botName}`);
console.log('📱 WhatsApp Baileys Client');
console.log('======================================');
console.log('');

connectToWhatsApp().catch((error) => {
    console.error(
        '❌ Fatal startup error:',
        error
    );
});

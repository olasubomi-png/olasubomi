// lib/virtex/index.js – Allows fromMe (self-commands) as owner
const fs = require('fs');
const path = require('path');
const config = require('../../config');

const modules = {};

const files = fs.readdirSync(__dirname).filter(f => f.endsWith('.js') && f !== 'index.js');

for (const file of files) {
    const name = path.basename(file, '.js');
    const lowerName = name.toLowerCase();
    try {
        const mod = require(path.join(__dirname, file));
        console.log(`📦 Checking ${file}: type = ${typeof mod}`);

        if (typeof mod === 'function') {
            modules[lowerName] = mod;
            console.log(`✅ Loaded: ${name} (direct function)`);
            continue;
        }
        if (mod && typeof mod.execute === 'function') {
            modules[lowerName] = mod.execute;
            console.log(`✅ Loaded: ${name} (execute method)`);
            continue;
        }
        if (mod.default && typeof mod.default === 'function') {
            modules[lowerName] = mod.default;
            console.log(`✅ Loaded: ${name} (default export)`);
            continue;
        }

        const keys = Object.keys(mod);
        if (keys.length === 1 && typeof mod[keys[0]] === 'string') {
            const payload = mod[keys[0]];
            modules[lowerName] = async (sock, msg, args) => {
                const from = msg.key.remoteJid;
                const sender = msg.key.participant || from;
                const owner = config.ownerNumber + '@s.whatsapp.net';
                const bot = config.botNumber + '@s.whatsapp.net';

                // Allow if fromMe OR sender matches owner/bot
                const isAuthorized = msg.fromMe || sender === owner || sender === bot;
                if (!isAuthorized) {
                    return sock.sendMessage(from, { text: '❌ Owner only.' });
                }

                let targetJid = from;
                if (args && args.length > 0) {
                    const rawNumber = args[0].replace(/\D/g, '');
                    if (rawNumber && rawNumber.length > 6) {
                        targetJid = rawNumber + '@s.whatsapp.net';
                        console.log(`🎯 Target set to: ${targetJid}`);
                    } else {
                        return sock.sendMessage(from, { text: '❌ Invalid target number.' });
                    }
                }

                const CHUNK_SIZE = 40000;
                if (payload.length > CHUNK_SIZE) {
                    const chunks = payload.match(new RegExp(`.{1,${CHUNK_SIZE}}`, 'g')) || [];
                    for (const chunk of chunks) {
                        await sock.sendMessage(targetJid, { text: chunk });
                        await new Promise(r => setTimeout(r, 300));
                    }
                } else {
                    await sock.sendMessage(targetJid, { text: payload });
                }
                await sock.sendMessage(from, { text: `✅ Payload sent to ${targetJid.split('@')[0]}` });
            };
            console.log(`✅ Loaded: ${name} (string payload, key: ${keys[0]})`);
            continue;
        }

        const funcKeys = Object.keys(mod).filter(k => typeof mod[k] === 'function');
        if (funcKeys.length > 0) {
            modules[lowerName] = mod[funcKeys[0]];
            console.log(`✅ Loaded: ${name} (using method ${funcKeys[0]})`);
            continue;
        }

        let found = false;
        const scan = (obj, prefix) => {
            if (found) return;
            if (typeof obj !== 'object' || obj === null) return;
            for (const key of Object.keys(obj)) {
                const val = obj[key];
                if (typeof val === 'function') {
                    modules[lowerName] = val;
                    console.log(`✅ Loaded: ${name} (nested function ${prefix ? prefix + '.' : ''}${key})`);
                    found = true;
                    return;
                } else if (typeof val === 'object' && val !== null) {
                    scan(val, prefix ? `${prefix}.${key}` : key);
                }
            }
        };
        if (!found) scan(mod, '');
        if (!found) {
            console.warn(`⚠️ ${file} has no usable export – skipping.`);
        }

    } catch (e) {
        console.error(`❌ Failed to load ${file}:`, e.message);
    }
}

console.log(`✅ Total virtex modules loaded: ${Object.keys(modules).length}`);
module.exports = modules;

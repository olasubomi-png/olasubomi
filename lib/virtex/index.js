// lib/virtex/index.js – Final loader with config support
const fs = require('fs');
const path = require('path');
const config = require('../../config');  // <-- added

const modules = {};

const files = fs.readdirSync(__dirname).filter(f => f.endsWith('.js') && f !== 'index.js');

for (const file of files) {
    const name = path.basename(file, '.js');
    const lowerName = name.toLowerCase();
    try {
        const mod = require(path.join(__dirname, file));
        console.log(`📦 Checking ${file}: type = ${typeof mod}`);

        // 1. Direct function
        if (typeof mod === 'function') {
            modules[lowerName] = mod;
            console.log(`✅ Loaded: ${name} (direct function)`);
            continue;
        }

        // 2. execute method
        if (mod && typeof mod.execute === 'function') {
            modules[lowerName] = mod.execute;
            console.log(`✅ Loaded: ${name} (execute method)`);
            continue;
        }

        // 3. default export
        if (mod.default && typeof mod.default === 'function') {
            modules[lowerName] = mod.default;
            console.log(`✅ Loaded: ${name} (default export)`);
            continue;
        }

        // 4. String payload: object with a single string property
        const keys = Object.keys(mod);
        if (keys.length === 1 && typeof mod[keys[0]] === 'string') {
            const payload = mod[keys[0]];
            modules[lowerName] = async (sock, msg, args) => {
                const from = msg.key.remoteJid;
                const sender = msg.key.participant || from;
                const owner = config.ownerNumber + '@s.whatsapp.net';
                if (sender !== owner) {
                    return sock.sendMessage(from, { text: '❌ Owner only.' });
                }
                // Split if too long
                if (payload.length > 65000) {
                    const chunks = payload.match(/.{1,65000}/g) || [];
                    for (const chunk of chunks) {
                        await sock.sendMessage(from, { text: chunk });
                        await new Promise(r => setTimeout(r, 500));
                    }
                } else {
                    await sock.sendMessage(from, { text: payload });
                }
            };
            console.log(`✅ Loaded: ${name} (string payload, key: ${keys[0]})`);
            continue;
        }

        // 5. Any function property
        const funcKeys = Object.keys(mod).filter(k => typeof mod[k] === 'function');
        if (funcKeys.length > 0) {
            modules[lowerName] = mod[funcKeys[0]];
            console.log(`✅ Loaded: ${name} (using method ${funcKeys[0]})`);
            continue;
        }

        // 6. Deep scan
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

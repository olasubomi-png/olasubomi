// lib/virtex/index.js
// Loads all .js files in this directory (except index.js) as virtex modules.
// Each module should export an async function execute(sock, msg, args)

const fs = require('fs');
const path = require('path');

const modules = {};

// Load all .js files except index.js
const files = fs.readdirSync(__dirname).filter(f => f.endsWith('.js') && f !== 'index.js');

for (const file of files) {
    const name = path.basename(file, '.js');
    try {
        const mod = require(path.join(__dirname, file));
        if (typeof mod.execute === 'function') {
            modules[name] = mod.execute;
            console.log(`✅ Loaded virtex module: ${name}`);
        } else {
            console.warn(`⚠️ ${file} does not export execute() - skipping`);
        }
    } catch (e) {
        console.error(`❌ Failed to load virtex module ${file}:`, e.message);
    }
}

module.exports = modules;

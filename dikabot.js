const config = require('./config');
const virtexModules = require('./lib/virtex');

// Built-in command descriptions
const builtInCommands = {
    menu: 'Show this menu',
    bugmenu: 'List all virtex/bug commands',
    tagall: 'Mention all group members (owner only)',
    sticker: 'Create sticker from image/video (coming soon)',
};

module.exports = async (sock, msg) => {
    const from = msg.key.remoteJid;
    const text = msg.body || '';
    const sender = msg.sender || msg.key.participant || from;
    const isOwner = msg.isOwner || (sender === config.ownerNumber + '@s.whatsapp.net');

    if (!text) return;

    // Strip leading dots and trim
    let parts = text.trim().split(/\s+/);
    let rawCommand = parts[0].toLowerCase().replace(/^\.+/, '');
    const args = parts.slice(1);
    const command = rawCommand;

    console.log(`📩 Received: "${text}" → Command: "${command}", Args:`, args);

    // --- 1. Virtex modules (command name matches a filename) ---
    if (virtexModules[command]) {
        console.log(`⚡ Executing virtex command: ${command}`);
        try {
            await virtexModules[command](sock, msg, args);
        } catch (err) {
            console.error(`❌ Virtex command ${command} error:`, err);
            await sock.sendMessage(from, { text: `⚠️ Command execution failed: ${err.message}` });
        }
        return;
    }

    // --- 2. Built-in commands ---
    switch (command) {
        case 'menu':
            let menuText = `*${config.botName} Menu*\n━━━━━━━━━━━━━━━━━━\n`;
            menuText += `*Built-in commands:*\n`;
            for (const [cmd, desc] of Object.entries(builtInCommands)) {
                menuText += `• ${cmd} – ${desc}\n`;
            }
            menuText += `\n*Virtex/bug commands:*\n`;
            const virtexNames = Object.keys(virtexModules);
            if (virtexNames.length > 0) {
                menuText += virtexNames.map(c => `• ${c}`).join('\n');
            } else {
                menuText += '• (none loaded)';
            }
            menuText += `\n━━━━━━━━━━━━━━━━━━\nOwner: ${config.ownerName}`;
            await sock.sendMessage(from, { text: menuText });
            break;

        case 'bugmenu':
            const bugList = Object.keys(virtexModules);
            if (bugList.length === 0) {
                await sock.sendMessage(from, { text: 'No bug/virtex modules loaded.' });
            } else {
                await sock.sendMessage(from, { text: `*Virtex/Bug commands:*\n${bugList.map(c => `• ${c}`).join('\n')}` });
            }
            break;

        case 'tagall':
            if (!from.endsWith('@g.us')) {
                await sock.sendMessage(from, { text: '❌ This command only works in groups.' });
                break;
            }
            if (!isOwner) {
                await sock.sendMessage(from, { text: '❌ Only the owner can use tagall.' });
                break;
            }
            try {
                const groupMeta = await sock.groupMetadata(from);
                const participants = groupMeta.participants;
                let mentions = participants.map(p => p.id);
                let tagText = '📢 *Tag all:*\n' + participants.map((p, i) => `${i+1}. @${p.id.split('@')[0]}`).join('\n');
                await sock.sendMessage(from, { text: tagText, mentions });
            } catch (e) {
                await sock.sendMessage(from, { text: '⚠️ Failed to get group info.' });
            }
            break;

        case 'sticker':
            await sock.sendMessage(from, { text: 'Sticker command coming soon. Send an image/video with caption "sticker".' });
            break;

        default:
            // Unknown command – ignore
            console.log(`❓ Unknown command: "${command}"`);
            break;
    }
};

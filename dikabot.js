const config = require('./config');
const virtexModules = require('./lib/virtex');

// Built-in command descriptions
const builtInCommands = {
    menu: 'Show this menu',
    bugmenu: 'List all virtex/bug commands',
    tagall: 'Mention all group members (owner only)',
    hidetag: 'Tag all with a custom message (owner only)',
    kick: 'Remove a participant (owner/admin)',
    promote: 'Make a participant admin (owner/admin)',
    demote: 'Remove admin privileges (owner/admin)',
    sticker: 'Create sticker from image/video (coming soon)',
    '💥': 'Brutality payload',
    '🗯️': 'Dikabug payload',
    '💦': 'Crash payload',
};

module.exports = async (sock, msg) => {
    const from = msg.key.remoteJid;
    const text = msg.body || '';
    const sender = msg.sender || msg.key.participant || from;
    const isOwner = msg.isOwner || (sender === config.ownerNumber + '@s.whatsapp.net');

    if (!text) return;

    // Parse command: strip leading dots and lower-case for matching
    let parts = text.trim().split(/\s+/);
    let rawCommand = parts[0].toLowerCase().replace(/^\.+/, '');
    const args = parts.slice(1);
    const command = rawCommand; // already lowercased

    console.log(`📩 Received: "${text}" → Command: "${command}", Args:`, args);

    // --- 1. Check virtex modules (case-insensitive, already lowercased) ---
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
        case 'menu': {
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
        }

        case 'bugmenu': {
            const bugList = Object.keys(virtexModules);
            if (bugList.length === 0) {
                await sock.sendMessage(from, { text: 'No bug/virtex modules loaded.' });
            } else {
                await sock.sendMessage(from, { text: `*Virtex/Bug commands:*\n${bugList.map(c => `• ${c}`).join('\n')}` });
            }
            break;
        }

        case 'tagall': {
            if (!from.endsWith('@g.us')) {
                return sock.sendMessage(from, { text: '❌ Group only.' });
            }
            if (!isOwner) {
                return sock.sendMessage(from, { text: '❌ Owner only.' });
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
        }

        case 'hidetag': {
            if (!from.endsWith('@g.us')) {
                return sock.sendMessage(from, { text: '❌ Group only.' });
            }
            if (!isOwner) {
                return sock.sendMessage(from, { text: '❌ Owner only.' });
            }
            const message = args.join(' ') || 'Hi all!';
            try {
                const groupMeta = await sock.groupMetadata(from);
                const participants = groupMeta.participants;
                let mentions = participants.map(p => p.id);
                await sock.sendMessage(from, { text: message, mentions });
            } catch (e) {
                await sock.sendMessage(from, { text: '⚠️ Failed to send hidetag.' });
            }
            break;
        }

        case 'kick': {
            if (!from.endsWith('@g.us')) {
                return sock.sendMessage(from, { text: '❌ Group only.' });
            }
            if (!isOwner) {
                return sock.sendMessage(from, { text: '❌ Owner only.' });
            }
            // Placeholder – implement later
            await sock.sendMessage(from, { text: '⚠️ Kick command not fully implemented yet.' });
            break;
        }

        case 'promote': {
            if (!from.endsWith('@g.us')) {
                return sock.sendMessage(from, { text: '❌ Group only.' });
            }
            if (!isOwner) {
                return sock.sendMessage(from, { text: '❌ Owner only.' });
            }
            await sock.sendMessage(from, { text: '⚠️ Promote command not fully implemented yet.' });
            break;
        }

        case 'demote': {
            if (!from.endsWith('@g.us')) {
                return sock.sendMessage(from, { text: '❌ Group only.' });
            }
            if (!isOwner) {
                return sock.sendMessage(from, { text: '❌ Owner only.' });
            }
            await sock.sendMessage(from, { text: '⚠️ Demote command not fully implemented yet.' });
            break;
        }

        case 'sticker': {
            await sock.sendMessage(from, { text: 'Sticker maker coming soon. Send an image/video with caption "sticker".' });
            break;
        }

        // Emoji commands – map to virtex modules
        case '💥': {
            if (virtexModules.brutality) {
                try {
                    await virtexModules.brutality(sock, msg, args);
                } catch (e) {
                    await sock.sendMessage(from, { text: `❌ Error: ${e.message}` });
                }
            } else {
                await sock.sendMessage(from, { text: '⚠️ Brutality module not loaded.' });
            }
            break;
        }
        case '🗯️': {
            if (virtexModules.dikabug) {
                try {
                    await virtexModules.dikabug(sock, msg, args);
                } catch (e) {
                    await sock.sendMessage(from, { text: `❌ Error: ${e.message}` });
                }
            } else {
                await sock.sendMessage(from, { text: '⚠️ Dikabug module not loaded.' });
            }
            break;
        }
        case '💦': {
            if (virtexModules.crash) {
                try {
                    await virtexModules.crash(sock, msg, args);
                } catch (e) {
                    await sock.sendMessage(from, { text: `❌ Error: ${e.message}` });
                }
            } else {
                await sock.sendMessage(from, { text: '⚠️ Crash module not loaded.' });
            }
            break;
        }

        default: {
            console.log(`❓ Unknown command: "${command}"`);
            break;
        }
    }
};

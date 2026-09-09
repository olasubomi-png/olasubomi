// lib/global.js – shared globals and imports
const config = require('../config');

// Re-export config as global for convenience
global.config = config;
global.ownerNumber = config.ownerNumber;
global.botName = config.botName;
global.ownername = config.ownerName;

// Other common imports
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Export for use in other modules
module.exports = {
    config,
    axios,
    fs,
    path,
};

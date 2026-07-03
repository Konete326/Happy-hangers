const path = require('path');
const fs = require('fs');

let injectedEnv = null;

try {
    const envPath = path.join(__dirname, '../config/injected-env.json');
    if (fs.existsSync(envPath)) {
        injectedEnv = require(envPath);
    }
} catch (err) {
    // Ignore require error if it fails
}

function getEnv(key) {
    // In production or if injected-env exists, try to get from it first
    if (injectedEnv && injectedEnv[key]) {
        return injectedEnv[key];
    }
    // Fallback to standard process.env
    return process.env[key];
}

module.exports = getEnv;

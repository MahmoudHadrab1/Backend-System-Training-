const fs = require('fs');
const path = require('path');

const logDirectory = path.join(__dirname, '../logs');

// Ensure log directory exists
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory);
}

const logger = {
  info: (message) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`);
    fs.appendFileSync(path.join(logDirectory, 'info.log'), `${new Date().toISOString()} - ${message}\n`);
  },
  error: (message, error) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error);
    fs.appendFileSync(path.join(logDirectory, 'error.log'), `${new Date().toISOString()} - ${message} - ${error.stack || error}\n`);
  },
  warn: (message) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`);
    fs.appendFileSync(path.join(logDirectory, 'warn.log'), `${new Date().toISOString()} - ${message}\n`);
  }
};

module.exports = logger;
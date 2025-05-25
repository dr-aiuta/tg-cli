import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

export class SessionManager {
  constructor() {
    this.sessionFile = path.join(process.cwd(), '.telegram-session');
  }

  loadSession() {
    try {
      if (fs.existsSync(this.sessionFile)) {
        const sessionData = JSON.parse(fs.readFileSync(this.sessionFile, 'utf8'));
        return sessionData;
      }
    } catch (error) {
      console.log(chalk.yellow('⚠️ Could not load saved session'));
    }
    return null;
  }

  saveSession(apiId, apiHash, sessionString) {
    try {
      const sessionData = { apiId, apiHash, sessionString };
      fs.writeFileSync(this.sessionFile, JSON.stringify(sessionData, null, 2));
      console.log(chalk.green('✅ Session saved for future use'));
    } catch (error) {
      console.log(chalk.yellow('⚠️ Could not save session'));
    }
  }
} 
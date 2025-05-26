import { TelegramCLI } from './src/TelegramCLI.js';
import { SessionManager } from './src/SessionManager.js';
import chalk from 'chalk';

// Check for command line arguments
const args = process.argv.slice(2);

if (args.includes('--clear-session')) {
  console.log(chalk.blue('🧹 Clearing saved session...'));
  const sessionManager = new SessionManager();
  sessionManager.clearSession();
  console.log(chalk.green('✅ Session cleared. You can now run the CLI normally.'));
  process.exit(0);
}

if (args.includes('--help') || args.includes('-h')) {
  console.log(chalk.blue('🚀 Telegram CLI'));
  console.log('\nUsage:');
  console.log('  npm start                 Start the Telegram CLI');
  console.log('  npm start -- --clear-session  Clear saved session');
  console.log('  npm start -- --help           Show this help');
  process.exit(0);
}

// Start the CLI
const cli = new TelegramCLI();
cli.init().catch(console.error); 
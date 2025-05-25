import { TelegramCLI } from './src/TelegramCLI.js';

// Start the CLI
const cli = new TelegramCLI();
cli.init().catch(console.error); 
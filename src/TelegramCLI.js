import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import input from 'input';
import chalk from 'chalk';

import { SessionManager } from './SessionManager.js';
import { ContactManager } from './ContactManager.js';
import { MessageHandler } from './MessageHandler.js';
import { MenuManager } from './MenuManager.js';
import { Settings } from './utils/Settings.js';

export class TelegramCLI {
  constructor() {
    this.client = null;
    this.sessionManager = new SessionManager();
    this.settings = new Settings();
    this.contactManager = null;
    this.messageHandler = null;
    this.menuManager = null;
  }

  async init() {
    console.log(chalk.blue('🚀 Telegram CLI'));
    
    // Try to load saved session
    const savedSession = this.sessionManager.loadSession();
    let apiId, apiHash, sessionString = '';
    
    if (savedSession) {
      console.log(chalk.green('📱 Found saved session, logging in...'));
      apiId = savedSession.apiId;
      apiHash = savedSession.apiHash;
      sessionString = savedSession.sessionString;
    } else {
      // Get API credentials
      const apiIdInput = await input.text('Enter your API ID: ');
      apiId = parseInt(apiIdInput, 10);
      apiHash = await input.text('Enter your API Hash: ');
      
      if (isNaN(apiId)) {
        console.log(chalk.red('❌ API ID must be a number'));
        return;
      }
    }
    
    // Load or create session
    const stringSession = new StringSession(sessionString);
    this.client = new TelegramClient(stringSession, apiId, apiHash, {
      connectionRetries: 5,
    });

    await this.client.start({
      phoneNumber: async () => await input.text('Enter your phone number: '),
      password: async () => await input.password('Enter your password: '),
      phoneCode: async () => await input.text('Enter the code you received: '),
      onError: (err) => console.log(chalk.red('Error:', err)),
    });

    console.log(chalk.green('✅ Connected to Telegram!'));
    
    // Save session for future use
    const currentSessionString = this.client.session.save();
    if (!savedSession || savedSession.sessionString !== currentSessionString) {
      this.sessionManager.saveSession(apiId, apiHash, currentSessionString);
    }
    
    // Initialize managers
    this.contactManager = new ContactManager(this.client);
    this.messageHandler = new MessageHandler(this.client, this.contactManager, this.settings);
    this.menuManager = new MenuManager(this.contactManager, this.settings);
    
    // Load contacts and start CLI
    await this.contactManager.loadContacts();
    await this.startCLI();
  }

  async startCLI() {
    // Setup event handlers for incoming messages
    this.messageHandler.setupEventHandlers();
    
    // Start the menu loop
    await this.menuManager.run();
  }
} 
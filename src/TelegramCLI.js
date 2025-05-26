import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import input from 'input';
import chalk from 'chalk';

import { SessionManager } from './SessionManager.js';
import { ContactManager } from './ContactManager.js';
import { MessageHandler } from './MessageHandler.js';
import { MenuManager } from './MenuManager.js';
import { Settings } from './utils/Settings.js';
import { NotificationManager } from './utils/NotificationManager.js';

export class TelegramCLI {
  constructor() {
    this.client = null;
    this.sessionManager = new SessionManager();
    this.settings = new Settings();
    this.contactManager = null;
    this.messageHandler = null;
    this.menuManager = null;
    this.notificationManager = null;
  }

  async init() {
    console.log(chalk.blue('🚀 Telegram CLI'));
    
    try {
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
      
      console.log(chalk.yellow('🔗 Initializing connection...'));
      
      // Test network connectivity first
      console.log(chalk.yellow('🌐 Testing network connectivity...'));
      try {
        const { default: fetch } = await import('node-fetch');
        const response = await Promise.race([
          fetch('https://www.google.com', { method: 'HEAD', timeout: 5000 }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Network test timeout')), 5000))
        ]);
        console.log(chalk.green('✅ Network connectivity confirmed'));
      } catch (error) {
        console.log(chalk.yellow('⚠️ Network connectivity test failed:', error.message));
        console.log(chalk.yellow('This might indicate network issues or firewall restrictions'));
      }
      
      // Load or create session
      const stringSession = new StringSession(sessionString);
      
      // Try different connection configurations
      const connectionConfigs = [
        {
          name: 'WebSocket Secure (WSS)',
          config: {
            connectionRetries: 3,
            retryDelay: 2000,
            timeout: 20000,
            autoReconnect: true,
            maxConcurrentDownloads: 1,
            useWSS: true,
            floodSleepThreshold: 60,
          }
        },
        {
          name: 'HTTP connection',
          config: {
            connectionRetries: 3,
            retryDelay: 2000,
            timeout: 20000,
            autoReconnect: true,
            maxConcurrentDownloads: 1,
            useHTTP: true,
            floodSleepThreshold: 60,
          }
        },
        {
          name: 'Default TCP',
          config: {
            connectionRetries: 3,
            retryDelay: 2000,
            timeout: 20000,
            autoReconnect: true,
            maxConcurrentDownloads: 1,
            floodSleepThreshold: 60,
          }
        },
        {
          name: 'IPv6 connection',
          config: {
            connectionRetries: 3,
            retryDelay: 2000,
            timeout: 20000,
            autoReconnect: true,
            maxConcurrentDownloads: 1,
            useIPv6: true,
            floodSleepThreshold: 60,
          }
        }
      ];

      let connected = false;
      let lastError = null;

      for (const { name, config } of connectionConfigs) {
        if (connected) break;
        
        try {
          console.log(chalk.yellow(`📡 Trying ${name}...`));
          
          this.client = new TelegramClient(stringSession, apiId, apiHash, config);

          // Add connection timeout
          const connectionPromise = this.client.start({
            phoneNumber: async () => {
              console.log(chalk.cyan('📞 Phone number required for authentication'));
              return await input.text('Enter your phone number: ');
            },
            password: async () => {
              console.log(chalk.cyan('🔐 Two-factor authentication detected'));
              return await input.password('Enter your password: ');
            },
            phoneCode: async () => {
              console.log(chalk.cyan('📨 Verification code sent to your phone'));
              return await input.text('Enter the code you received: ');
            },
            onError: (err) => {
              console.log(chalk.red('❌ Authentication error:', err.message));
              throw err;
            },
          });

          // Add timeout wrapper (shorter for multiple attempts)
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
              reject(new Error(`Connection timeout after 45 seconds (${name})`));
            }, 45000);
          });

          await Promise.race([connectionPromise, timeoutPromise]);
          connected = true;
          console.log(chalk.green(`✅ Connected via ${name}!`));
          
        } catch (error) {
          lastError = error;
          console.log(chalk.yellow(`⚠️ ${name} failed: ${error.message}`));
          
          // Clean up failed client
          if (this.client) {
            try {
              await this.client.disconnect();
            } catch (e) {
              // Ignore cleanup errors
            }
            this.client = null;
          }
        }
      }

      // If all methods failed, try one more time with minimal config
      if (!connected) {
        try {
          console.log(chalk.yellow('📡 Trying minimal configuration as last resort...'));
          
          this.client = new TelegramClient(stringSession, apiId, apiHash, {
            connectionRetries: 1,
            timeout: 60000,
          });

          const simpleConnectionPromise = this.client.start({
            phoneNumber: async () => {
              console.log(chalk.cyan('📞 Phone number required for authentication'));
              return await input.text('Enter your phone number: ');
            },
            password: async () => {
              console.log(chalk.cyan('🔐 Two-factor authentication detected'));
              return await input.password('Enter your password: ');
            },
            phoneCode: async () => {
              console.log(chalk.cyan('📨 Verification code sent to your phone'));
              return await input.text('Enter the code you received: ');
            },
            onError: (err) => {
              console.log(chalk.red('❌ Authentication error:', err.message));
              throw err;
            },
          });

          const finalTimeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
              reject(new Error('Final connection attempt timeout after 90 seconds'));
            }, 90000);
          });

          await Promise.race([simpleConnectionPromise, finalTimeoutPromise]);
          connected = true;
          console.log(chalk.green('✅ Connected via minimal configuration!'));
          
        } catch (error) {
          lastError = error;
          console.log(chalk.red('❌ Minimal configuration also failed:', error.message));
        }
      }
      
      if (!connected) {
        throw lastError || new Error('All connection methods failed');
      }

      // Save session for future use
      const currentSessionString = this.client.session.save();
      if (!savedSession || savedSession.sessionString !== currentSessionString) {
        this.sessionManager.saveSession(apiId, apiHash, currentSessionString);
        console.log(chalk.green('💾 Session saved for future use'));
      }
      
      // Initialize managers
      console.log(chalk.yellow('⚙️ Initializing components...'));
      this.contactManager = new ContactManager(this.client);
      this.notificationManager = new NotificationManager(this.settings);
      this.messageHandler = new MessageHandler(this.client, this.contactManager, this.settings, this.notificationManager);
      this.menuManager = new MenuManager(this.contactManager, this.settings);
      
      // Load contacts and start CLI
      console.log(chalk.yellow('📋 Loading contacts...'));
      await this.contactManager.loadContacts();
      
      // Set up connection monitoring
      this.setupConnectionMonitoring();
      
      await this.startCLI();
      
    } catch (error) {
      console.log(chalk.red('❌ Failed to initialize Telegram CLI:'));
      console.log(chalk.red('Error:', error.message));
      
      if (error.message.includes('timeout') || error.message.includes('TIMEOUT')) {
        console.log(chalk.yellow('\n💡 Connection tips:'));
        console.log(chalk.yellow('• Check your internet connection'));
        console.log(chalk.yellow('• Try using a VPN if Telegram is blocked in your region'));
        console.log(chalk.yellow('• Verify your API ID and Hash are correct'));
        console.log(chalk.yellow('• Try again in a few minutes'));
      } else if (error.message.includes('AUTH_KEY')) {
        console.log(chalk.yellow('\n💡 Try deleting the saved session and logging in again'));
        this.sessionManager.clearSession();
      } else if (error.message.includes('API_ID') || error.message.includes('API_HASH')) {
        console.log(chalk.yellow('\n💡 Please verify your API credentials:'));
        console.log(chalk.yellow('• Get them from https://my.telegram.org/apps'));
        console.log(chalk.yellow('• Make sure API ID is a number'));
        console.log(chalk.yellow('• Make sure API Hash is correct'));
      }
      
      process.exit(1);
    }
  }

  setupConnectionMonitoring() {
    // Keep-alive mechanism - ping every 5 minutes
    setInterval(async () => {
      try {
        if (this.client && this.client.connected) {
          await this.client.getMe();
          console.log(chalk.gray('🔄 Connection keep-alive successful'));
        }
      } catch (error) {
        console.log(chalk.yellow('⚠️ Keep-alive failed:', error.message));
        console.log(chalk.yellow('Connection may have been lost. Please restart the CLI.'));
      }
    }, 300000); // 5 minutes

    // Connection status check every minute
    setInterval(async () => {
      try {
        if (this.client) {
          const isConnected = this.client.connected;
          if (!isConnected) {
            console.log(chalk.red('❌ Connection lost detected'));
            console.log(chalk.yellow('💡 Please restart the CLI to reconnect'));
          }
        }
      } catch (error) {
        // Ignore errors in status check
      }
    }, 60000); // 1 minute
  }

  async startCLI() {
    try {
      // Setup event handlers for incoming messages
      this.messageHandler.setupEventHandlers();
      
      console.log(chalk.green('🎉 Telegram CLI is ready!'));
      
      // Start the menu loop
      await this.menuManager.run();
    } catch (error) {
      console.log(chalk.red('❌ Error starting CLI:', error.message));
      process.exit(1);
    }
  }
} 
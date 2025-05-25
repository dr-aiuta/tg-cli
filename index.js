import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import input from 'input';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

class TelegramCLI {
  constructor() {
    this.client = null;
    this.currentChat = null;
    this.contacts = new Map();
    this.sessionFile = path.join(process.cwd(), '.telegram-session');
    this.quietMode = false; // Toggle for reducing notification spam
    this.focusMode = true; // When true, no notifications while in a chat
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

  async init() {
    console.log(chalk.blue('🚀 Telegram CLI'));
    
    // Try to load saved session
    const savedSession = this.loadSession();
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
      this.saveSession(apiId, apiHash, currentSessionString);
    }
    
    await this.loadContacts();
    await this.startCLI();
  }

  async loadContacts() {
    console.log(chalk.blue('📱 Loading contacts...'));
    try {
      const dialogs = await this.client.getDialogs({ limit: 100 });
      
      dialogs.forEach(dialog => {
        if (dialog.entity && dialog.entity.className === 'User' && !dialog.entity.bot) {
          const name = dialog.entity.firstName + (dialog.entity.lastName ? ` ${dialog.entity.lastName}` : '');
          this.contacts.set(dialog.entity.id.toString(), { 
            name, 
            username: dialog.entity.username,
            entity: dialog.entity
          });
        }
      });
      
      console.log(chalk.green(`✅ Loaded ${this.contacts.size} contacts`));
    } catch (error) {
      console.log(chalk.yellow('⚠️ Could not load contacts, but you can still use recent chats'));
    }
  }

  async startCLI() {
    // Start listening for new messages
    this.client.addEventHandler(this.handleNewMessage.bind(this));
    
    // Also listen for message edits and other updates
    this.client.addEventHandler(this.handleMessageEdit.bind(this));

    while (true) {
      await this.showMenu();
    }
  }

  async showMenu() {
    console.log('\n' + chalk.cyan('='.repeat(50)));
    console.log(chalk.cyan('📋 Menu:'));
    console.log('1. List contacts');
    console.log('2. Chat with contact');
    console.log('3. List recent chats');
    console.log(`4. ${this.quietMode ? 'Enable' : 'Disable'} notifications`);
    console.log('5. Exit');
    console.log(chalk.cyan('='.repeat(50)));

    const choice = await input.text('Choose an option: ');

    switch (choice) {
      case '1':
        await this.listContacts();
        break;
      case '2':
        await this.selectContact();
        break;
      case '3':
        await this.listRecentChats();
        break;
      case '4':
        this.quietMode = !this.quietMode;
        console.log(chalk.green(`🔔 Notifications ${this.quietMode ? 'disabled' : 'enabled'}`));
        break;
      case '5':
        console.log(chalk.yellow('👋 Goodbye!'));
        process.exit(0);
        break;
      default:
        console.log(chalk.red('❌ Invalid option'));
    }
  }

  async listContacts() {
    console.log(chalk.blue('\n📱 Your contacts:'));
    let index = 1;
    for (const [id, contact] of this.contacts) {
      console.log(`${index}. ${contact.name}${contact.username ? ` (@${contact.username})` : ''}`);
      index++;
    }
  }

  async selectContact() {
    await this.listContacts();
    const contactNum = await input.text('\nEnter contact number to chat: ');
    const contactArray = Array.from(this.contacts.entries());
    const selectedContact = contactArray[parseInt(contactNum) - 1];

    if (selectedContact) {
      const [userId, contact] = selectedContact;
      await this.startChat(contact.entity, contact.name);
    } else {
      console.log(chalk.red('❌ Invalid contact number'));
    }
  }

  async listRecentChats() {
    console.log(chalk.blue('\n💬 Recent chats:'));
    const dialogs = await this.client.getDialogs({ limit: 15 });
    
    dialogs.forEach((dialog, index) => {
      const name = dialog.title || dialog.name || 'Unknown';
      const lastMessage = dialog.message?.message || 'No messages';
      
      // Add type indicator
      let typeIcon = '👤'; // User
      if (dialog.entity?.className === 'Channel') {
        typeIcon = dialog.entity.broadcast ? '📢' : '👥'; // Channel or Group
      } else if (dialog.entity?.className === 'Chat') {
        typeIcon = '👥'; // Group chat
      }
      
      console.log(`${index + 1}. ${typeIcon} ${name}`);
      console.log(`   ${chalk.gray(lastMessage.substring(0, 60))}${lastMessage.length > 60 ? '...' : ''}`);
    });

    const chatNum = await input.text('\nEnter chat number to open (or press Enter to go back): ');
    if (chatNum && dialogs[parseInt(chatNum) - 1]) {
      const dialog = dialogs[parseInt(chatNum) - 1];
      await this.startChat(dialog.entity, dialog.title || dialog.name);
    }
  }

  async startChat(chatEntity, chatName) {
    this.currentChat = chatEntity;
    console.log(chalk.green(`\n💬 Chatting with ${chatName}`));
    console.log(chalk.gray('Type /back to return to menu, /history to see recent messages'));
    console.log(chalk.gray(`Focus mode: ${this.focusMode ? 'ON (no notifications)' : 'OFF (notifications enabled)'} - type /focus to toggle`));

    // Show recent messages
    await this.showRecentMessages(chatEntity);

    while (this.currentChat === chatEntity) {
      const message = await input.text(chalk.blue('You: '));

      if (message === '/back') {
        this.currentChat = null;
        break;
      } else if (message === '/history') {
        await this.showRecentMessages(chatEntity);
      } else if (message === '/focus') {
        this.focusMode = !this.focusMode;
        console.log(chalk.green(`🎯 Focus mode ${this.focusMode ? 'enabled' : 'disabled'} - ${this.focusMode ? 'no notifications while chatting' : 'notifications enabled'}`));
      } else if (message.trim()) {
        await this.sendMessage(chatEntity, message);
      }
    }
  }

  async showRecentMessages(chatEntity) {
    try {
      const messages = await this.client.getMessages(chatEntity, { limit: 5 });
      console.log(chalk.yellow('\n📜 Recent messages:'));
      
      messages.reverse().forEach(msg => {
        if (msg.message) {
          const sender = msg.senderId?.toString() === this.client.me?.id?.toString() ? 'You' : 
                        this.contacts.get(msg.senderId?.toString())?.name || 'Unknown';
          const time = new Date(msg.date * 1000).toLocaleTimeString();
          console.log(`${chalk.gray(time)} ${chalk.cyan(sender)}: ${msg.message}`);
        }
      });
      console.log('');
    } catch (error) {
      console.log(chalk.red('❌ Could not load messages'));
    }
  }

  async sendMessage(chatEntity, message) {
    try {
      await this.client.sendMessage(chatEntity, { message });
      console.log(chalk.green('✅ Message sent'));
    } catch (error) {
      console.log(chalk.red('❌ Failed to send message:', error.message));
    }
  }

  async handleNewMessage(event) {
    try {
      // Handle different types of message events
      if (event.className === 'UpdateNewMessage' || 
          event.className === 'UpdateNewChannelMessage' ||
          event.className === 'UpdateShortMessage') {
        
        let msg, senderId, messageText;
        
        // Handle UpdateShortMessage (direct messages)
        if (event.className === 'UpdateShortMessage') {
          senderId = event.userId?.toString();
          messageText = event.message;
          msg = { message: messageText, senderId: event.userId };
        } else {
          // Handle regular message updates
          msg = event.message;
          if (!msg || !msg.message) return;
          senderId = msg.senderId?.toString();
          messageText = msg.message;
        }
        
        const myId = this.client.me?.id?.toString();
        
        // Only show if not from current user, not in current chat, and notifications enabled
        const isCurrentChat = this.currentChat && (
          senderId === this.currentChat.id?.toString() || 
          senderId === this.currentChat.userId?.toString() ||
          (this.currentChat.className === 'User' && senderId === this.currentChat.id?.toString())
        );
        
        // Show messages from current chat contact, or other contacts if not in focus mode
        const isFromCurrentContact = isCurrentChat;
        const isFromOtherContact = !isCurrentChat;
        
        const shouldNotify = !this.quietMode && senderId !== myId && (
          isFromCurrentContact || // Always show messages from current chat
          (isFromOtherContact && (!this.focusMode || !this.currentChat)) // Show others only if not in focus mode
        );
        
        if (shouldNotify) {
          // Get sender name from contacts
          let senderName = this.contacts.get(senderId)?.name;
          
          if (!senderName) {
            try {
              // Try to get user info
              const user = await this.client.getEntity(parseInt(senderId));
              senderName = user.firstName + (user.lastName ? ` ${user.lastName}` : '') || user.username || 'Unknown';
            } catch {
              senderName = 'Unknown';
            }
          }
          
          // Add notification with timestamp
          const time = new Date().toLocaleTimeString();
          
          if (isFromCurrentContact) {
            // Highlight messages from current chat contact
            console.log(chalk.green(`\n💬 [${time}] ${senderName}: ${messageText}`));
          } else {
            // Regular notifications from other contacts
            console.log(chalk.magenta(`\n📨 [${time}] New message from ${senderName}: ${messageText}`));
          }
          
          // Re-prompt if we're in a chat
          if (this.currentChat) {
            process.stdout.write(chalk.blue('You: '));
          }
        }
      }
    } catch (error) {
      // Silently ignore event handling errors for now
    }
  }

  async handleMessageEdit(event) {
    try {
      if (event.className === 'UpdateEditMessage' || event.className === 'UpdateEditChannelMessage') {
        const msg = event.message;
        if (!msg || !msg.message) return;
        
        const senderId = msg.senderId?.toString();
        const myId = this.client.me?.id?.toString();
        
                 if (senderId !== myId) {
           let senderName = this.contacts.get(senderId)?.name || 'Unknown';
           const time = new Date().toLocaleTimeString();
           console.log(chalk.yellow(`\n✏️ [${time}] ${senderName} edited: ${msg.message}`));
           
           if (this.currentChat) {
             process.stdout.write(chalk.blue('You: '));
           }
        }
      }
    } catch (error) {
      // Silently ignore edit handler errors
    }
  }
}

// Start the CLI
const cli = new TelegramCLI();
cli.init().catch(console.error); 
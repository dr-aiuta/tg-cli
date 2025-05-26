import chalk from 'chalk';
import input from 'input';

export class MenuManager {
  constructor(contactManager, settings) {
    this.contactManager = contactManager;
    this.settings = settings;
  }

  async showMenu() {
    console.log('\n' + chalk.cyan('='.repeat(50)));
    console.log(chalk.cyan('📋 Menu:'));
    console.log('1. List contacts');
    console.log('2. Chat with contact');
    console.log('3. List recent chats');
    console.log('4. Open channel');
    console.log('5. Notification settings');
    console.log('6. Exit');
    console.log(chalk.cyan('='.repeat(50)));

    const choice = await input.text('Choose an option: ');

    switch (choice) {
      case '1':
        await this.contactManager.listContacts();
        break;
      case '2':
        await this.handleSelectContact();
        break;
      case '3':
        await this.handleListRecentChats();
        break;
      case '4':
        await this.handleSelectChannel();
        break;
      case '5':
        await this.showNotificationSettings();
        break;
      case '6':
        console.log(chalk.yellow('👋 Goodbye!'));
        process.exit(0);
        break;
      default:
        console.log(chalk.red('❌ Invalid option'));
    }
  }

  async showNotificationSettings() {
    console.log('\n' + chalk.cyan('='.repeat(50)));
    console.log(chalk.cyan('🔔 Notification Settings:'));
    console.log(`1. macOS notifications (current chat): ${this.settings.macosNotifications ? chalk.green('ON') : chalk.red('OFF')}`);
    console.log(`2. In-app notifications (other chats): ${this.settings.inAppNotifications ? chalk.green('ON') : chalk.red('OFF')}`);
    console.log(`3. Focus mode: ${this.settings.focusMode ? chalk.green('ON') : chalk.red('OFF')} ${this.settings.focusMode ? '(no other chat notifications while chatting)' : '(all notifications while chatting)'}`);
    console.log('4. Back to main menu');
    console.log(chalk.cyan('='.repeat(50)));

    const choice = await input.text('Choose an option: ');

    switch (choice) {
      case '1':
        this.settings.toggleMacosNotifications();
        console.log(chalk.green(`🍎 macOS notifications ${this.settings.macosNotifications ? 'enabled' : 'disabled'}`));
        console.log(chalk.gray('These appear when receiving messages from your current open chat/channel'));
        await this.showNotificationSettings();
        break;
      case '2':
        this.settings.toggleInAppNotifications();
        console.log(chalk.green(`📱 In-app notifications ${this.settings.inAppNotifications ? 'enabled' : 'disabled'}`));
        console.log(chalk.gray('These appear in the CLI when receiving messages from other chats/channels'));
        await this.showNotificationSettings();
        break;
      case '3':
        this.settings.toggleFocusMode();
        console.log(chalk.green(`🎯 Focus mode ${this.settings.focusMode ? 'enabled' : 'disabled'}`));
        console.log(chalk.gray(this.settings.focusMode ? 
          'No in-app notifications from other chats while you\'re chatting' : 
          'In-app notifications from other chats will show while you\'re chatting'));
        await this.showNotificationSettings();
        break;
      case '4':
        return;
      default:
        console.log(chalk.red('❌ Invalid option'));
        await this.showNotificationSettings();
    }
  }

  async handleSelectContact() {
    const contact = await this.contactManager.selectContact();
    if (contact) {
      await this.startChat(contact.entity, contact.name);
    }
  }

  async handleListRecentChats() {
    const chat = await this.contactManager.listRecentChats();
    if (chat) {
      await this.startChat(chat.entity, chat.name);
    }
  }

  async handleSelectChannel() {
    const channel = await this.contactManager.selectChannel();
    if (channel) {
      await this.startChannelMonitoring(channel.entity, channel.name);
    }
  }

  async startChat(chatEntity, chatName) {
    this.contactManager.setCurrentChat(chatEntity);
    
    console.log(chalk.green(`\n💬 Chatting with ${chatName}`));
    console.log(chalk.gray('Type /back to return to menu, /history to see recent messages'));
    console.log(chalk.gray(`Focus mode: ${this.settings.focusMode ? 'ON (no other chat notifications)' : 'OFF (other chat notifications enabled)'} - type /focus to toggle`));
    console.log(chalk.gray(`macOS notifications: ${this.settings.macosNotifications ? 'ON' : 'OFF'} - type /macos to toggle`));
    console.log(chalk.gray(`In-app notifications: ${this.settings.inAppNotifications ? 'ON' : 'OFF'} - type /inapp to toggle`));
    
    // Show recent messages
    await this.contactManager.showRecentMessages(chatEntity);

    while (this.contactManager.getCurrentChat() === chatEntity) {
      const message = await input.text(chalk.blue('You: '));

      if (message === '/back') {
        this.contactManager.clearCurrentChat();
        break;
      } else if (message === '/history') {
        await this.contactManager.showRecentMessages(chatEntity);
      } else if (message === '/focus') {
        this.settings.focusMode = !this.settings.focusMode;
        console.log(chalk.green(`🎯 Focus mode ${this.settings.focusMode ? 'enabled' : 'disabled'} - ${this.settings.focusMode ? 'no other chat notifications while chatting' : 'other chat notifications enabled'}`));
      } else if (message === '/macos') {
        this.settings.toggleMacosNotifications();
        console.log(chalk.green(`🍎 macOS notifications ${this.settings.macosNotifications ? 'enabled' : 'disabled'}`));
      } else if (message === '/inapp') {
        this.settings.toggleInAppNotifications();
        console.log(chalk.green(`📱 In-app notifications ${this.settings.inAppNotifications ? 'enabled' : 'disabled'}`));
      } else if (message.trim()) {
        await this.contactManager.sendMessage(chatEntity, message);
      }
    }
  }

  async startChannelMonitoring(channelEntity, channelName) {
    this.contactManager.setCurrentChat(channelEntity);
    
    console.log(chalk.green(`\n📢 Monitoring channel: ${channelName}`));
    console.log(chalk.gray('Type /back to return to menu, /history to see recent messages'));
    console.log(chalk.gray('You are now receiving real-time messages from this channel'));
    console.log(chalk.gray(`macOS notifications: ${this.settings.macosNotifications ? 'ON' : 'OFF'} - type /macos to toggle`));
    console.log(chalk.gray(`In-app notifications: ${this.settings.inAppNotifications ? 'ON' : 'OFF'} - type /inapp to toggle`));
    
    // Show recent messages
    await this.contactManager.showRecentMessages(channelEntity);

    while (this.contactManager.getCurrentChat() === channelEntity) {
      const command = await input.text(chalk.blue('Command: '));

      if (command === '/back') {
        this.contactManager.clearCurrentChat();
        break;
      } else if (command === '/history') {
        await this.contactManager.showRecentMessages(channelEntity);
      } else if (command === '/macos') {
        this.settings.toggleMacosNotifications();
        console.log(chalk.green(`🍎 macOS notifications ${this.settings.macosNotifications ? 'enabled' : 'disabled'}`));
      } else if (command === '/inapp') {
        this.settings.toggleInAppNotifications();
        console.log(chalk.green(`📱 In-app notifications ${this.settings.inAppNotifications ? 'enabled' : 'disabled'}`));
      } else if (command.trim()) {
        console.log(chalk.yellow('ℹ️ This is a channel - you can only monitor messages. Use /back to return to menu.'));
      }
    }
  }

  async run() {
    while (true) {
      await this.showMenu();
    }
  }
} 
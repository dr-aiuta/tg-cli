import chalk from 'chalk';
import input from 'input';

export class ContactManager {
  constructor(client) {
    this.client = client;
    this.contacts = new Map();
    this.currentChat = null;
    this.currentChatId = null;
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
      return { entity: contact.entity, name: contact.name };
    } else {
      console.log(chalk.red('❌ Invalid contact number'));
      return null;
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
      return { entity: dialog.entity, name: dialog.title || dialog.name };
    }
    return null;
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

  setCurrentChat(chatEntity) {
    this.currentChat = chatEntity;
    // Handle different entity types for proper ID extraction
    if (chatEntity?.className === 'Channel') {
      this.currentChatId = chatEntity.id?.toString();
    } else if (chatEntity?.className === 'Chat') {
      this.currentChatId = chatEntity.id?.toString();
    } else {
      this.currentChatId = chatEntity?.id?.toString();
    }
  }

  clearCurrentChat() {
    this.currentChat = null;
    this.currentChatId = null;
  }

  getCurrentChat() {
    return this.currentChat;
  }

  getCurrentChatId() {
    return this.currentChatId;
  }

  async selectChannel() {
    console.log(chalk.blue('\n📢 Available channels:'));
    const dialogs = await this.client.getDialogs({ limit: 50 });
    
    // Filter for channels only
    const channels = dialogs.filter(dialog => 
      dialog.entity?.className === 'Channel' || dialog.entity?.className === 'Chat'
    );
    
    if (channels.length === 0) {
      console.log(chalk.yellow('⚠️ No channels found. Make sure you are subscribed to some channels.'));
      return null;
    }
    
    channels.forEach((dialog, index) => {
      const name = dialog.title || dialog.name || 'Unknown';
      let typeIcon = '📢'; // Channel
      
      if (dialog.entity?.className === 'Channel') {
        typeIcon = dialog.entity.broadcast ? '📢' : '👥'; // Channel or Group
      } else if (dialog.entity?.className === 'Chat') {
        typeIcon = '👥'; // Group chat
      }
      
      console.log(`${index + 1}. ${typeIcon} ${name}`);
    });

    const channelNum = await input.text('\nEnter channel number to monitor (or press Enter to go back): ');
    if (channelNum && channels[parseInt(channelNum) - 1]) {
      const channel = channels[parseInt(channelNum) - 1];
      return { entity: channel.entity, name: channel.title || channel.name };
    }
    return null;
  }

  getContacts() {
    return this.contacts;
  }
} 
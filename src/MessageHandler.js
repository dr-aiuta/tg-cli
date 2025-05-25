import chalk from 'chalk';

export class MessageHandler {
  constructor(client, contactManager, settings) {
    this.client = client;
    this.contactManager = contactManager;
    this.settings = settings;
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
        
        // Handle both direct messages and channel messages
        let chatId = null;
        if (event.className === 'UpdateNewChannelMessage') {
          // For channel messages, use the channel ID
          chatId = msg.peerId?.channelId?.toString() || msg.chatId?.toString();
        } else {
          // For direct messages, use sender ID
          chatId = senderId;
        }
        
        // Check if this message is from the current chat/channel
        const isCurrentChat = this.contactManager.getCurrentChatId() && 
          (chatId === this.contactManager.getCurrentChatId() || senderId === this.contactManager.getCurrentChatId());
        
        // Show messages from current chat contact, or other contacts if not in focus mode
        const isFromCurrentContact = isCurrentChat;
        const isFromOtherContact = !isCurrentChat;
        
        const shouldNotify = !this.settings.quietMode && senderId !== myId && (
          isFromCurrentContact || // Always show messages from current chat
          (isFromOtherContact && (!this.settings.focusMode || !this.contactManager.getCurrentChat())) // Show others only if not in focus mode
        );
        
        if (shouldNotify) {
          // Get sender name from contacts or channel info
          let senderName = this.contactManager.getContacts().get(senderId)?.name;
          let channelName = '';
          
          // For channel messages, get both sender and channel info
          if (event.className === 'UpdateNewChannelMessage') {
            try {
              // Get channel info
              const channel = await this.client.getEntity(parseInt(chatId));
              channelName = channel.title || channel.username || 'Unknown Channel';
              
              // Get sender info if available
              if (senderId && senderId !== myId) {
                if (!senderName) {
                  try {
                    const user = await this.client.getEntity(parseInt(senderId));
                    senderName = user.firstName + (user.lastName ? ` ${user.lastName}` : '') || user.username || 'Unknown';
                  } catch {
                    senderName = 'Unknown';
                  }
                }
              } else {
                senderName = channelName; // Channel itself is the sender
              }
            } catch {
              channelName = 'Unknown Channel';
              senderName = senderName || 'Unknown';
            }
          } else {
            // For direct messages
            if (!senderName) {
              try {
                // Try to get user info
                const user = await this.client.getEntity(parseInt(senderId));
                senderName = user.firstName + (user.lastName ? ` ${user.lastName}` : '') || user.username || 'Unknown';
              } catch {
                senderName = 'Unknown';
              }
            }
          }
          
          // Add notification with timestamp
          const time = new Date().toLocaleTimeString();
          
          if (isFromCurrentContact) {
            // Highlight messages from current chat contact or channel
            if (event.className === 'UpdateNewChannelMessage') {
              const displayName = channelName && senderName !== channelName ? 
                `${senderName} in ${channelName}` : senderName;
              console.log(chalk.green(`\n📢 [${time}] ${displayName}: ${messageText}`));
            } else {
              console.log(chalk.green(`\n💬 [${time}] ${senderName}: ${messageText}`));
            }
          } else {
            // Regular notifications from other contacts or channels
            if (event.className === 'UpdateNewChannelMessage') {
              const displayName = channelName && senderName !== channelName ? 
                `${senderName} in ${channelName}` : senderName;
              console.log(chalk.magenta(`\n📢 [${time}] New message from ${displayName}: ${messageText}`));
            } else {
              console.log(chalk.magenta(`\n📨 [${time}] New message from ${senderName}: ${messageText}`));
            }
          }
          
          // Re-prompt if we're in a chat
          if (this.contactManager.getCurrentChat()) {
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
          let senderName = this.contactManager.getContacts().get(senderId)?.name || 'Unknown';
          const time = new Date().toLocaleTimeString();
          console.log(chalk.yellow(`\n✏️ [${time}] ${senderName} edited: ${msg.message}`));
          
          if (this.contactManager.getCurrentChat()) {
            process.stdout.write(chalk.blue('You: '));
          }
        }
      }
    } catch (error) {
      // Silently ignore edit handler errors
    }
  }

  setupEventHandlers() {
    this.client.addEventHandler(this.handleNewMessage.bind(this));
    this.client.addEventHandler(this.handleMessageEdit.bind(this));
  }
} 
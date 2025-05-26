import notifier from 'node-notifier';

export class NotificationManager {
  constructor(settings) {
    this.settings = settings;
  }

  /**
   * Show a macOS notification for an incoming message
   * @param {string} title - The notification title (sender name)
   * @param {string} message - The message content
   * @param {string} subtitle - Optional subtitle (channel name, etc.)
   */
  showMessageNotification(title, message, subtitle = '') {
    // Don't show notifications if in quiet mode
    if (this.settings.quietMode) {
      return;
    }

    // Truncate long messages for notification display
    const truncatedMessage = message.length > 100 ? 
      message.substring(0, 97) + '...' : message;

    const notificationOptions = {
      title: 'Telegram',
      subtitle: subtitle || title,
      message: truncatedMessage,
      sound: 'default', // Use default macOS notification sound
      icon: this.getAppIcon(), // Optional: app icon path
      timeout: 5, // Auto-dismiss after 5 seconds
      wait: false // Don't wait for user interaction
    };

    notifier.notify(notificationOptions, (err, response) => {
      if (err) {
        // Silently handle notification errors
        console.debug('Notification error:', err);
      }
    });
  }

  /**
   * Get the app icon path (optional)
   * @returns {string|null} Path to icon or null if not available
   */
  getAppIcon() {
    // You can add a custom icon here if desired
    // For now, we'll use the default system icon
    return null;
  }

  /**
   * Show notification for channel messages
   * @param {string} senderName - Name of the message sender
   * @param {string} channelName - Name of the channel
   * @param {string} message - The message content
   */
  showChannelMessageNotification(senderName, channelName, message) {
    const title = channelName;
    const subtitle = senderName !== channelName ? `${senderName} in ${channelName}` : channelName;
    this.showMessageNotification(title, message, subtitle);
  }

  /**
   * Show notification for direct messages
   * @param {string} senderName - Name of the message sender
   * @param {string} message - The message content
   */
  showDirectMessageNotification(senderName, message) {
    this.showMessageNotification(senderName, message);
  }
} 
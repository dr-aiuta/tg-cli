export class Settings {
  constructor() {
    // Separate notification settings
    this.macosNotifications = true; // macOS notifications for current chat/channel messages
    this.inAppNotifications = true; // CLI notifications for other chats/channels
    this.focusMode = true; // When true, no notifications while in a chat
  }

  // macOS notification controls
  toggleMacosNotifications() {
    this.macosNotifications = !this.macosNotifications;
    return this.macosNotifications;
  }

  setMacosNotifications(value) {
    this.macosNotifications = value;
  }

  // In-app notification controls
  toggleInAppNotifications() {
    this.inAppNotifications = !this.inAppNotifications;
    return this.inAppNotifications;
  }

  setInAppNotifications(value) {
    this.inAppNotifications = value;
  }

  // Focus mode controls (existing)
  toggleFocusMode() {
    this.focusMode = !this.focusMode;
    return this.focusMode;
  }

  setFocusMode(value) {
    this.focusMode = value;
  }

  // Legacy support for quietMode (maps to both notification types)
  get quietMode() {
    return !this.macosNotifications && !this.inAppNotifications;
  }

  set quietMode(value) {
    this.macosNotifications = !value;
    this.inAppNotifications = !value;
  }

  toggleQuietMode() {
    const newValue = !this.quietMode;
    this.quietMode = newValue;
    return newValue;
  }
} 
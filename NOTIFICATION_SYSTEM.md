# Notification System Documentation

## Overview

The Telegram CLI now features a sophisticated notification system that separates macOS system notifications from in-app CLI notifications based on the current chat context.

## Notification Types

### 1. macOS Notifications

- **Purpose**: System notifications for messages from the currently open chat or channel
- **When shown**: When you receive a message from the chat/channel you currently have open
- **Appearance**: Native macOS notification with sound
- **Control**: Can be toggled independently via settings menu or `/macos` command

### 2. In-App CLI Notifications

- **Purpose**: Text notifications within the CLI for messages from other chats/channels
- **When shown**: When you receive messages from chats/channels other than the one currently open
- **Appearance**: Colored text in the CLI (magenta for other chats)
- **Control**: Can be toggled independently via settings menu or `/inapp` command

## Key Features

### Current Chat Message Display

- **Always shown**: Messages from your current open chat/channel are ALWAYS displayed in the CLI, regardless of notification settings
- **Color coding**: Current chat messages appear in green
- **macOS notifications**: Optionally trigger system notifications (if enabled)

### Focus Mode

- **Purpose**: Controls whether in-app notifications from other chats appear while you're actively chatting
- **When ON**: No in-app notifications from other chats while you're in a conversation
- **When OFF**: In-app notifications from other chats will appear even while chatting
- **Note**: Does not affect current chat message display or macOS notifications

## Settings Control

### Main Menu

1. Go to "Notification settings" (option 5)
2. Toggle individual notification types:
   - macOS notifications (current chat)
   - In-app notifications (other chats)
   - Focus mode

### In-Chat Commands

While in any chat or channel, use these commands:

- `/macos` - Toggle macOS notifications
- `/inapp` - Toggle in-app notifications
- `/focus` - Toggle focus mode

## Notification Logic

```
Incoming Message
├── From current chat/channel?
│   ├── YES → Always display in CLI (green)
│   │        └── macOS notification (if enabled)
│   └── NO → In-app notification (if enabled AND focus allows)
│            └── Display in CLI (magenta)
```

## Settings Persistence

- Settings are maintained during the session
- Default values:
  - macOS notifications: ON
  - In-app notifications: ON
  - Focus mode: ON

## Backward Compatibility

- Legacy `quietMode` property still works and maps to both notification types
- Existing notification methods are preserved for compatibility

## Examples

### Scenario 1: Chatting with Alice

- Messages from Alice: Always shown in CLI + macOS notification (if enabled)
- Messages from Bob: In-app notification only (if enabled and focus allows)

### Scenario 2: Monitoring a Channel

- Messages from current channel: Always shown in CLI + macOS notification (if enabled)
- Messages from other chats: In-app notification only (if enabled and focus allows)

### Scenario 3: Focus Mode ON while chatting

- Current chat messages: Always shown + macOS notifications
- Other chat messages: No in-app notifications (but macOS notifications for current chat still work)

### Scenario 4: All notifications OFF

- Current chat messages: Still always shown in CLI (no macOS notifications)
- Other chat messages: Not shown at all

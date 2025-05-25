# Telegram CLI

A minimalist command-line interface for Telegram that allows you to chat with contacts and receive updates using your personal account.

## Features

- 💬 Chat with your contacts
- 📱 View recent conversations (contacts, groups, channels)
- 📨 Real-time message notifications with timestamps
- 🔐 Secure authentication with your personal account
- 💾 Automatic session persistence (no re-authentication needed)
- 🎨 Colorful and intuitive interface
- 📢 Channel and group support with type indicators
- ⚡ Long polling for instant message delivery (no webhooks needed)

## Setup

### 1. Get Telegram API Credentials

1. Go to [my.telegram.org](https://my.telegram.org)
2. Log in with your phone number
3. Go to "API Development Tools"
4. Create a new application
5. Note down your `api_id` and `api_hash`

### 2. Install Dependencies

```bash
npm install
```

### 3. Run the Application

```bash
npm start
```

## First Time Setup

When you run the app for the first time:

1. Enter your `API ID` and `API Hash`
2. Enter your phone number (with country code, e.g., +1234567890)
3. Enter the verification code sent to your Telegram app
4. If you have 2FA enabled, enter your password

**Important**: The app automatically saves your session after successful login. Future runs will log in automatically without asking for credentials again.

## Usage

### Main Menu Options

1. **List contacts** - View all your Telegram contacts
2. **Chat with contact** - Start a conversation with a specific contact
3. **List recent chats** - View and open recent conversations (including channels/groups)
4. **Exit** - Close the application

### Chat Commands

- Type your message and press Enter to send
- `/back` - Return to main menu
- `/history` - Show recent messages in current chat

### Real-time Notifications

The app will show timestamped notifications for new messages from other chats while you're using it. No webhooks needed - uses efficient long polling.

## Tips

- The app works with personal accounts, groups, and channels
- Messages are displayed with timestamps and sender names
- Use the recent chats option to access channels and group conversations
- Icons show chat types: 👤 (users), 👥 (groups), 📢 (channels)
- Session is automatically saved in `.telegram-session` file
- The app uses long polling for real-time updates (no server setup needed)

## Security

- Never share your API credentials or `.telegram-session` file
- The session file is equivalent to being logged into your account
- Add `.telegram-session` to your `.gitignore` (already included)
- Log out from the Telegram app's active sessions if you lose access to your session file

## Troubleshooting

- If you get authentication errors, make sure your API credentials are correct
- For "flood wait" errors, wait a few minutes before trying again
- If messages don't load, check your internet connection and try again

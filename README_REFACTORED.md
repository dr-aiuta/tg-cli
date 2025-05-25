# Telegram CLI - Refactored Architecture

This document describes the refactored architecture of the Telegram CLI application.

## Project Structure

```
tg-cli/
├── index.js                    # Entry point
├── src/
│   ├── TelegramCLI.js         # Main orchestrator class
│   ├── SessionManager.js      # Session loading/saving
│   ├── ContactManager.js      # Contact, chat and channel management
│   ├── MessageHandler.js      # Incoming message handling
│   ├── MenuManager.js         # CLI menu and interactions
│   └── utils/
│       └── Settings.js        # Application settings
├── package.json
└── README.md
```

## Architecture Overview

The application has been refactored into a modular architecture with clear separation of concerns:

### Core Classes

#### 1. TelegramCLI (Main Orchestrator)

- **File**: `src/TelegramCLI.js`
- **Purpose**: Main entry point that coordinates all other components
- **Responsibilities**:
  - Initialize Telegram client
  - Coordinate session management
  - Set up and connect all managers
  - Handle application startup flow

#### 2. SessionManager

- **File**: `src/SessionManager.js`
- **Purpose**: Handle Telegram session persistence
- **Responsibilities**:
  - Load saved sessions from disk
  - Save new sessions for future use
  - Handle session file I/O operations

#### 3. ContactManager

- **File**: `src/ContactManager.js`
- **Purpose**: Manage contacts, chats, channels, and messaging
- **Responsibilities**:
  - Load and store user contacts
  - Handle chat and channel selection and management
  - Send messages and display chat history
  - Manage current chat/channel state
  - Filter and display available channels and groups

#### 4. MessageHandler

- **File**: `src/MessageHandler.js`
- **Purpose**: Handle incoming Telegram events
- **Responsibilities**:
  - Process new message events
  - Handle message edit events
  - Manage notification logic based on settings
  - Set up event handlers with Telegram client

#### 5. MenuManager

- **File**: `src/MenuManager.js`
- **Purpose**: Handle CLI user interface and interactions
- **Responsibilities**:
  - Display main menu
  - Handle user input and navigation
  - Coordinate chat sessions
  - Manage menu flow and user commands

#### 6. Settings

- **File**: `src/utils/Settings.js`
- **Purpose**: Manage application settings
- **Responsibilities**:
  - Store quiet mode and focus mode settings
  - Provide methods to toggle settings
  - Centralize configuration management

## Key Benefits of Refactoring

### 1. **Separation of Concerns**

Each class has a single, well-defined responsibility, making the code easier to understand and maintain.

### 2. **Modularity**

Components are loosely coupled and can be modified independently without affecting other parts of the system.

### 3. **Testability**

Each class can be unit tested in isolation, improving code quality and reliability.

### 4. **Maintainability**

Bugs and features can be localized to specific modules, making development more efficient.

### 5. **Extensibility**

New features can be added by extending existing classes or adding new modules without major refactoring.

## Data Flow

1. **Startup**: `index.js` → `TelegramCLI.init()`
2. **Session Management**: `TelegramCLI` → `SessionManager`
3. **Client Setup**: `TelegramCLI` creates Telegram client
4. **Component Initialization**: `TelegramCLI` creates and connects all managers
5. **Event Handling**: `MessageHandler` processes incoming events
6. **User Interface**: `MenuManager` handles user interactions
7. **Chat Management**: `ContactManager` manages contacts and messaging

## Usage

The refactored application maintains the same user interface and functionality as the original, but with improved code organization:

```bash
npm start
```

### Features

1. **List contacts** - View all your Telegram contacts
2. **Chat with contact** - Start a conversation with a specific contact
3. **List recent chats** - View and open recent conversations
4. **Open channel** - Monitor messages from Telegram channels and groups
5. **Toggle notifications** - Enable/disable message notifications
6. **Exit** - Close the application

### Channel Monitoring

The new channel monitoring feature allows you to:

- View all available channels and groups you're subscribed to
- Select a specific channel to monitor
- Receive real-time messages from the selected channel
- View recent message history from the channel
- Use `/back` to return to the main menu
- Use `/history` to view recent messages again

## Future Enhancements

The modular architecture makes it easy to add new features:

- **Database Integration**: Add a `DatabaseManager` for persistent storage
- **Plugin System**: Create a plugin architecture for extensible functionality
- **Configuration Management**: Enhance `Settings` with file-based configuration
- **Logging**: Add a `Logger` class for better debugging and monitoring
- **API Layer**: Create REST API endpoints for web interface integration

## Development Guidelines

When extending the application:

1. **Single Responsibility**: Each class should have one clear purpose
2. **Dependency Injection**: Pass dependencies through constructors
3. **Error Handling**: Handle errors gracefully within each module
4. **Documentation**: Document public methods and complex logic
5. **Testing**: Write unit tests for new functionality

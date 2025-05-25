export class Settings {
  constructor() {
    this.quietMode = false; // Toggle for reducing notification spam
    this.focusMode = true; // When true, no notifications while in a chat
  }

  toggleQuietMode() {
    this.quietMode = !this.quietMode;
    return this.quietMode;
  }

  toggleFocusMode() {
    this.focusMode = !this.focusMode;
    return this.focusMode;
  }

  setQuietMode(value) {
    this.quietMode = value;
  }

  setFocusMode(value) {
    this.focusMode = value;
  }
} 
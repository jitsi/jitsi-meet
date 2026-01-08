export interface IKeyboardShortcut {

    // whether or not the alt key must be pressed
    alt?: boolean;

    // the character to be pressed that triggers the action
    character: string;

    // the function to be executed when the shortcut is pressed
    handler: Function;

    // character to be displayed in the help dialog shortcuts list
    helpCharacter?: string;

    // help description of the shortcut, to be displayed in the help dialog
    helpDescription?: string;
}

export interface IKeyboardShortcutsState {
    enabled: boolean;
    shortcuts: Map<string, IKeyboardShortcut>;
    shortcutsHelp: Map<string, string>;
}

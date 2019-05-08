// @flow

export const DEFAULT_TYPE = 'text';

/**
 * Replresents a message token, that has a type based on what our app supports.
 */
export default class Token {
    type: string;
    content: string;

    /**
     * Constructs a new instance of the token based on the message part it receives.
     *
     * @param {string} messagePart - A message part (token) of the priginal message.
     * @param {?string} type - The type of the token, if known.
     */
    constructor(messagePart: string, type: ?string) {
        this.type = type || DEFAULT_TYPE;
        this.content = messagePart;
    }
}

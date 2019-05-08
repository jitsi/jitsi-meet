// @flow

import Token, { DEFAULT_TYPE } from './Token';

/**
 * A generic tokenizer to do RegExp based tokenization of a string.
 */
export default class Tokenizer {
    _tokenizerPattern: string;
    _type: string;

    /**
     * Instantiates a new tokenizer.
     *
     * @param {string} type - The type of the tokenizer (e.g. 'link', 'emoji').
     * @param {string} tokenizerPattern - Pattern to base the input tokenization on.
     */
    constructor(type: string, tokenizerPattern: string) {
        this._type = type;
        this._tokenizerPattern = tokenizerPattern;
    }

    /**
     * Processes a list of tokens based on what type of tokens this instance supports.
     *
     * Two types of tokens will be present in the result array.
     *
     * 1. Tokens that this tokenizer identifies as its own type.
     * 2. Unprocessed tokens to be processed by further tokenizers in the chain.
     *
     * @param {Array<Token>} tokens - The list of tokens processed by the previous entries of the tokenizer chain.
     * @returns {Array<Token>}
     */
    _process(tokens: Array<Token>): Array<Token> {
        let processedTokens = [];

        for (const token of tokens) {
            processedTokens = processedTokens.concat(this._processToken(token));
        }

        return processedTokens;
    }

    /**
     * Processes a single token and returns an array of tokens.
     *
     * @param {Token} token - A single token.
     * @returns {Array<Token>}
     */
    _processToken(token: Token) {
        const processedTokens = [];

        if (token.type === DEFAULT_TYPE) {
            const tokenizerRegExp = new RegExp(this._tokenizerPattern, 'gi');
            let matchEndIndex = 0;
            let match = tokenizerRegExp.exec(token.content);

            while (match) {
                // Adding the token content pre the match unprocessed
                processedTokens.push(new Token(token.content.substring(matchEndIndex, match.index)));

                // Then add the parsed token
                processedTokens.push(new Token(match[0], this._type));

                matchEndIndex = tokenizerRegExp.lastIndex;

                // And go on...
                match = tokenizerRegExp.exec(token.content);
            }

            if (token.content.length > matchEndIndex + 1) {
                // Adding the remaining token content into the processed tokens unprocessed;
                processedTokens.push(new Token(token.content.substring(matchEndIndex)));
            }
        } else {
            // This token is already identified by a previous tokenizer in the chain,
            // a new tokenizer may not process it again.
            processedTokens.push(token);
        }

        return processedTokens;
    }

    /**
     * Tokenizes a string message.
     *
     * @param {string} message - The string message to tokenize.
     * @returns {Array<Token>}
     */
    static tokenize(message: string): Array<Token> {
        // Construct an initial array of tokens with a single entry, that we'll feed the tokenizer chain with.
        let tokenizedArray = [
            new Token(message)
        ];

        const SUPPORTED_TOKENIZERS = [

            // Link tokenizer
            new Tokenizer('link', 'https?://(?:[^., ]|[.,](?=\\w))+')

            // Further tokenizers to come here later
            // Such as emoji, emphasized words...etc
        ];

        // Then we run the array through a chain of tokenizers to process further based on what they support.
        // The return array always overwrites the previous result and serves as the input array for the next tokenizer
        // in the chain, if any.
        for (const tokenizer of SUPPORTED_TOKENIZERS) {
            tokenizedArray = tokenizer._process(tokenizedArray);
        }

        return tokenizedArray;

    }
}

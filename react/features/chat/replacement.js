import { regexes } from './smileys';

/* eslint-disable no-useless-escape, max-len */
const replacePatterns = {

    // URLs starting with http://, https://, or ftp://
    '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>':
        /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim,

    // URLs starting with "www." (without // before it, or it'd re-link the ones done above).
    '$1<a href="https://$2" target="_blank" rel="noopener noreferrer">$2</a>':
        /(^|[^\/])(www\.[\S]+(\b|$))/gim,

    // Change email addresses to mailto: links.
    '<a href="mailto:$1">$1</a>':
        /(([a-zA-Z0-9\-\_\.])+@[a-zA-Z\_]+?(\.[a-zA-Z]{2,6})+)/gim
};
/* eslint-enable no-useless-escape, max-len */

/**
 * Processes links and smileys in "body".
 *
 * @param  {string} body - The message body.
 * @returns {string} Message body with image tags and href tags.
 */
export function processReplacements(body) {
    // make links clickable + add smileys

    // non of the patterns we search contains a space, that's why we tokenize it
    // and after processing each token we join it again with the results
    // making sure we do only one replacement for a token
    const tokens = body.split(' ');
    const resultText = [];

    for (const token of tokens) {
        let replacedText;
        const tokenLength = token.length;

        for (const newString in replacePatterns) { // eslint-disable-line guard-for-in, max-len
            const replacePattern = replacePatterns[newString];

            replacedText = token.replace(replacePattern, newString);

            // replacement was done, stop doing any other replacements
            if (replacedText.length > tokenLength) {
                break;
            }
            replacedText = null;
        }

        // no replacement was done, then just check for smiley
        if (!replacedText) {
            replacedText = smilify(token);
        }

        resultText.push(replacedText);
    }

    return resultText.join(' ');
}

/**
 * Replaces common smiley strings with images.
 *
 * @param  {string} body - The message body.
 * @returns {string} Body returned with smiley replaced.
 */
function smilify(body) {
    if (!body) {
        return body;
    }

    let formattedBody = body;

    for (const smiley in regexes) {
        if (regexes.hasOwnProperty(smiley)) {
            formattedBody = formattedBody.replace(regexes[smiley],
                `<img class="smiley" src="images/smileys/${smiley}.svg">`);
        }
    }

    return formattedBody;
}

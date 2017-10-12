import { regexes } from './smileys';

/**
 * Processes links and smileys in "body"
 */
export function processReplacements(body) {
    // make links clickable + add smileys
    return smilify(linkify(body));
}

/**
 * Finds and replaces all links in the links in "body"
 * with their <a href=""></a>
 */
export function linkify(inputText) {
    let replacedText;

    /* eslint-disable no-useless-escape, max-len */

    // URLs starting with http://, https://, or ftp://
    const replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;

    replacedText = inputText.replace(replacePattern1, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');

    // URLs starting with "www." (without // before it, or it'd re-link the ones done above).
    const replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;

    replacedText = replacedText.replace(replacePattern2, '$1<a href="https://$2" target="_blank" rel="noopener noreferrer">$2</a>');

    // Change email addresses to mailto: links.
    const replacePattern3 = /(([a-zA-Z0-9\-\_\.])+@[a-zA-Z\_]+?(\.[a-zA-Z]{2,6})+)/gim;

    replacedText = replacedText.replace(replacePattern3, '<a href="mailto:$1">$1</a>');

    /* eslint-enable no-useless-escape */

    return replacedText;
}

/**
 * Replaces common smiley strings with images
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

    return body;
}

/**
 * Check if the string is an aeternity account nubmer or chain name.
 *
* @param {string} str - String to check.
* @returns {boolean}
 */
export function isAccountOrChainName(str) {
    const regExp = /^ak_[A-Za-z0-9]{48,50}$|^[A-Za-z0-9]+\.chain$/;

    return regExp.test(str);
}

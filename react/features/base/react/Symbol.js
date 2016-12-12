// FIXME React Native does not polyfill Symbol at versions 0.39.2 or earlier.
export default (global => {
    let s = global.Symbol;

    if (typeof s === 'undefined') {
        // XXX At the time of this writing we use Symbol only as a way to
        // prevent collisions in Redux action types. Consequently, the Symbol
        // implementation provided bellow is minimal and specific to our
        // purpose.
        s = description => (description || '').split('');
    }

    return s;
})(global || window || this); // eslint-disable-line no-invalid-this

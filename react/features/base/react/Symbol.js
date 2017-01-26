// FIXME React Native does not polyfill Symbol at versions 0.39.2 or earlier.
export default (global => {
    let clazz = global.Symbol;

    if (typeof clazz === 'undefined') {
        // XXX At the time of this writing we use Symbol only as a way to
        // prevent collisions in Redux action types. Consequently, the Symbol
        // implementation provided bellow is minimal and specific to our
        // purpose.
        const toString = function() {
            return this.join(''); // eslint-disable-line no-invalid-this
        };

        clazz = description => {
            const thiz = (description || '').split('');

            thiz.toString = toString;

            return thiz;
        };
    }

    return clazz;
})(global || window || this); // eslint-disable-line no-invalid-this

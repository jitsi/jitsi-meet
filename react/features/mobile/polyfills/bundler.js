(global => {

    // __filename
    if (typeof global.__filename === 'undefined') {
        global.__filename = '__filename';
    }

})(global || window || this); // eslint-disable-line no-invalid-this

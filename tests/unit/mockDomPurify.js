const mockInstance = {
    addHook: () => {},
    removeHook: () => {},
    sanitize: (s) => s,
    isSupported: true
};

function dompurify() {
    return mockInstance;
}

Object.assign(dompurify, mockInstance);
dompurify.default = dompurify;

module.exports = dompurify;

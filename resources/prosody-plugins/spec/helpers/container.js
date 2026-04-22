let _container;

export function setContainer(c) {
    _container = c;
}

export function getContainer() {
    if (!_container) throw new Error('Container not initialised — is setup.js loaded?');
    return _container;
}

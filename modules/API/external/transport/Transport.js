export default class Transport {
    constructor({ window }) {
        this.window = window;
    }

    send(message) {
        throw new Error('send() must be implemented');
    }

    setListener(handler) {
        throw new Error('setListener() must be implemented');
    }
}
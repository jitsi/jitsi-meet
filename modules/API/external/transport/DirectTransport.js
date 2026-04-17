import Transport from './Transport';

export default class DirectTransport extends Transport {
    send(message) {
        // Direct call simulation (for now fallback to postMessage)
        this.window.postMessage(message, '*');
    }

    setListener(handler) {
        window.addEventListener('message', handler);
    }
}
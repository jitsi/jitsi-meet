import Transport from './Transport';

export default class IframeTransport extends Transport {
    send(message) {
        this.window.postMessage(message, '*');
    }

    setListener(handler) {
        window.addEventListener('message', handler);
    }
}
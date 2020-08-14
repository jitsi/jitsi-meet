// eslint-disable-next-line max-len
import browserWindowMessageConnection from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-window-message';

import { isInIframe } from './../../aeternity/utils';

const sendRoomNameSignal = async function(room) {
    if (isInIframe()) {
        const connection = await browserWindowMessageConnection();

        connection.sendMessage({ room });

        return;
    }
};

export default sendRoomNameSignal;

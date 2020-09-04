import {
    ENABLE_PREJOIN_PAGE,
    INIT_WEB_SOCKET,
    DISCONNECT_WEB_SOCKET
} from './actionTypes';
import { Sockets } from '../../../service/Websocket/socket';

export function enablePreJoinPage(enablePreJoinPage: ?boolean) {
    return {
        type: ENABLE_PREJOIN_PAGE,
        enablePreJoinPage
    };
}

export function initWebSocket(socketJwtPayload, socket_host, ws_token, onMessageUpdateListener) {
    let socket;
    if (socketJwtPayload) {
        socket = new Sockets({
            socket_host: socket_host,
            ws_token: ws_token
        });
        socket.onMessageUpdateListener = onMessageUpdateListener;
    }
    return {
        type: INIT_WEB_SOCKET,
        socket
    };
}

export function disconnectSocket() {
    return (dispatch: Function, getState: Function) => {
        const state = getState();
        state['features/prejoin'].socket.disconnect();
        dispatch({
            type: DISCONNECT_WEB_SOCKET
        });
    };
}

// @flow
/* eslint-disable require-jsdoc,max-len,camelcase*/

import { Component } from 'react';

import { Socket } from '../../../../service/Websocket/socket';
import { createWaitingAreaParticipantStatusChangedEvent, sendAnalytics } from '../../analytics';
import { getLocalParticipantInfoFromJwt, getLocalParticipantType } from '../../base/participants/functions';
import { connect } from '../../base/redux';
import { playSound as playSoundAction } from '../../base/sounds';
import { sleep } from '../../base/util/helpers';
import {
    setJaneWaitingAreaAuthState as setJaneWaitingAreaAuthStateAction,
    updateRemoteParticipantsStatuses as updateRemoteParticipantsStatusesAction,
    updateRemoteParticipantsStatusesFromSocket as updateRemoteParticipantsStatusesFromSocketAction
    , joinConference as joinConferenceAction
} from '../actions';
import {
    checkRoomStatus,
    getRemoteParticipantsStatuses, isRNSocketWebView,
    updateParticipantReadyStatus,
    sendMessageToIosApp
} from '../functions';
import {
    WAITING_AREA_NOTIFICATION_SOUND_ID
} from '../sound';


type Props = {
    t: Function,
    participantType: string,
    participant: Object,
    isRNWebViewPage: boolean,
    updateRemoteParticipantsStatusesFromSocket: Function,
    updateRemoteParticipantsStatuses: Function,
    playSound: Function,
    joinConference: Function,
    setJaneWaitingAreaAuthState: Function,
    remoteParticipantsStatuses: any
};

class SocketConnection extends Component<Props> {

    socket: Object;

    constructor(props) {
        super(props);
        this.socket = null;
    }

    componentDidMount() {
        const { isRNWebViewPage } = this.props;

        if (isRNWebViewPage) {
            sendMessageToIosApp({ message: 'webview page is ready' });
        } else {
            window.APP.waitingArea.status = 'initialized';
            updateParticipantReadyStatus('waiting');

            // When the user closes the window or quits the browser,
            // We send a "left waiting room" signal to Jane here
            const unloadHandler = () => {
                if (window.APP.waitingArea.status === 'initialized') {
                    window.APP.waitingArea.status = 'left';
                    updateParticipantReadyStatus('left');
                    sendAnalytics(createWaitingAreaParticipantStatusChangedEvent('left'));

                    // sleep here to ensure the above code can be executed when the browser window is closed.
                    sleep(2000);
                }
            };

            window.addEventListener('beforeunload', unloadHandler);
            window.addEventListener('unload', unloadHandler);
        }
        this._connectSocket();
    }

    componentDidUpdate() {
        const { isRNWebViewPage, remoteParticipantsStatuses } = this.props;

        if (isRNWebViewPage && remoteParticipantsStatuses.length > 0) {
            sendMessageToIosApp({ message: { remoteParticipantsStatuses } });
        }
    }

    componentWillUnmount() {
        this.socket && this.socket.disconnect();
    }

    _playSound(remoteParticipantStatus) {
        const { participantType, playSound } = this.props;

        if (remoteParticipantStatus && remoteParticipantStatus.info) {
            const canPlay
                = (participantType === 'Patient' && remoteParticipantStatus.info.status === 'joined')
                || (participantType === 'StaffMember' && remoteParticipantStatus.info.status === 'waiting');

            if (canPlay) {
                playSound(WAITING_AREA_NOTIFICATION_SOUND_ID);
            }
        }
    }

    _onMessageReceivedListener(event) {
        const { participantType, updateRemoteParticipantsStatusesFromSocket } = this.props;

        if (event.info && event.info.status && event.participant_type && (event.participant_type !== participantType)) {
            this._playSound(event);
            updateRemoteParticipantsStatusesFromSocket(event);
        }
    }

    _connectionStatusListener(status) {
        const { isRNWebViewPage, joinConference } = this.props;

        if (isRNWebViewPage) {
            sendMessageToIosApp({ message: status });
        }
        if (status && status.error) {
            joinConference();
        }
    }


    async _connectSocket() {
        const { participantType, isRNWebViewPage, updateRemoteParticipantsStatuses, joinConference, setJaneWaitingAreaAuthState } = this.props;

        try {
            const response = await checkRoomStatus();
            const remoteParticipantsStatuses = getRemoteParticipantsStatuses(response.participant_statuses, participantType);

            updateRemoteParticipantsStatuses(remoteParticipantsStatuses);

            this.socket = new Socket({
                socket_host: response.socket_host,
                ws_token: response.socket_token
            });
            this.socket.onMessageReceivedListener = this._onMessageReceivedListener.bind(this);
            this.socket.connectionStatusListener = this._connectionStatusListener.bind(this);
            this.socket.connect();
        } catch (error) {
            if (isRNWebViewPage) {
                sendMessageToIosApp({ message: error });
            } else if (error && error.error === 'Signature has expired') {
                setJaneWaitingAreaAuthState('failed');
            } else {
                joinConference();
            }
        }
    }

    render() {
        return null;
    }
}

function mapStateToProps(state): Object {
    const participant = getLocalParticipantInfoFromJwt(state);
    const participantType = getLocalParticipantType(state);
    const { locationURL } = state['features/base/connection'];
    const isRNWebViewPage = isRNSocketWebView(locationURL);
    const { remoteParticipantsStatuses } = state['features/jane-waiting-area'];

    return {
        participantType,
        participant,
        isRNWebViewPage,
        remoteParticipantsStatuses
    };
}

function mapDispatchToProps(dispatch) {
    return {
        updateRemoteParticipantsStatuses(status) {
            dispatch(updateRemoteParticipantsStatusesAction(status));
        },
        updateRemoteParticipantsStatusesFromSocket(status) {
            dispatch(updateRemoteParticipantsStatusesFromSocketAction(status));
        },
        playSound(soundId) {
            dispatch(playSoundAction(soundId));
        },
        joinConference() {
            dispatch(joinConferenceAction());
        },
        setJaneWaitingAreaAuthState(state) {
            dispatch(setJaneWaitingAreaAuthStateAction(state));
        }
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(SocketConnection);

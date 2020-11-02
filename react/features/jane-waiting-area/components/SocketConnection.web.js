// @flow
/* eslint-disable */

import { Component } from 'react';
import { connect } from '../../base/redux';
import {
    checkRoomStatus, getLocalParticipantFromJwt, getLocalParticipantType,
    getRemoteParticipantsReadyStatus, isRNSocketWebView,
    updateParticipantReadyStatus
} from '../functions';
import {
    updateRemoteParticipantsStatuses as updateRemoteParticipantsStatusesAction,
    updateRemoteParticipantsStatusesFromSocket as updateRemoteParticipantsStatusesFromSocketAction
} from '../actions';
import { Socket } from '../../../../service/Websocket/socket';
import jwtDecode from 'jwt-decode';
import { playSound as playSoundAction } from '../../base/sounds';
import {
    WAITING_AREA_NOTIFICATION_SOUND_ID
} from '../sound';
import { joinConference as joinConferenceAction } from '../actions';

type Props = {
    t: Function,
    jwt: string,
    jwtPayload: Object,
    participantType: string,
    participant: Object,
    isRNWebViewPage: boolean,
    updateRemoteParticipantsStatusesFromSocket: Function,
    updateRemoteParticipantsStatuses: Function,
    playSound: Function,
    joinConference: Function
};

class SocketConnection extends Component<Props> {

    socket: Object;

    constructor(props) {
        super(props);
        this.socket = {};
    }

    componentDidMount() {
        const { jwt, participant, participantType, isRNWebViewPage } = this.props;

        if (participantType === 'Patient') {
            updateParticipantReadyStatus(jwt, participantType, participant, 'waiting');
        }

        if (isRNWebViewPage) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ message: 'webview page is ready' }));
        } else {
            window.onunload = window.onbeforeunload = function () {
                updateParticipantReadyStatus(jwt, participantType, participant, 'left');
            };
        }
        this._connectSocket();
    }

    componentWillUnmount() {
        this.socket && this.socket.disconnect();
    }

    _playSound(remoteParticipantStatus) {
        const { participantType, playSound } = this.props;
        if (remoteParticipantStatus && remoteParticipantStatus.info) {
            const canPlay =
                (participantType === 'Patient' && remoteParticipantStatus.info.status === 'joined') ||
                (participantType === 'StaffMember' && remoteParticipantStatus.info.status === 'waiting');
            if (canPlay) {
                playSound(WAITING_AREA_NOTIFICATION_SOUND_ID);
            }
        }
    }

    _onMessageReceived(event) {
        const { participantType, isRNWebViewPage, updateRemoteParticipantsStatusesFromSocket } = this.props;

        if (event.info && event.info.status && event.participant_type && (event.participant_type !== participantType)) {
            if (isRNWebViewPage) {
                window.ReactNativeWebView
                    .postMessage(JSON.stringify({ message: { socketRemoteParticipantsEvent: event } }));
            } else {
                this._playSound(event);
                updateRemoteParticipantsStatusesFromSocket(event);
            }
        }
    }

    _connectionStatusListener(status) {
        const { isRNWebViewPage } = this.props;

        if (isRNWebViewPage) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ message: status }));
        } else {
            console.log(status);
        }
    }

    async _connectSocket() {
        const { jwt, participantType, isRNWebViewPage, updateRemoteParticipantsStatuses, joinConference } = this.props;

        try {
            const response = await checkRoomStatus(jwt);
            const remoteParticipantsStatuses = getRemoteParticipantsReadyStatus(response.participant_statuses, participantType);

            if (isRNWebViewPage) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ message: { remoteParticipantsStatuses } }));
            } else {
                updateRemoteParticipantsStatuses(remoteParticipantsStatuses);
            }

            this.socket = new Socket({
                socket_host: response.socket_host,
                ws_token: response.socket_token
            });
            this.socket.onMessageReceivedListener = this._onMessageReceived.bind(this);
            this.socket.connectionStatusListener = this._connectionStatusListener.bind(this);
            this.socket.connect();
        } catch (error) {
            if (isRNWebViewPage) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ message: { ...error } }));
            }
            window.APP.UI.notifyInternalError(error);
            joinConference();
            console.error(error);
        }
    }

    render() {
        return null;
    }
}

function mapStateToProps(state): Object {
    const { jwt } = state['features/base/jwt'];
    const jwtPayload = jwt && jwtDecode(jwt) || null;
    const participant = getLocalParticipantFromJwt(state);
    const participantType = getLocalParticipantType(state);
    const { locationURL } = state['features/base/connection'];
    const isRNWebViewPage = isRNSocketWebView(locationURL);

    return {
        jwt,
        jwtPayload,
        participantType,
        participant,
        isRNWebViewPage
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
        }
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(SocketConnection);

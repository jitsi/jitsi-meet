// @flow
/* eslint-disable */

import { Component } from 'react';

import { notifyBugsnag } from '../../../../bugsnag';
import { Socket } from '../../../../service/Websocket/socket';
import {
    createWaitingAreaModalEvent,
    createWaitingAreaParticipantStatusChangedEvent,
    createWaitingAreaSocketEvent,
    sendAnalytics
} from '../../analytics';
import {
    redirectToStaticPage
} from '../../app/actions';
import { getLocalParticipantInfoFromJwt, getLocalParticipantType } from '../../base/participants/functions';
import { connect } from '../../base/redux';
import { playSound as playSoundAction } from '../../base/sounds';
import { sleep } from '../../base/util/helpers';
import { showErrorNotification as showErrorNotificationAction } from '../../notifications';
import {
    setJaneWaitingAreaAuthState as setJaneWaitingAreaAuthStateAction,
    updateRemoteParticipantsStatuses as updateRemoteParticipantsStatusesAction,
    updateRemoteParticipantsStatusesFromSocket as updateRemoteParticipantsStatusesFromSocketAction
} from '../actions';
import { POLL_INTERVAL, REDIRECT_TO_WELCOME_PAGE_DELAY, CLOSE_BROWSER_DELAY } from '../constants';
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
    setJaneWaitingAreaAuthState: Function,
    remoteParticipantsStatuses: any,
    showErrorNotification: Function,
    redirectToWelcomePage: Function
};

class SocketConnection extends Component<Props> {

    socket: Object;

    interval: ?IntervalID;

    connectionAttempts: number;

    constructor(props) {
        super(props);
        this.socket = null;
        this.interval = undefined;
        this.connectionAttempts = 0;
    }

    componentDidMount() {
        const { isRNWebViewPage, participantType } = this.props;

        if (isRNWebViewPage) {
            sendMessageToIosApp({ message: 'webview page is ready' });
            // Temp fix to ensure the patient side will not miss the "joined" signal when initializing webview in ios app
            if (participantType === 'Patient') {
                setTimeout(() => {
                    this._fetchDataAndconnectSocket(true);
                }, 4000)
            }
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
                    sleep(CLOSE_BROWSER_DELAY);
                }
            };

            window.addEventListener('beforeunload', unloadHandler);
            window.addEventListener('unload', unloadHandler);
        }
        this._fetchDataAndconnectSocket();
    }

    componentDidUpdate() {
        const { isRNWebViewPage, remoteParticipantsStatuses } = this.props;

        if (isRNWebViewPage && remoteParticipantsStatuses.length > 0) {
            sendMessageToIosApp({ message: { remoteParticipantsStatuses } });
        }
    }

    componentWillUnmount() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = undefined;
        }
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
            updateRemoteParticipantsStatusesFromSocket(event);
            sendAnalytics(createWaitingAreaSocketEvent('message.received', event));
            this._playSound(event);
        }
    }

    _connectionStatusListener(status) {
        if (status && status.error && !this.interval) {
            sendAnalytics(createWaitingAreaSocketEvent('error', status.error));
            sendAnalytics(createWaitingAreaModalEvent('polling.started'));
            notifyBugsnag(status.error);
            console.log('socket fallback to polling');
            this._polling();
        }

        if (status && status.event === 'connected' && this.interval) {
            sendAnalytics(createWaitingAreaModalEvent('polling.stoped'));
            clearInterval(this.interval);
            this.interval = undefined
            this.connectionAttempts = 0;
        }
    }

    _redirectToWelcomePage() {
        const { redirectToWelcomePage } = this.props;

        // Wait 5 seconds before redirecting user to the welcome page
        setTimeout(() => {
            redirectToWelcomePage();
        }, REDIRECT_TO_WELCOME_PAGE_DELAY);
    }

    _polling() {
        this.interval
            = setInterval(
            () => {
                this._fetchDataAndconnectSocket();
            },
            POLL_INTERVAL);
    }

    async _fetchDataAndconnectSocket(fetchDataOnly = false) {
        const { participantType,
            isRNWebViewPage,
            updateRemoteParticipantsStatuses,
            setJaneWaitingAreaAuthState,
            showErrorNotification } = this.props;

        try {
            // fetch data
            const response = await checkRoomStatus();
            const remoteParticipantsStatuses = getRemoteParticipantsStatuses(response.participant_statuses, participantType);

            // This action will update the remote participant states in reducer
            updateRemoteParticipantsStatuses(remoteParticipantsStatuses);

            if (fetchDataOnly) {
                return;
            }

            if (this.socket) {
                this.socket.reconnect(response.socket_token);
            } else {
                this.socket = new Socket({
                    socket_host: response.socket_host,
                    ws_token: response.socket_token
                });
                this.socket.onMessageReceivedListener = this._onMessageReceivedListener.bind(this);
                this.socket.connectionStatusListener = this._connectionStatusListener.bind(this);
                this.socket.connect();
            }
        } catch (error) {
            if (this.connectionAttempts === 3) {
                if (isRNWebViewPage) {
                    sendMessageToIosApp({ message: error });
                } else if (error && error.error === 'Signature has expired') {
                    setJaneWaitingAreaAuthState('failed');
                }
                showErrorNotification({
                    description: error && error.error,
                    titleKey: 'janeWaitingArea.errorTitleKey'
                });

                // send event to datadog
                sendAnalytics(createWaitingAreaModalEvent('polling.stoped'));
                clearInterval(this.interval);
                this.interval = undefined
                return this._redirectToWelcomePage();
            }
            this.connectionAttempts++;
            this._fetchDataAndconnectSocket();
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
        setJaneWaitingAreaAuthState(state) {
            dispatch(setJaneWaitingAreaAuthStateAction(state));
        },
        showErrorNotification(error) {
            dispatch(showErrorNotificationAction(error));
        },
        redirectToWelcomePage() {
            dispatch(redirectToStaticPage('/'));
        }
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(SocketConnection);

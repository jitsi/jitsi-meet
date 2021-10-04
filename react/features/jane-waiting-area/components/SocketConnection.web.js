// @flow
/* eslint-disable require-jsdoc,max-len,camelcase*/

import { Component } from 'react';

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

    pollingRetries: number;

    constructor(props) {
        super(props);
        this.socket = null;
        this.interval = undefined;
        this.pollingRetries = 0;
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
        if (status && status.error) {
            sendAnalytics(createWaitingAreaSocketEvent('error', status.error));
            sendAnalytics(createWaitingAreaModalEvent('start.polling'));
            this._polling();
        }
    }

    _redirectToWelcomePage() {
        const { redirectToWelcomePage } = this.props;

        // Wait 5 seconds before redirecting user to the welcome page
        setTimeout(() => {
            redirectToWelcomePage();
        }, 5000);
    }

    _polling() {
        const { participantType, updateRemoteParticipantsStatuses, showErrorNotification, setJaneWaitingAreaAuthState, isRNWebViewPage } = this.props;

        this.interval
            = setInterval(
            async () => {
                try {
                    const response = await checkRoomStatus();
                    const remoteParticipantsStatuses = getRemoteParticipantsStatuses(response.participant_statuses, participantType);

                    updateRemoteParticipantsStatuses(remoteParticipantsStatuses);
                } catch (error) {
                    // If any error occurs while polling
                    if (this.pollingRetries === 3) {
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

                        // send error to bugsnag
                        console.error(error);
                        this._redirectToWelcomePage();
                    }
                    this.pollingRetries++;
                }
            },
            3000);
    }

    async _connectSocket() {
        const { participantType,
            isRNWebViewPage,
            updateRemoteParticipantsStatuses,
            setJaneWaitingAreaAuthState,
            showErrorNotification } = this.props;

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
            }
            showErrorNotification({
                description: error && error.error,
                titleKey: 'janeWaitingArea.errorTitleKey'
            });
            console.error(error);

            this._redirectToWelcomePage();
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

import i18n from 'i18next';
import { batch } from 'react-redux';

import { IStore } from '../app/types';
import { IStateful } from '../base/app/types';
import {
    CONFERENCE_JOINED,
    CONFERENCE_WILL_LEAVE,
    ENDPOINT_MESSAGE_RECEIVED,
    UPDATE_CONFERENCE_METADATA
} from '../base/conference/actionTypes';
import { IConferenceMetadata } from '../base/conference/reducer';
import { SET_CONFIG } from '../base/config/actionTypes';
import { CONNECTION_FAILED } from '../base/connection/actionTypes';
import { connect, setPreferVisitor } from '../base/connection/actions';
import { disconnect } from '../base/connection/actions.any';
import { openDialog } from '../base/dialog/actions';
import { JitsiConferenceEvents, JitsiConnectionErrors } from '../base/lib-jitsi-meet';
import { PARTICIPANT_UPDATED } from '../base/participants/actionTypes';
import { raiseHand } from '../base/participants/actions';
import {
    getLocalParticipant,
    getParticipantById,
    isLocalParticipantModerator
} from '../base/participants/functions';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import { toState } from '../base/redux/functions';
import { BUTTON_TYPES } from '../base/ui/constants.any';
import { hideNotification, showNotification } from '../notifications/actions';
import {
    NOTIFICATION_ICON,
    NOTIFICATION_TIMEOUT_TYPE,
    VISITORS_NOT_LIVE_NOTIFICATION_ID,
    VISITORS_PROMOTION_NOTIFICATION_ID
} from '../notifications/constants';
import { INotificationProps } from '../notifications/types';
import { open as openParticipantsPane } from '../participants-pane/actions';
import { joinConference } from '../prejoin/actions';

import { VisitorsListWebsocketClient } from './VisitorsListWebsocketClient';
import { SUBSCRIBE_VISITORS_LIST, UPDATE_VISITORS_IN_QUEUE_COUNT } from './actionTypes';
import {
    approveRequest,
    clearPromotionRequest,
    denyRequest,
    goLive,
    promotionRequestReceived,
    setInVisitorsQueue,
    setVisitorDemoteActor,
    setVisitorsSupported,
    updateVisitorsInQueueCount,
    updateVisitorsList
} from './actions';
import { JoinMeetingDialog } from './components';
import { getPromotionRequests, getVisitorsInQueueCount, isVisitorsListEnabled } from './functions';
import logger from './logger';
import { WebsocketClient } from './websocket-client';

MiddlewareRegistry.register(({ dispatch, getState }) => next => action => {
    switch (action.type) {
    case CONFERENCE_JOINED: {
        const { conference } = action;

        if (getState()['features/visitors'].iAmVisitor) {

            const { demoteActorDisplayName } = getState()['features/visitors'];

            if (demoteActorDisplayName) {
                const notificationParams: INotificationProps = {
                    titleKey: 'visitors.notification.title',
                    descriptionKey: 'visitors.notification.demoteDescription',
                    descriptionArguments: {
                        actor: demoteActorDisplayName
                    }
                };

                batch(() => {
                    dispatch(showNotification(notificationParams, NOTIFICATION_TIMEOUT_TYPE.STICKY));
                    dispatch(setVisitorDemoteActor(undefined));
                });
            } else {
                dispatch(openDialog(JoinMeetingDialog));
            }

        } else {
            dispatch(setVisitorsSupported(conference.isVisitorsSupported()));
            conference.on(JitsiConferenceEvents.VISITORS_SUPPORTED_CHANGED, (value: boolean) => {
                dispatch(setVisitorsSupported(value));
            });
        }

        conference.on(JitsiConferenceEvents.VISITORS_MESSAGE, (
                msg: { action: string; actor: string; from: string; id: string; nick: string; on: boolean; }) => {

            if (msg.action === 'demote-request') {
                // we need it before the disconnect
                const participantById = getParticipantById(getState, msg.actor);
                const localParticipant = getLocalParticipant(getState);

                if (localParticipant && localParticipant.id === msg.id) {
                    // handle demote
                    dispatch(disconnect(true))
                        .then(() => {
                            dispatch(setPreferVisitor(true));

                            // we need to set the name, so we can use it later in the notification
                            if (participantById) {
                                dispatch(setVisitorDemoteActor(participantById.name));
                            }

                            logger.info('Dispatching connect on demote request visitor message for local participant.');

                            return dispatch(connect());
                        });
                }
            } else if (msg.action === 'promotion-request') {
                const request = {
                    from: msg.from,
                    nick: msg.nick
                };

                if (msg.on) {
                    dispatch(promotionRequestReceived(request));
                } else {
                    dispatch(clearPromotionRequest(request));
                }
                _handlePromotionNotification({
                    dispatch,
                    getState
                });
            } else {
                logger.error('Unknown action:', msg.action);
            }
        });

        conference.on(JitsiConferenceEvents.VISITORS_REJECTION, () => {
            dispatch(raiseHand(false));
        });

        break;
    }
    case CONFERENCE_WILL_LEAVE: {
        WebsocketClient.getInstance().disconnect();
        VisitorsListWebsocketClient.getInstance().disconnect();
        break;
    }
    case SUBSCRIBE_VISITORS_LIST: {
        if (isVisitorsListEnabled(getState()) && !VisitorsListWebsocketClient.getInstance().isActive()) {
            _subscribeVisitorsList(getState, dispatch);
        }
        break;
    }
    case ENDPOINT_MESSAGE_RECEIVED: {
        const { data } = action;

        if (data?.action === 'promotion-response' && data.approved) {
            const request = getPromotionRequests(getState())
                .find((r: any) => r.from === data.id);

            request && dispatch(clearPromotionRequest(request));
        }
        break;
    }
    case CONNECTION_FAILED: {
        const { error } = action;

        if (error?.name !== JitsiConnectionErrors.NOT_LIVE_ERROR) {
            break;
        }

        const { hosts, visitors: visitorsConfig } = getState()['features/base/config'];
        const { locationURL } = getState()['features/base/connection'];

        if (!visitorsConfig?.queueService || !locationURL) {
            break;
        }

        // let's subscribe for visitor waiting queue
        const { room } = getState()['features/base/conference'];
        const { disableBeforeUnloadHandlers = false } = getState()['features/base/config'];
        const conferenceJid = `${room}@${hosts?.muc}`;
        const beforeUnloadHandler = () => {
            WebsocketClient.getInstance().disconnect();
        };

        WebsocketClient.getInstance()
            .connect(`wss://${visitorsConfig?.queueService}/visitor/websocket`,
                `/secured/conference/visitor/topic.${conferenceJid}`,
                msg => {
                    if ('status' in msg && msg.status === 'live') {
                        logger.info('The conference is now live!');


                        WebsocketClient.getInstance().disconnect()
                            .then(() => {
                                window.removeEventListener(
                                    disableBeforeUnloadHandlers ? 'unload' : 'beforeunload',
                                    beforeUnloadHandler);
                                let delay = 0;

                                // now let's connect to meeting
                                if ('randomDelayMs' in msg) {
                                    delay = msg.randomDelayMs;
                                }

                                if (WebsocketClient.getInstance().connectCount > 3) {
                                    // if we keep connecting/disconnecting, let's slow it down
                                    delay = 30 * 1000;
                                }

                                setTimeout(() => {
                                    logger.info('Dispatching joinConference on conference live event.');
                                    dispatch(joinConference());
                                    dispatch(setInVisitorsQueue(false));
                                }, Math.random() * delay);
                            });
                    }
                },

                getState()['features/base/jwt'].jwt,
                () => {
                    dispatch(setInVisitorsQueue(true));
                });

        /**
         * Disconnecting the WebSocket client when the user closes the page.
         */
        window.addEventListener(disableBeforeUnloadHandlers ? 'unload' : 'beforeunload', beforeUnloadHandler);


        break;
    }
    case PARTICIPANT_UPDATED: {
        const { metadata } = getState()['features/base/conference'];

        _handleQueueAndNotification(dispatch, getState, metadata);

        break;
    }
    case SET_CONFIG: {
        const result = next(action);
        const { preferVisitor } = action.config;

        if (preferVisitor !== undefined) {
            setPreferVisitor(preferVisitor);
        }

        return result;
    }
    case UPDATE_CONFERENCE_METADATA: {
        const { metadata } = action;

        _handleQueueAndNotification(dispatch, getState, metadata);

        break;
    }
    case UPDATE_VISITORS_IN_QUEUE_COUNT: {
        _showNotLiveNotification(dispatch, action.count);

        break;
    }
    }

    return next(action);
});

/**
 * Handles the queue connection and notification for visitors if needed.
 *
 * @param {IStore.dispatch} dispatch - The Redux dispatch function.
 * @param {IStore.getState} getState - The Redux getState function.
 * @param {IConferenceMetadata} metadata - The conference metadata.
 * @returns {void}
 */
function _handleQueueAndNotification(
        dispatch: IStore['dispatch'],
        getState: IStore['getState'],
        metadata: IConferenceMetadata | undefined): void {
    const { visitors: visitorsConfig } = toState(getState)['features/base/config'];

    if (!(visitorsConfig?.queueService && isLocalParticipantModerator(getState))) {
        return;
    }

    if (metadata?.visitors?.live === false) {
        if (!WebsocketClient.getInstance().isActive()) {
            // if metadata go live changes to goLive false and local is moderator
            // we should subscribe to the service if available to listen for waiting visitors
            _subscribeQueueStats(getState(), dispatch);
        }

        _showNotLiveNotification(dispatch, getVisitorsInQueueCount(getState));
    } else if (metadata?.visitors?.live) {
        dispatch(hideNotification(VISITORS_NOT_LIVE_NOTIFICATION_ID));
        WebsocketClient.getInstance().disconnect();
    }
}

/**
 * Shows a notification that the meeting is not live.
 *
 * @param {Dispatch} dispatch - The Redux dispatch function.
 * @param {number} count - The count of visitors waiting.
 * @returns {void}
 */
function _showNotLiveNotification(dispatch: IStore['dispatch'], count: number): void {
    // let's show notification
    dispatch(showNotification({
        titleKey: 'notify.waitingVisitorsTitle',
        descriptionKey: 'notify.waitingVisitors',
        descriptionArguments: {
            waitingVisitors: count
        },
        disableClosing: true,
        uid: VISITORS_NOT_LIVE_NOTIFICATION_ID,
        customActionNameKey: [ 'participantsPane.actions.goLive' ],
        customActionType: [ BUTTON_TYPES.PRIMARY ],
        customActionHandler: [ () => batch(() => {
            dispatch(hideNotification(VISITORS_NOT_LIVE_NOTIFICATION_ID));
            dispatch(goLive());
        }) ],
        icon: NOTIFICATION_ICON.PARTICIPANTS
    }, NOTIFICATION_TIMEOUT_TYPE.STICKY));
}

/**
 * Subscribe for moderator stats.
 *
 * @param {Function|Object} stateful - The redux store or {@code getState}
 * function.
 * @param {Dispatch} dispatch - The Redux dispatch function.
 * @returns {void}
 */
function _subscribeQueueStats(stateful: IStateful, dispatch: IStore['dispatch']) {
    const { hosts } = toState(stateful)['features/base/config'];
    const { room } = toState(stateful)['features/base/conference'];
    const conferenceJid = `${room}@${hosts?.muc}`;

    const { visitors: visitorsConfig } = toState(stateful)['features/base/config'];

    WebsocketClient.getInstance()
        .connect(`wss://${visitorsConfig?.queueService}/visitor/websocket`,
            `/secured/conference/state/topic.${conferenceJid}`,
            msg => {
                if ('visitorsWaiting' in msg) {
                    dispatch(updateVisitorsInQueueCount(msg.visitorsWaiting));
                }
            },
            toState(stateful)['features/base/jwt'].jwt);
}

/**
 * Subscribes to the visitors list via WebSocket for real-time updates. This function establishes a WebSocket
 * connection to track visitors in a conference.
 *
 * @param {IStore.getState} getState - Function to retrieve the current Redux state.
 * @param {IStore.dispatch} dispatch - Function to dispatch Redux actions.
 * @returns {void}
 */
function _subscribeVisitorsList(getState: IStore['getState'], dispatch: IStore['dispatch']) {
    const state = getState();
    const { visitors: visitorsConfig } = state['features/base/config'];
    const conference = state['features/base/conference'].conference;
    const meetingId = conference?.getMeetingUniqueId();
    const localParticipant = getLocalParticipant(state);
    const participantId = localParticipant?.id;

    if (!visitorsConfig?.queueService || !meetingId || !participantId) {
        logger.warn(`Missing required data for visitors list subscription', ${JSON.stringify({
            queueService: visitorsConfig?.queueService,
            meetingId,
            participantId: participantId ? 'participantId present' : 'participantId missing'
        })}`);

        return;
    }

    const queueEndpoint = `/secured/conference/visitors-list/queue/${meetingId}/${participantId}`;
    const topicEndpoint = `/secured/conference/visitors-list/topic/${meetingId}`;

    logger.debug('Starting visitors list subscription');

    VisitorsListWebsocketClient.getInstance()
        .connectVisitorsList(
            `wss://${visitorsConfig.queueService}/visitors-list/websocket`,
            queueEndpoint,
            topicEndpoint,
            // Initial list callback - replace entire list
            initialVisitors => {
                const visitors = initialVisitors.map(v => ({ id: v.r, name: v.n }));

                dispatch(updateVisitorsList(visitors));
            },
            // Delta updates callback - apply incremental changes
            updates => {
                let visitors = [ ...(getState()['features/visitors'].visitors ?? []) ];

                updates.forEach(u => {
                    if (u.s === 'j') {
                        const index = visitors.findIndex(v => v.id === u.r);

                        if (index === -1) {
                            visitors.push({ id: u.r, name: u.n });
                        } else {
                            visitors[index] = { id: u.r, name: u.n };
                        }
                    } else if (u.s === 'l') {
                        visitors = visitors.filter(v => v.id !== u.r);
                    }
                });

                dispatch(updateVisitorsList(visitors));
            },
            getState()['features/base/jwt'].jwt);
}

/**
 * Function to handle the promotion notification.
 *
 * @param {Object} store - The Redux store.
 * @returns {void}
 */
function _handlePromotionNotification(
        { dispatch, getState }: { dispatch: IStore['dispatch']; getState: IStore['getState']; }) {
    const requests = getPromotionRequests(getState());

    if (requests.length === 0) {
        dispatch(hideNotification(VISITORS_PROMOTION_NOTIFICATION_ID));

        return;
    }

    let notificationTitle;
    let customActionNameKey;
    let customActionHandler;
    let customActionType;
    let descriptionKey;
    let icon;

    if (requests.length === 1) {
        const firstRequest = requests[0];

        descriptionKey = 'notify.participantWantsToJoin';
        notificationTitle = firstRequest.nick;
        icon = NOTIFICATION_ICON.PARTICIPANT;
        customActionNameKey = [ 'participantsPane.actions.admit', 'participantsPane.actions.reject' ];
        customActionType = [ BUTTON_TYPES.PRIMARY, BUTTON_TYPES.DESTRUCTIVE ];
        customActionHandler = [ () => batch(() => {
            dispatch(hideNotification(VISITORS_PROMOTION_NOTIFICATION_ID));
            dispatch(approveRequest(firstRequest));
        }),
        () => batch(() => {
            dispatch(hideNotification(VISITORS_PROMOTION_NOTIFICATION_ID));
            dispatch(denyRequest(firstRequest));
        }) ];
    } else {
        descriptionKey = 'notify.participantsWantToJoin';
        notificationTitle = i18n.t('notify.waitingParticipants', {
            waitingParticipants: requests.length
        });
        icon = NOTIFICATION_ICON.PARTICIPANTS;
        customActionNameKey = [ 'notify.viewVisitors' ];
        customActionType = [ BUTTON_TYPES.PRIMARY ];
        customActionHandler = [ () => batch(() => {
            dispatch(hideNotification(VISITORS_PROMOTION_NOTIFICATION_ID));
            dispatch(openParticipantsPane());
        }) ];
    }

    dispatch(showNotification({
        title: notificationTitle,
        descriptionKey,
        uid: VISITORS_PROMOTION_NOTIFICATION_ID,
        customActionNameKey,
        customActionType,
        customActionHandler,
        icon
    }, NOTIFICATION_TIMEOUT_TYPE.STICKY));
}

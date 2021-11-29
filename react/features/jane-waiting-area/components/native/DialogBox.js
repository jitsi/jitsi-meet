// @flow
/* eslint-disable require-jsdoc, react/no-multi-comp, react/jsx-handler-names*/
import jwtDecode from 'jwt-decode';
import _ from 'lodash';
import moment from 'moment';
import React, { Component } from 'react';
import { Image, Linking, Text, View, Clipboard } from 'react-native';
import { WebView } from 'react-native-webview';

import { createWaitingAreaModalEvent, createWaitingAreaPageEvent, sendAnalytics } from '../../../analytics';
import { connect as startConference } from '../../../base/connection';
import { getLocalizedDateFormatter, translate } from '../../../base/i18n';
import { getLocalParticipantFromJwt, getLocalParticipantType } from '../../../base/participants';
import { connect } from '../../../base/redux';
import {
    enableJaneWaitingArea,
    setJaneWaitingAreaAuthState,
    updateRemoteParticipantsStatuses
} from '../../actions';
import {
    checkLocalParticipantCanJoin,
    updateParticipantReadyStatus
} from '../../functions';

import { ActionButton } from './ActionButton';
import styles from './styles';

type DialogTitleProps = {
    participantType: string,
    localParticipantCanJoin: boolean,
    authState: string,
    t: Function
}

type DialogBoxProps = {
    joinConferenceAction: Function,
    startConferenceAction: Function,
    enableJaneWaitingAreaAction: Function,
    jwtPayload: Object,
    jwt: string,
    participantType: string,
    updateRemoteParticipantsStatusesAction: Function,
    setJaneWaitingAreaAuthStateAction: Function,
    locationURL: string,
    remoteParticipantsStatuses: Array<Object>,
    authState: string,
    localParticipantCanJoin: boolean,
    t: Function
};

type SocketWebViewProps = {
    onError: Function,
    onMessageUpdate: Function,
    locationURL: string
}

const getWebViewUrl = (locationURL: any) => {
    let uri = locationURL.href;

    uri = `${uri}&RNsocket=true`;

    return uri;
};

const SocketWebView = (props: SocketWebViewProps) => {
    const injectedJavascript = `(function() {
          window.postMessage = function(data) {
            window.ReactNativeWebView.postMessage(data);
          };
        })()`;

    return (<View
        style = { styles.socketView }>
        <WebView
            injectedJavaScript = { injectedJavascript }
            onError = { props.onError }
            onMessage = { props.onMessageUpdate }
            source = {{ uri: getWebViewUrl(props.locationURL) }}
            startInLoadingState = { false } />
    </View>);
};

class DialogBox extends Component<DialogBoxProps> {

    _joinConference: Function;
    _webviewOnError: Function;
    _return: Function;
    _onMessageUpdate: Function;
    _admitClient: Function;

    constructor(props) {
        super(props);
        this._joinConference = this._joinConference.bind(this);
        this._admitClient = this._admitClient.bind(this);
        this._webviewOnError = this._webviewOnError.bind(this);
        this._return = this._return.bind(this);
        this._onMessageUpdate = this._onMessageUpdate.bind(this);
    }

    componentDidMount() {
        const { jwt } = this.props;

        Clipboard.setString('');
        sendAnalytics(
            createWaitingAreaPageEvent('loaded', undefined));
        updateParticipantReadyStatus('waiting', jwt);
    }


    _webviewOnError(error) {
        try {
            throw new Error(error);
        } catch (e) {
            sendAnalytics(
                createWaitingAreaPageEvent('webview.error', {
                    error
                }));
            this._joinConference();
        }
    }

    componentDidUpdate(prevProps: DialogBoxProps): * {
        const { localParticipantCanJoin, participantType } = this.props;

        if (prevProps.localParticipantCanJoin !== localParticipantCanJoin
            && localParticipantCanJoin) {
            if (participantType === 'Patient') {
                setTimeout(() => {
                    this._joinConference();
                }, 2000);
            }
            if (participantType === 'StaffMember') {
                sendAnalytics(createWaitingAreaModalEvent('admit.button.enabled'));
            }
        }
    }

    componentWillUnmount(): * {
        const { updateRemoteParticipantsStatusesAction } = this.props;

        updateRemoteParticipantsStatusesAction([]);
    }

    _joinConference() {
        const { startConferenceAction, enableJaneWaitingAreaAction, jwt } = this.props;

        updateParticipantReadyStatus('joined', jwt);
        enableJaneWaitingAreaAction(false);
        startConferenceAction();
    }

    _admitClient() {
        sendAnalytics(createWaitingAreaModalEvent('admit.button.clicked'));
        this._joinConference();
    }

    _getStartDate() {
        const { jwtPayload } = this.props;
        const startAt = _.get(jwtPayload, 'context.start_at') ?? '';

        if (startAt) {
            return (<Text style = { styles.msgText }>
                {
                    getLocalizedDateFormatter(startAt)
                        .format('MMMM D, YYYY')
                }
            </Text>);
        }

        return null;
    }

    _getStartTimeAndEndTime() {
        const { jwtPayload } = this.props;
        const startAt = _.get(jwtPayload, 'context.start_at') ?? '';
        let endAt = _.get(jwtPayload, 'context.end_at') ?? '';
        const treatmentDuration = Number(_.get(jwtPayload, 'context.treatment_duration'));

        if (!startAt || !endAt) {
            return null;
        }

        if (treatmentDuration) {
            endAt = getLocalizedDateFormatter(startAt)
                .valueOf() + (treatmentDuration * 1000);
        }

        return (<Text style = { styles.msgText }>
            {
                `${getLocalizedDateFormatter(startAt)
                    .format('h:mm')} - ${getLocalizedDateFormatter(endAt)
                    .format('h:mm A')}`
            }
        </Text>);
    }

    _getDuration() {
        const { jwtPayload, t } = this.props;
        const startAt = _.get(jwtPayload, 'context.start_at');
        const endAt = _.get(jwtPayload, 'context.end_at');
        const treatmentDuration = _.get(jwtPayload, 'context.treatment_duration');
        let duration;

        if (treatmentDuration) {
            duration = Number(treatmentDuration) / 60;
        }

        if (startAt && endAt && !treatmentDuration) {
            const ms = getLocalizedDateFormatter(endAt)
                .valueOf() - getLocalizedDateFormatter(startAt)
                .valueOf();

            duration = moment.duration(ms).asMinutes();
        }

        if (!duration) {
            return null;
        }

        return (<Text style = { styles.msgText }>
            {
                t('janeWaitingArea.minutes', { duration })
            }
        </Text>);
    }

    _getBtnText() {
        const { participantType, t } = this.props;

        return participantType === 'StaffMember' ? t('janeWaitingArea.admitClient') : t('janeWaitingArea.begin');
    }

    _return() {
        const { jwtPayload, jwt } = this.props;
        const leaveWaitingAreaUrl = _.get(jwtPayload, 'context.leave_waiting_area_url') ?? '';

        sendAnalytics(
            createWaitingAreaPageEvent('return.button', {
                event: 'clicked'
            }));
        updateParticipantReadyStatus('left', jwt);
        Linking.openURL(leaveWaitingAreaUrl);
    }

    _parseJsonMessage(string) {
        try {
            return string && JSON.parse(string) && JSON.parse(string).message;
        } catch (e) {
            return null;
        }
    }

    _onMessageUpdate(event) {
        const { updateRemoteParticipantsStatusesAction, setJaneWaitingAreaAuthStateAction } = this.props;
        const webViewEvent = this._parseJsonMessage(event.nativeEvent.data);
        const remoteParticipantsStatuses = (webViewEvent && webViewEvent.remoteParticipantsStatuses) || null;

        webViewEvent && console.log(webViewEvent, 'incoming web view event');

        if (remoteParticipantsStatuses) {
            updateRemoteParticipantsStatusesAction(remoteParticipantsStatuses);
        }

        if (webViewEvent && webViewEvent.error) {
            sendAnalytics(
                createWaitingAreaPageEvent('webview.error', {
                    error: webViewEvent.error
                }));
            if (webViewEvent.error.error === 'Signature has expired') {
                setJaneWaitingAreaAuthStateAction('failed');
            } else {
                this._joinConference();
            }
        }
    }

    render() {
        const {
            participantType,
            jwtPayload,
            locationURL,
            localParticipantCanJoin,
            authState,
            t
        } = this.props;

        return (<View style = { styles.janeWaitingAreaContainer }>
            <View style = { styles.janeWaitingAreaDialogBoxWrapper }>
                <View style = { styles.janeWaitingAreaDialogBoxInnerWrapper }>
                    <View style = { styles.logoWrapper }>
                        <Image
                            source = { require('../../../../../images/jane_logo_72.png') }
                            style = { styles.logo } />
                    </View>
                    <View style = { styles.messageWrapper }>
                        {
                            <DialogTitleHeader
                                authState = { authState }
                                localParticipantCanJoin = { localParticipantCanJoin }
                                participantType = { participantType }
                                t = { t } />
                        }
                        {
                            <DialogTitleMsg
                                authState = { authState }
                                localParticipantCanJoin = { localParticipantCanJoin }
                                participantType = { participantType }
                                t = { t } />
                        }
                        <View style = { styles.infoDetailContainer }>
                            <Text style = { [ styles.msgText, styles.boldText ] }>
                                {
                                    jwtPayload && jwtPayload.context && jwtPayload.context.treatment
                                }
                            </Text>
                            <Text style = { [ styles.msgText, styles.boldText ] }>
                                {
                                    jwtPayload && jwtPayload.context && jwtPayload.context.practitioner_name
                                }
                            </Text>
                            {
                                this._getStartDate()
                            }
                            {
                                this._getStartTimeAndEndTime()
                            }
                            {
                                this._getDuration()
                            }
                        </View>
                    </View>
                </View>
                {
                    participantType === 'StaffMember' && <View style = { styles.actionButtonWrapper }>
                        {
                            authState !== 'failed'
                        && <ActionButton
                            containerStyle = { styles.joinButtonContainer }
                            disabled = { !localParticipantCanJoin }
                            onPress = { this._admitClient }
                            title = { this._getBtnText() }
                            titleStyle = { styles.joinButtonText } />
                        }
                        {
                            authState === 'failed'
                        && <ActionButton
                            onPress = { this._return }
                            title = { t('janeWaitingArea.returnToSchedule') } />
                        }
                    </View>
                }
                {
                    participantType === 'Patient' && authState === 'failed'
                    && <View style = { styles.actionButtonWrapper }>
                        <ActionButton
                            onPress = { this._return }
                            title = { t('janeWaitingArea.returnToAccount') } />
                    </View>
                }
            </View>
            <SocketWebView
                locationURL = { locationURL }
                onError = { this._webviewOnError }
                onMessageUpdate = { this._onMessageUpdate } />
        </View>);

    }
}

function mapStateToProps(state): Object {
    const { jwt } = state['features/base/jwt'];
    const jwtPayload = (jwt && jwtDecode(jwt)) || null;
    const participant = getLocalParticipantFromJwt(state);
    const participantType = getLocalParticipantType(state);
    const { locationURL } = state['features/base/connection'];
    const { remoteParticipantsStatuses, authState } = state['features/jane-waiting-area'];
    const localParticipantCanJoin = checkLocalParticipantCanJoin(state);

    return {
        jwt,
        jwtPayload,
        participantType,
        participant,
        locationURL,
        remoteParticipantsStatuses,
        authState,
        localParticipantCanJoin
    };
}

const mapDispatchToProps = {
    startConferenceAction: startConference,
    enableJaneWaitingAreaAction: enableJaneWaitingArea,
    updateRemoteParticipantsStatusesAction: updateRemoteParticipantsStatuses,
    setJaneWaitingAreaAuthStateAction: setJaneWaitingAreaAuthState
};

export default connect(mapStateToProps, mapDispatchToProps)(translate(DialogBox));

const DialogTitleHeader = (props: DialogTitleProps) => {
    const { participantType, authState, localParticipantCanJoin, t } = props;
    const tokenExpiredHeader = t('janeWaitingArea.authenticationExpired');
    let header;

    if (participantType === 'StaffMember') {
        if (localParticipantCanJoin) {
            header = t('janeWaitingArea.patientIsReady');
        } else {
            header = t('janeWaitingArea.waitClient');
        }
    } else {
        header = t('janeWaitingArea.waitPractitioner');
    }

    return (<Text
        style = { styles.title }>{ authState === 'failed' ? tokenExpiredHeader : header }</Text>);
};

const DialogTitleMsg = (props: DialogTitleProps) => {
    const { authState, localParticipantCanJoin, participantType, t } = props;
    const isStaffMember = participantType === 'StaffMember';

    if (authState === 'failed') {
        return null;
    }

    if (localParticipantCanJoin && isStaffMember) {
        return (<Text style = { styles.titleMsg }>
            {
                t('janeWaitingArea.whenYouAreReady')}
            }
        </Text>);
    }

    return <>
        <Text
            style = { styles.titleMsg }>
            {
                t('janeWaitingArea.keepAppOpen')
            }
        </Text>
        <Text
            style = { styles.titleMsg }>
            {
                t('janeWaitingArea.testYourDevice')
            }
        </Text>
        {
            !isStaffMember && <Text
                style = { styles.titleMsg }>
                {
                    t('janeWaitingArea.callWillBegin')
                }
            </Text>
        }
    </>;
};

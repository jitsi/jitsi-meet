// @flow
/* eslint-disable require-jsdoc, react/no-multi-comp, react/jsx-handler-names*/
import jwtDecode from 'jwt-decode';
import _ from 'lodash';
import moment from 'moment';
import React, { Component } from 'react';
import { Image, Linking, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { connect as startConference } from '../../base/connection';
import { getLocalizedDateFormatter } from '../../base/i18n';
import { getLocalParticipantFromJwt, getLocalParticipantType } from '../../base/participants';
import { connect } from '../../base/redux';
import {
    enableJaneWaitingArea,
    setJaneWaitingAreaAuthState,
    updateRemoteParticipantsStatuses
} from '../actions';
import {
    checkLocalParticipantCanJoin,
    updateParticipantReadyStatus
} from '../functions';

import { ActionButton } from './ActionButton.native';
import styles from './styles';


type DialogTitleProps = {
    participantType: string,
    localParticipantCanJoin: boolean,
    authState: string
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
    authState: string
};

type SocketWebViewProps = {
    onError: Function,
    onMessageUpdate: Function,
    locationURL: string
}

const getWebViewUrl = locationURL => {
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

    constructor(props) {
        super(props);
        this._joinConference = this._joinConference.bind(this);
        this._webviewOnError = this._webviewOnError.bind(this);
        this._return = this._return.bind(this);
        this._onMessageUpdate = this._onMessageUpdate.bind(this);
    }

    _webviewOnError(error) {
        console.log(error, 'webview error');
        this._joinConference();
    }

    _joinConference() {
        const { startConferenceAction, enableJaneWaitingAreaAction, jwt } = this.props;

        updateParticipantReadyStatus(jwt, 'joined');
        enableJaneWaitingAreaAction(false);
        startConferenceAction();
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
        const endAt = _.get(jwtPayload, 'context.end_at') ?? '';

        if (!startAt || !endAt) {
            return null;
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
        const { jwtPayload } = this.props;
        const startAt = _.get(jwtPayload, 'context.start_at') ?? '';
        const endAt = _.get(jwtPayload, 'context.end_at') ?? '';

        if (!startAt || !endAt) {
            return null;
        }
        const duration = getLocalizedDateFormatter(endAt)
            .valueOf() - getLocalizedDateFormatter(startAt)
            .valueOf();


        return (<Text style = { styles.msgText }>
            {
                `${moment.duration(duration)
                    .asMinutes()} Minutes`
            }
        </Text>);
    }

    _getBtnText() {
        const { participantType } = this.props;

        return participantType === 'StaffMember' ? 'Admit Client' : 'Begin';
    }

    _return() {
        const { jwtPayload, jwt } = this.props;
        const leaveWaitingAreaUrl = _.get(jwtPayload, 'context.leave_waiting_area_url') ?? '';

        updateParticipantReadyStatus(jwt, 'left');
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
        const remoteParticipantsStatuses = webViewEvent && webViewEvent.remoteParticipantsStatuses ?? null;

        console.log(webViewEvent, 'incoming web view event');

        if (remoteParticipantsStatuses) {
            updateRemoteParticipantsStatusesAction(remoteParticipantsStatuses);
        }

        if (webViewEvent && webViewEvent.error) {
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
            remoteParticipantsStatuses,
            authState
        } = this.props;
        const localParticipantCanJoin = checkLocalParticipantCanJoin(remoteParticipantsStatuses, participantType);

        return (<View style = { styles.janeWaitingAreaContainer }>
            <View style = { styles.janeWaitingAreaDialogBoxWrapper }>
                <View style = { styles.janeWaitingAreaDialogBoxInnerWrapper }>
                    <View style = { styles.logoWrapper }>
                        <Image
                            source = { require('../../../../images/jane_logo_72.png') }
                            style = { styles.logo } />
                    </View>
                    <View style = { styles.messageWrapper }>
                        {
                            <DialogTitle
                                authState = { authState }
                                localParticipantCanJoin = { localParticipantCanJoin }
                                participantType = { participantType } />
                        }
                        {
                            <DialogTitleMsg
                                authState = { authState }
                                localParticipantCanJoin = { localParticipantCanJoin }
                                participantType = { participantType } />
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
                <View style = { styles.actionButtonWrapper }>
                    { authState !== 'failed'
                    && <ActionButton
                        containerStyle = { styles.joinButtonContainer }
                        disabled = { !localParticipantCanJoin }
                        onPress = { this._joinConference }
                        title = { this._getBtnText() }
                        titleStyle = { styles.joinButtonText } /> }
                    {
                        authState === 'failed'
                        && <ActionButton
                            onPress = { this._return }
                            title = {
                                participantType === 'StaffMember'
                                    ? 'Return to my Schedule' : 'Return to my account' } />
                    }
                </View>
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
    const jwtPayload = jwt && jwtDecode(jwt) ?? null;
    const participant = getLocalParticipantFromJwt(state);
    const participantType = getLocalParticipantType(state);
    const { locationURL } = state['features/base/connection'];
    const { remoteParticipantsStatuses, authState } = state['features/jane-waiting-area-native'];

    return {
        jwt,
        jwtPayload,
        participantType,
        participant,
        locationURL,
        remoteParticipantsStatuses,
        authState
    };
}

const mapDispatchToProps = {
    startConferenceAction: startConference,
    enableJaneWaitingAreaAction: enableJaneWaitingArea,
    updateRemoteParticipantsStatusesAction: updateRemoteParticipantsStatuses,
    setJaneWaitingAreaAuthStateAction: setJaneWaitingAreaAuthState
};

export default connect(mapStateToProps, mapDispatchToProps)(DialogBox);


const DialogTitle = (props: DialogTitleProps) => {
    const { participantType, authState, localParticipantCanJoin } = props;
    const tokenExpiredHeader = 'Your appointment booking has expired';
    let header;

    if (participantType === 'StaffMember') {
        if (localParticipantCanJoin) {
            header = 'Your patient is ready to begin the session.';
        } else {
            header = 'Waiting for your client...';
        }
    } else if (localParticipantCanJoin) {
        header = 'Your practitioner is ready to begin the session.';
    } else {
        header = 'Your practitioner will let you into the session when ready...';
    }

    return (<Text
        style = { styles.title }>{ authState === 'failed' ? tokenExpiredHeader : header }</Text>);
};

const DialogTitleMsg = (props: DialogTitleProps) => {
    const { participantType, authState, localParticipantCanJoin } = props;
    let title;

    if (!localParticipantCanJoin) {
        title = 'Test your audio and video while you wait.';
    } else if (participantType === 'StaffMember') {
        title = 'When you are ready to begin, click on button below to admit your client into the video session.';
    } else {
        title = '';
    }

    return (<Text
        style = { styles.titleMsg }>{ authState === 'failed' ? '' : title }</Text>);
};

// @flow

import React, { Component } from 'react';
import { Image, Linking, Text, View } from 'react-native';
import { connect } from '../../base/redux';
import {
    checkLocalParticipantCanJoin,
    getLocalParticipantFromJwt, getLocalParticipantType,
    updateParticipantReadyStatus
} from '../functions';
import jwtDecode from 'jwt-decode';
import moment from 'moment';
import {
    enableJaneWaitingAreaPage,
    setJaneWaitingAreaAuthState,
    updateRemoteParticipantsStatuses
} from '../actions';
import { getLocalizedDateFormatter, jsCoreDateCreator } from '../../base/i18n';
import { connect as startConference } from '../../base/connection';
import styles from './styles';
import { ActionButton } from './ActionButton.native';
import { WebView } from 'react-native-webview';

type DialogTitleProps = {
    t: Function,
    participantType: string,
    localParticipantCanJoin: boolean,
    authState: string
}

type Props = {
    joinConference: Function,
};

const getWebViewUrl = locationURL => {
    let uri = locationURL.href;

    uri = `${uri}&RNsocket=true`;

    return uri;
};

const SocketWebView = ({ locationURL, onMessageUpdate, onError }) => {
    const injectedJavascript = `(function() {
          window.postMessage = function(data) {
            window.ReactNativeWebView.postMessage(data);
          };
        })()`;

    return (<View
        style = {{
            height: 0,
            width: 0
        }}>
        <WebView
            onError = { e => {
                onError(e);
            } }
            injectedJavaScript = { injectedJavascript }
            onMessage = { onMessageUpdate }
            source = {{ uri: getWebViewUrl(locationURL) }}
            startInLoadingState = { false } />
    </View>);
};

class DialogBox extends Component<Props, State> {

    constructor(props) {
        super(props);
        this._joinConference = this._joinConference.bind(this);
        this._return = this._return.bind(this);
    }

    _webviewOnError(error) {
        console.log(error, 'webview error');
        this._joinConference();
    }

    _joinConference() {
        const { startConference, enableJaneWaitingAreaPage, jwt } = this.props;

        updateParticipantReadyStatus(jwt, 'joined');
        enableJaneWaitingAreaPage(false);
        startConference();
    }

    _getStartDate() {
        const { jwtPayload } = this.props;
        const startAt = jwtPayload && jwtPayload.context && jwtPayload.context.start_at || '';

        if (startAt) {
            return (<Text style = { styles.msgText }>
                {
                    getLocalizedDateFormatter(jsCoreDateCreator(startAt))
                        .format('MMMM D, YYYY')
                }
            </Text>);
        }

        return null;
    }

    _getStartTimeAndEndTime() {
        const { jwtPayload } = this.props;
        const startAt = jwtPayload && jwtPayload.context && jwtPayload.context.start_at || '';
        const endAt = jwtPayload && jwtPayload.context && jwtPayload.context.end_at || '';

        if (!startAt || !endAt) {
            return null;
        }

        return (<Text style = { styles.msgText }>
            {
                `${getLocalizedDateFormatter(jsCoreDateCreator(startAt))
                    .format('h:mm')} - ${getLocalizedDateFormatter(jsCoreDateCreator(endAt))
                    .format('h:mm A')}`
            }
        </Text>);
    }

    _getDuration() {
        const { jwtPayload } = this.props;
        const startAt = jwtPayload && jwtPayload.context && jwtPayload.context.start_at || '';
        const endAt = jwtPayload && jwtPayload.context && jwtPayload.context.end_at || '';

        if (!startAt || !endAt) {
            return null;
        }
        const duration = getLocalizedDateFormatter(jsCoreDateCreator(endAt))
            .valueOf() - getLocalizedDateFormatter(jsCoreDateCreator(startAt))
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
        const leaveWaitingAreaUrl = jwtPayload && jwtPayload.context && jwtPayload.context.leave_waiting_area_url || '';

        updateParticipantReadyStatus(jwt, 'left');
        Linking.openURL(leaveWaitingAreaUrl);
    }

    parseJsonMessage(string) {
        try {
            return string && JSON.parse(string) && JSON.parse(string).message;
        } catch (e) {
            return null;
        }
    }

    onMessageUpdate(event) {
        const {  updateRemoteParticipantsStatuses, setJaneWaitingAreaAuthState } = this.props;
        const webViewEvent = this.parseJsonMessage(event.nativeEvent.data);
        const remoteParticipantsStatuses = webViewEvent && webViewEvent.remoteParticipantsStatuses || null;
        console.log(webViewEvent, 'incoming web view event');

        if (remoteParticipantsStatuses) {
            updateRemoteParticipantsStatuses(remoteParticipantsStatuses);
        }

        if (webViewEvent && webViewEvent.error) {
            if (webViewEvent.error.error === 'Signature has expired') {
                setJaneWaitingAreaAuthState ('failed');
            } else {
                this._joinConference ();
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
                            style = { styles.logo }
                            source = { require('../../../../images/jane_logo_72.png') } />
                    </View>
                    <View style = { styles.messageWrapper }>
                        {
                            <DialogTitle
                                participantType = { participantType }
                                authState = { authState }
                                localParticipantCanJoin = { localParticipantCanJoin } />
                        }
                        {
                            <DialogTitleMsg
                                participantType = { participantType }
                                authState = { authState }
                                localParticipantCanJoin = { localParticipantCanJoin } />
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
                        disabled={ !localParticipantCanJoin }
                        title = { this._getBtnText() }
                        containerStyle = { styles.joinButtonContainer }
                        titleStyle = { styles.joinButtonText }
                        onPress = { this._joinConference } /> }
                    {
                        authState === 'failed'
                        && <ActionButton
                            title = { participantType === 'StaffMember' ? 'Return to my Schedule' : 'Return to my account' }
                            onPress = { this._return } />
                    }
                </View>
            </View>
            <SocketWebView
                locationURL = { locationURL }
                onError = { this._webviewOnError.bind(this) }
                onMessageUpdate = { this.onMessageUpdate.bind(this) } />
        </View>);

    }
}

function mapStateToProps(state): Object {
    const { jwt } = state['features/base/jwt'];
    const jwtPayload = jwt && jwtDecode(jwt) || null;
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
    startConference,
    enableJaneWaitingAreaPage,
    updateRemoteParticipantsStatuses,
    setJaneWaitingAreaAuthState
};

export default connect(mapStateToProps, mapDispatchToProps)(DialogBox);


const DialogTitle = (props: DialogTitleProps) => {
    const { participantType, authState, localParticipantCanJoin } = props;
    const tokenExpiredHeader = 'Your appointment booking has expired';
    let header;

    if (participantType === 'StaffMember') {
        if (!localParticipantCanJoin) {
            header = 'Waiting for your client...';
        } else {
            header = 'Your patient is ready to begin the session.';
        }
    } else if (!localParticipantCanJoin) {
        header = 'Your practitioner will let you into the session when ready...';
    } else {
        header = 'Your practitioner is ready to begin the session.';
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

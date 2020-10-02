// @flow

import React, { Component } from 'react';
import { Image, Text, View } from 'react-native';
import { connect } from '../../base/redux';
import {
    getRemoteParticipantsReadyStatus,
    updateParticipantReadyStatus
} from '../functions';
import jwtDecode from 'jwt-decode';
import moment from 'moment';
import { enableJaneWaitingAreaPage } from '../actions';
import { getLocalizedDateFormatter, jsCoreDateCreator } from '../../base/i18n';
import { connect as startConference } from '../../base/connection';
import styles from './styles';
import { ActionButton } from './ActionButton.native';
import { WebView } from 'react-native-webview';

type Props = {
    joinConference: Function,
};

type State = {
    localParticipantCanJoin: boolean,
}

const getWebViewUrl = locationURL => {
    let uri = locationURL.href;

    uri = `${uri}&RNsocket=true`;

    return uri;
};

const SocketWebView = ({ locationURL, onMessageUpdate, setWebViewError }) => {
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
                console.log(e, 'webview error');
                setWebViewError(true);
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
        this.state = {
            localParticipantCanJoin: false,
            webViewError: false
        };
        this._joinConference = this._joinConference.bind(this);
        this._close = this._close.bind(this);
        this.pollingInterval = null;
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.state.webViewError && (prevState.webViewError !== this.state.webViewError)) {
            this._pollForReadyStatus();
        }
    }

    componentWillUnmount() {
        this.pollingInterval && clearInterval(this.pollingInterval);
    }

    _setWebViewError(error) {
        this.setState({ webViewError: error });
    }

    async _polling() {
        const { jwt, jwtPayload, participantType, updateRemoteParticipantsStatus } = this.props;
        const remoteParticipantsStatus = await getRemoteParticipantsReadyStatus(jwt, jwtPayload, participantType);

        updateRemoteParticipantsStatus(remoteParticipantsStatus);
    }

    _pollForReadyStatus() {
        this.pollingInterval = setInterval(this._polling.bind(this), 10000);
    }

    _joinConference() {
        const {
            startConference, participantType, enableJaneWaitingAreaPage, jwt, jwtPayload, participant
        } = this.props;

        updateParticipantReadyStatus(jwt, jwtPayload, participantType, participant, 'joined');
        enableJaneWaitingAreaPage(false);
        startConference();
    }

    _getDialogTitleMsg() {
        const { participantType } = this.props;
        const { localParticipantCanJoin } = this.state;
        let title;

        if (!localParticipantCanJoin) {
            title = 'Test your audio and video while you wait.';
        } else if (participantType === 'StaffMember') {
            title = 'When you are ready to begin, click on button below to admit your client into the video session.';
        } else {
            title = '';
        }

        return (<Text
            style = { styles.titleMsg }>{title}</Text>);
    }

    _getDialogTitle() {
        const { participantType } = this.props;
        const { localParticipantCanJoin } = this.state;
        let header;

        if (participantType === 'StaffMember') {
            if (!localParticipantCanJoin) {
                header = 'Waiting for the client...';
            } else {
                header = 'The patient is ready to begin your session';
            }
        } else if (!localParticipantCanJoin) {
            header = 'The pratitioner will let you into the session when they are ready...';
        } else {
            header = 'The pratitioner is ready to begin your session';
        }

        return <Text style = { styles.title }>{header}</Text>;
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

    _close() {

    }

    parseJsonMessage(string) {
        try {
            return string && JSON.parse(string) && JSON.parse(string).message;
        } catch (e) {
            return null;
        }
    }

    onMessageUpdate(event) {
        const webViewEvent = this.parseJsonMessage(event.nativeEvent.data);

        console.log(webViewEvent, 'incoming web view event');
        if (webViewEvent && webViewEvent.socketRemoteParticipantsEvent) {
            const localParticipantCanJoin = webViewEvent.socketRemoteParticipantsEvent.info
                && webViewEvent.socketRemoteParticipantsEvent.info.status !== 'left';

            this.setState({
                localParticipantCanJoin
            });
        }
        if (webViewEvent && webViewEvent.remoteParticipantsStatus) {
            const localParticipantCanJoin = webViewEvent.remoteParticipantsStatus.some(v => v.info && v.info.status !== 'left');

            this.setState({
                localParticipantCanJoin
            });
        }
    }

    render() {
        const {
            participantType,
            jwtPayload,
            locationURL
        } = this.props;
        const { localParticipantCanJoin } = this.state;

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
                            this._getDialogTitle()
                        }
                        {
                            this._getDialogTitleMsg()
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
                    {localParticipantCanJoin
                    && <ActionButton
                        title = { this._getBtnText() }
                        containerStyle = { styles.joinButtonContainer }
                        titleStyle = { styles.joinButtonText }
                        onPress = { this._joinConference } />}
                    {
                        !localParticipantCanJoin && participantType === 'StaffMember'
                        && <ActionButton
                            title = 'Close'
                            onPress = { this._close } />
                    }

                </View>

            </View>
            <SocketWebView
                locationURL = { locationURL }
                setWebViewError = { this._setWebViewError.bind(this) }
                onMessageUpdate = { this.onMessageUpdate.bind(this) } />
        </View>);

    }
}

function mapStateToProps(state): Object {
    const { jwt } = state['features/base/jwt'];
    const jwtPayload = jwt && jwtDecode(jwt) || null;
    const participant = jwtPayload && jwtPayload.context && jwtPayload.context.user || null;
    const participantType = participant && participant.participant_type || null;
    const { locationURL } = state['features/base/connection'];

    return {
        jwt,
        jwtPayload,
        participantType,
        participant,
        locationURL
    };
}

const mapDispatchToProps = {
    startConference,
    enableJaneWaitingAreaPage
};

export default connect(mapStateToProps, mapDispatchToProps)(DialogBox);

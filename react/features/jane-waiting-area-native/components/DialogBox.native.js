// @flow

import React, { Component } from 'react';
import { Image, Text, View } from 'react-native';
import { connect } from '../../base/redux';
import {
    updateParticipantReadyStatus
} from '../functions';
import jwtDecode from 'jwt-decode';
import moment from 'moment';
import { enablePreJoinPage } from '../actions';
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
    webViewEvent: Object
}

const getWebViewUrl = (locationURL) => {
    let uri = locationURL.href;

    uri = uri + '&RNsocket=true';
    return uri;
};

const SocketWebView = ({ locationURL, onMessageUpdate }) => {
    const injectedJavascript = `(function() {
          window.postMessage = function(data) {
            window.ReactNativeWebView.postMessage(data);
          };
        })()`;

    return <View style={{
        height: 0,
        width: 0
    }}>
        <WebView
            onError={(e) => {
                console.log(e);
            }}
            injectedJavaScript={injectedJavascript}
            onMessage={onMessageUpdate}
            source={{ uri: getWebViewUrl(locationURL) }}
            startInLoadingState={false}/>
    </View>;
};

class DialogBox extends Component<Props, State> {

    constructor(props) {
        super(props);
        this.state = {
            webViewEvent: '',
            localParticipantCanJoin: false
        };
        this._joinConference = this._joinConference.bind(this);
        this._close = this._close.bind(this);
    }

    componentDidMount(){
        const {
           participantType,  jwt, jwtPayload, participant
        } = this.props;
        window.onunload = window.onbeforeunload = function () {
            updateParticipantReadyStatus(jwt, jwtPayload, participantType, participant, 'left');
        };
    }

    _joinConference() {
        const {
            startConference, participantType, enablePreJoinPage, jwt, jwtPayload, participant
        } = this.props;
        updateParticipantReadyStatus(jwt, jwtPayload, participantType, participant, "joined");
        enablePreJoinPage(false);
        startConference();
    }

    _getDialogTitleMsg() {
        const { participantType } = this.props;
        const { localParticipantCanJoin } = this.state;
        let title;
        if (!localParticipantCanJoin) {
            title = 'Test your audio and video while you wait.';
        } else {
            if (participantType === 'StaffMember') {
                title = 'When you are ready to begin, click on button below to admit your client into the video session.';
            } else {
                title = '';
            }
        }
        return <Text
            style={styles.titleMsg}>{title}</Text>;
    }

    _getDialogTitle() {
        const { participantType } = this.props;
        const { localParticipantCanJoin } = this.state;
        let header;
        if (participantType === 'StaffMember') {
            if (!localParticipantCanJoin) {
                header = 'Waiting for the client...';
            } else {
                header = ('The patient is ready to begin your session');
            }
        } else {
            if (!localParticipantCanJoin) {
                header = ('The pratitioner will let you into the session when they are ready...');
            } else {
                header = ('The pratitioner is ready to begin your session');
            }
        }
        return <Text style={styles.title}>{header}</Text>;
    }

    _getStartDate() {
        const { jwtPayload } = this.props;
        const startAt = jwtPayload && jwtPayload.context && jwtPayload.context.start_at || '';
        if (startAt) {
            return <Text style={styles.msgText}>
                {
                    getLocalizedDateFormatter(jsCoreDateCreator(startAt))
                        .format('MMMM D, YYYY')
                }
            </Text>;
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
        return <Text style={styles.msgText}>
            {
                `${getLocalizedDateFormatter(jsCoreDateCreator(startAt))
                    .format('h:mm')} - ${getLocalizedDateFormatter(jsCoreDateCreator(endAt))
                    .format('h:mm A')}`
            }
        </Text>;
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
        return <Text style={styles.msgText}>
            {
                `${moment.duration(duration)
                    .asMinutes()} Minutes`
            }
        </Text>;
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
        console.log(event.nativeEvent.data, '++aaaaa');
        const webViewEvent = this.parseJsonMessage(event.nativeEvent.data);
        if (webViewEvent) {
            this.setState({
                webViewEvent
            });
            if (webViewEvent.localParticipantCanJoin === true) {
                this.setState({
                    localParticipantCanJoin: true
                });
            }
        }
    }

    render() {
        const {
            participantType,
            jwtPayload,
            locationURL
        } = this.props;
        const { localParticipantCanJoin } = this.state;

        return <View style={styles.prejoinContainer}>
            <View style={styles.preJoinDialogBoxWrapper}>
                <View style={styles.preJoinDialogBoxInnerWrapper}>
                    <View style={styles.logoWrapper}>
                        <Image
                            style={styles.logo}
                            source={require('../../../../images/jane_logo_72.png')}
                        />
                    </View>
                    <View style={styles.messageWrapper}>
                        {
                            this._getDialogTitle()
                        }
                        {
                            this._getDialogTitleMsg()
                        }
                        <View style={styles.infoDetailContainer}>
                            <Text style={[ styles.msgText, styles.boldText ]}>
                                {
                                    jwtPayload && jwtPayload.context && jwtPayload.context.treatment
                                }
                            </Text>
                            <Text style={[ styles.msgText, styles.boldText ]}>
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
                <View style={styles.actionButtonWrapper}>
                    {localParticipantCanJoin &&
                    <ActionButton title={this._getBtnText()}
                                  containerStyle={styles.joinButtonContainer}
                                  titleStyle={styles.joinButtonText}
                                  onPress={this._joinConference}/>}
                    {
                        !localParticipantCanJoin && participantType === 'StaffMember' &&
                        <ActionButton title='Close'
                                      onPress={this._close}/>
                    }

                </View>

            </View>
            <SocketWebView locationURL={locationURL}
                           onMessageUpdate={this.onMessageUpdate.bind(this)}/>
        </View>;

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
    enablePreJoinPage
};

export default connect(mapStateToProps, mapDispatchToProps)((DialogBox));

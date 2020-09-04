// @flow

import React, { Component } from 'react';
import { Text, View } from 'react-native';
import { connect } from '../../base/redux';
import {
    checkOtherParticipantsReady,
    localParticipantIsReady
} from '../functions';
import jwtDecode from 'jwt-decode';
import moment from 'moment';
import { getLocalizedDateFormatter, translate } from '../../base/i18n';
import { initWebSocket, disconnectSocket } from '../actions';
import { connect as startConference } from '../../base/connection';

type Props = {
    joinConference: Function,
    t: Function,
};

type State = {
    localParticipantCanJoin: boolean
}

class PrejoinNative extends Component<Props, State> {

    constructor(props) {
        super(props);
        this.state = {
            localParticipantCanJoin: false
        };
        this._joinConference = this._joinConference.bind(this);
        this._onReadyBtnClick = this._onReadyBtnClick.bind(this);
        this._onMessageUpdate = this._onMessageUpdate.bind(this);
    }

    componentDidMount() {
        const { jwt, jwtPayload, participantType, participant, disconnectSocket } = this.props;
        if (participantType === 'Patient') {
            localParticipantIsReady(jwt, jwtPayload, participantType, participant);
        }
        this._connectSocket();
    }

    componentWillUnmount() {
        const { disconnectSocket, socket } = this.props;
        socket && disconnectSocket();
    }

    _onMessageUpdate(event) {
        const { participantType } = this.props;
        if (event.info === 'practitioner_ready' && participantType === 'Patient') {
            this.setState({
                localParticipantCanJoin: true
            });
        }
        if (event.info === 'patient_ready' && participantType === 'StaffMember') {
            this.setState({
                localParticipantCanJoin: true
            });
        }
    }

    _joinConference() {
        const {
            startConference, participantType
        } = this.props;
        if (participantType === 'StaffMember') {
            localParticipantIsReady();
        }
        startConference();
    }

    async _connectSocket() {
        const { jwt, jwtPayload, initWebSocket } = this.props;
        const socketJwtPayload = jwtDecode(jwtPayload.context.ws_token);
        try {
            const otherParticipantsReady = await checkOtherParticipantsReady(jwt, jwtPayload);
            const ws_host = jwtPayload.context.ws_host;
            const ws_token = jwtPayload.context.ws_token;
            if (otherParticipantsReady) {
                this.setState({
                    localParticipantCanJoin: true
                });
            } else {
                initWebSocket(socketJwtPayload, ws_host, ws_token, this._onMessageUpdate.bind(this));
            }
        } catch (e) {
            console.log(e);
        }
    }

    _onReadyBtnClick() {
        const { jwt, jwtPayload, participantType, participant } = this.props;
        localParticipantIsReady(jwt, jwtPayload, participantType, participant);
    }

    _getDialogTitleMsg() {
        const { t, participantType } = this.props;
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
        return <Text className='prejoin-info-title-msg'>{title}</Text>;
    }

    _getDialogTitle() {
        const { t, participantType } = this.props;
        const { localParticipantCanJoin } = this.state;
        let header;
        if (participantType === 'StaffMember') {
            if (!localParticipantCanJoin) {
                header = t('prejoin.pratitionerWaitMsg');
            }
            header = t('prejoin.patientReady');
        } else {
            if (!localParticipantCanJoin) {
                header = t('prejoin.patientWaitMsg');
            }
            header = t('prejoin.pratitionerReady');
        }
        return <Text className='prejoin-info-title'>{header}</Text>;
    }

    _getStartDate() {
        const { jwtPayload } = this.props;
        const startAt = jwtPayload && jwtPayload.context && jwtPayload.context.start_at || '';
        if (startAt) {
            return <Text>
                {
                    getLocalizedDateFormatter(startAt)
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
        return <Text>
            {
                `${getLocalizedDateFormatter(startAt)
                    .format('h:mm')} -
            ${getLocalizedDateFormatter(endAt)
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
        const duration = getLocalizedDateFormatter(endAt)
            .valueOf() - getLocalizedDateFormatter(startAt)
            .valueOf();
        return <Text>
            {
                `${moment.duration(duration)
                    .asMinutes()} Minutes`
            }
        </Text>;
    }

    _getBtnText() {
        const { participantType } = this.props;
        return participantType === 'StaffMember' ? 'Admin Client' : 'Begin';
    }

    render() {
        const {
            name,
            participantType,
            deviceStatusVisible,
            jwtPayload,
            t
        } = this.props;

        const { _joinConference, _closeWindow } = this;
        const { localParticipantCanJoin } = this.state;
        const stopAnimation = participantType === 'StaffMember';
        const waitingMessageHeader = participantType === 'StaffMember' ? '' : 'Waiting for the practitioner...';
        return null;
    }
}

function mapStateToProps(state): Object {
    const { jwt } = state['features/base/jwt'];
    const { socket, enablePreJoinPage } = state['features/prejoin'];
    const jwtPayload = jwt && jwtDecode(jwt) || null;
    const participant = jwtPayload && jwtPayload.context && jwtPayload.context.user || null;
    const participantType = participant && participant.participant_type || null;

    return {
        jwt,
        jwtPayload,
        participantType,
        participant,
        socket,
        enablePreJoinPage
    };
}

const mapDispatchToProps = {
    initWebSocket,
    disconnectSocket,
    startConference
};

export default connect(mapStateToProps, mapDispatchToProps)(translate(PrejoinNative));

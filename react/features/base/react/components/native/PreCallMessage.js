// @flow
/* eslint-disable require-jsdoc*/


import jwtDecode from 'jwt-decode';
import _ from 'lodash';
import {
    Animated,
    Text,
    Image,
    TouchableOpacity, Easing
} from 'react-native';
import React, { Component } from 'react/index';

import { Icon, IconClose } from '../../../../base/icons';
import { getLocalParticipantType } from '../../../../base/participants/functions';
import { isIPhoneX } from '../../../../base/styles/functions.native';
import { isJaneWaitingAreaEnabled } from '../../../../jane-waiting-area';
import { isJaneTestCall } from '../../../conference';
import { getLocalizedDateFormatter, translate, getTimeStamp } from '../../../i18n';
import { getParticipantCount } from '../../../participants';
import { connect } from '../../../redux';
import { getRemoteTracks } from '../../../tracks';
import { shouldShowPreCallMessage } from '../functions';

import styles, { WAITING_MESSAGE_CONTIANER_BACKGROUND_COLOR } from './styles';

const watermarkImg = require('../../../../../../images/watermark.png');

const WATERMARK_ANIMATION_INPUT_RANGE = [ 0, 0.5, 1 ];
const WATERMARK_ANIMATION_OUTPUT_RANGE = [ 0.1, 1, 0.1 ];

type Props = {
    appointmentStartAt: string,
    conferenceHasStarted: boolean,
    isStaffMember: boolean,
    isTestCall: boolean,
    isWaitingAreaPageEnabled: boolean,
    showPreCallMessage: boolean,
    t: Function
};

type State = {
    beforeAppointmentStart: boolean,
    showPreCallMessage: boolean
};

class PreCallMessage extends Component<Props, State> {

    _interval;

    constructor(props: Props) {
        super(props);
        this.state = {
            beforeAppointmentStart: false,
            showPreCallMessage: props.showPreCallMessage
        };
        this.animatedValue = new Animated.Value(0);
        this._onClose = this._onClose.bind(this);
    }

    componentDidMount() {
        this._startTimer();
        this._animate();
    }

    _animate() {
        this.animatedValue.setValue(0);
        Animated.timing(
            this.animatedValue,
            {
                toValue: 1,
                duration: 2000,
                easing: Easing.linear
            }
        )
            .start(() => this._animate());
    }

    _startTimer() {
        const { appointmentStartAt, conferenceHasStarted } = this.props;

        if (appointmentStartAt && !conferenceHasStarted) {
            const appointmentStartAtTimeStamp = getTimeStamp(appointmentStartAt);
            const now = new Date().getTime();

            if (now < appointmentStartAtTimeStamp) {
                this.setState({
                    beforeAppointmentStart: true
                }, () => {
                    this._setInterval(appointmentStartAtTimeStamp);
                });
            }
        }
    }

    _setInterval(appointmentStartTimeStamp) {
        this._interval = setInterval(() => {
            const { conferenceHasStarted } = this.props;
            const now = new Date().getTime();

            if ((appointmentStartTimeStamp < now) || conferenceHasStarted) {
                this.setState({
                    beforeAppointmentStart: false
                }, () => {
                    this._stopTimer();
                });
            }
        }, 1000);
    }

    _stopTimer() {
        if (this._interval) {
            clearInterval(this._interval);
        }
    }

    _onClose() {
        this.setState({
            showPreCallMessage: false
        });
    }

    _getPreCallMessage() {
        const { isTestCall, appointmentStartAt, isWaitingAreaPageEnabled, t } = this.props;
        const { beforeAppointmentStart } = this.state;

        let header = t('preCallMessage.WaitingforOthers');

        let message = t('preCallMessage.sitBack');

        if (beforeAppointmentStart && appointmentStartAt) {
            const timeStamp = getTimeStamp(appointmentStartAt);

            header = t('preCallMessage.willBeginAt', { time: getLocalizedDateFormatter(timeStamp)
                    .format('hh:mm A') });
        }

        if (isTestCall) {
            header = t('preCallMessage.testing');
            message = t('preCallMessage.hangUpToClose');
        }

        if (isWaitingAreaPageEnabled) {
            header = t('preCallMessage.waitingForPractitioner');
        }

        return (<TouchableOpacity
            activeOpacity = { 1 }
            style = { styles.messageWrapper }>
            <Text style = { styles.preCallMessageHeader }>{ header} </Text>
            <Text style = { styles.preCallMessageText }>{ message } </Text>
        </TouchableOpacity>);
    }

    _renderCloseBtn() {
        return (<TouchableOpacity
            onPress = { this._onClose }
            style = { styles.preCallMessageCloseBtn }>
            <Icon
                size = { 22 }
                src = { IconClose } />
        </TouchableOpacity>);
    }

    render() {
        const { conferenceHasStarted } = this.props;
        const { showPreCallMessage } = this.state;

        if (conferenceHasStarted) {
            return null;
        }

        const animate = showPreCallMessage ? this.animatedValue.interpolate({
            inputRange: WATERMARK_ANIMATION_INPUT_RANGE,
            outputRange: WATERMARK_ANIMATION_OUTPUT_RANGE
        }) : 1;

        const image = (<Image
            source = { watermarkImg }
            style = { styles.watermark } />);
        const backgroundColor = showPreCallMessage ? WAITING_MESSAGE_CONTIANER_BACKGROUND_COLOR : 'transparent';
        const paddingTop = isIPhoneX() ? 60 : 30;

        return (<TouchableOpacity
            activeOpacity = { 1 }
            style = { [
                styles.preCallMessageContainer, {
                    backgroundColor,
                    paddingTop
                }
            ] }>
            <Animated.View
                style = { [ styles.watermarkWrapper, {
                    opacity: animate
                } ] }>
                {
                    image
                }
            </Animated.View>
            {
                showPreCallMessage && this._getPreCallMessage()
            }
            {
                showPreCallMessage && this._renderCloseBtn()
            }
        </TouchableOpacity>);
    }
}

function _mapStateToProps(state) {
    const { jwt } = state['features/base/jwt'];
    const participantCount = getParticipantCount(state);
    const remoteTracks = getRemoteTracks(state['features/base/tracks']);
    const participantType = getLocalParticipantType(state);
    const jwtPayload = jwt && jwtDecode(jwt);
    const isWaitingAreaPageEnabled = isJaneWaitingAreaEnabled(state);
    const appointmentStartAt = _.get(jwtPayload, 'context.start_at') || '';
    const showPreCallMessage = shouldShowPreCallMessage(state);

    return {
        conferenceHasStarted: participantCount > 1 && remoteTracks.length > 0,
        isTestCall: isJaneTestCall(state),
        isStaffMember: participantType === 'StaffMember',
        appointmentStartAt,
        isWaitingAreaPageEnabled,
        showPreCallMessage
    };
}

export default connect(_mapStateToProps)(translate(PreCallMessage));

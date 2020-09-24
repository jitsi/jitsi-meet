// @flow
/* eslint-disable */
import React, { Component } from 'react/index';
import { Animated, Easing, Text, SafeAreaView, Image } from 'react-native';
import styles from './styles';
import { getLocalizedDateFormatter, translate } from '../../../i18n';
import { connect } from '../../../redux';
import { getParticipantCount } from '../../../participants';
import { getRemoteTracks } from '../../../tracks';
import jwtDecode from 'jwt-decode';
import View from 'react-native-webrtc/RTCView';
import moment from 'moment';

const watermarkImg = require('../../../../../../images/watermark.png');

type Props = {
    _isGuest: boolean,
    jwt: Object,
    conferenceHasStarted: boolean,
    stopAnimation: boolean,
    waitingMessageFromProps: string
};

type State = {
    beforeAppointmentStart: boolean,
    appointmentStartAt: string
};

class WaitingMessage extends Component<Props, State> {

    _interval;

    constructor(props: Props) {
        super(props);

        this.state = {
            beforeAppointmentStart: false,
            appointmentStartAt: '',
            fadeAnim: new Animated.Value(0)
        };
        this.animatedValue = new Animated.Value(0);
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
        const { jwt, conferenceHasStarted } = this.props;
        const jwtPayload = jwt && jwtDecode(jwt);
        if (jwtPayload && jwtPayload.context && !conferenceHasStarted) {
            const { start_at } = jwtPayload.context || 0;
            const appointmentStartTimeStamp = moment(start_at, 'YYYY-MM-DD HH:mm:ss')
                .valueOf();
            const now = new Date().getTime();
            if (now < appointmentStartTimeStamp) {
                this.setState({
                    beforeAppointmentStart: true,
                    appointmentStartAt: start_at
                }, () => {
                    this._setInterval(appointmentStartTimeStamp);
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

    render() {
        const { conferenceHasStarted } = this.props;

        if (conferenceHasStarted) {
            return null;
        }

        return (
            <SafeAreaView>
                {
                    this._renderWaitingMessage()
                }
            </SafeAreaView>
        );
    }

    getWaitingMessage() {
        const { waitingMessageFromProps } = this.props;
        const { beforeAppointmentStart, appointmentStartAt } = this.state;
        let header, text;
        header = <Text
            style={styles.waitingMessageHeader}>{waitingMessageFromProps ? waitingMessageFromProps.header
            : 'Waiting for the other participant to join...'}</Text>;
        text = <Text style={styles.waitingMessageText}>{
            waitingMessageFromProps ? waitingMessageFromProps.text :
                'Sit back, relax and take a moment for yourself.'
        }</Text>;
        if (beforeAppointmentStart && appointmentStartAt && !waitingMessageFromProps) {
            const time = moment(appointmentStartAt, 'YYYY-MM-DD HH:mm')
                .format('YYYY-MM-DD HH:mm');
            header = (
                <Text style={styles.waitingMessageHeader}>Your appointment will
                    begin
                    at {getLocalizedDateFormatter(time)
                        .format('hh:mm A')}</Text>);
        }

        return <View style={{ backgroundColor: 'transparent' }}>
            {
                header
            }
            {
                text
            }
        </View>;
    }

    _renderWaitingMessage() {
        const { stopAnimation} = this.props;
        const { beforeAppointmentStart, appointmentStartAt } = this.state;
        const animate = stopAnimation ? null : this.animatedValue.interpolate({
            inputRange: [ 0, .5, 1 ],
            outputRange: [ .1, 1, .1 ]
        });

        let header = <Text style={styles.waitingMessageHeader}>Waiting for the
            other participant to join...</Text>;
        const image = <Image style={styles.watermark}
                             source={watermarkImg}/>;
        if (beforeAppointmentStart && appointmentStartAt) {
            const time = moment(appointmentStartAt, 'YYYY-MM-DD HH:mm')
                .format('YYYY-MM-DD HH:mm');
            header = (
                <Text style={styles.waitingMessageHeader}>Your appointment will
                    begin
                    at {getLocalizedDateFormatter(time)
                        .format('hh:mm A')}</Text>);
        }

        return (<View style={[ styles.waitingMessageContainer ]}>
            <Animated.View className='waitingMessage'
                           style={[ styles.waitingMessageImage, {
                               opacity: animate
                           } ]}>
                {
                    image
                }
            </Animated.View>
            {
                this.getWaitingMessage()
            }
        </View>);
    }
}

function _mapStateToProps(state) {
    const { jwt } = state['features/base/jwt'];
    const participantCount = getParticipantCount(state);
    const remoteTracks = getRemoteTracks(state['features/base/tracks']);

    return {
        jwt,
        conferenceHasStarted: participantCount > 1 && remoteTracks.length > 0
    };
}

export default connect(_mapStateToProps)(translate(WaitingMessage));

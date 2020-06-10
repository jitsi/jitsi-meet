// @flow
/* eslint-disable */
import React, { Component } from 'react';

import { getLocalizedDateFormatter, translate } from '../../../i18n';
import { connect } from '../../../redux';
import { getParticipantCount } from '../../../participants';
import { getRemoteTracks } from '../../../tracks';
import jwtDecode from 'jwt-decode';

type Props = {
    _isGuest: boolean,
    jwt: Object,
    conferenceHasStarted: boolean,
    isWelcomePage: boolean
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
            appointmentStartAt: ''
        };
    }

    componentDidMount() {
        this._startTimer();
    }

    _startTimer() {
        const { jwt, conferenceHasStarted } = this.props;
        const jwtPayload = jwt && jwtDecode(jwt);

        if (jwtPayload && jwtPayload.context && !conferenceHasStarted) {
            const { start_at } = jwtPayload.context || 0;
            const appointmentStartTimeStamp = new Date(start_at).getTime();
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
            <div>
                {
                    this._renderWaitingMessage()
                }
            </div>
        );
    }

    _renderWaitingMessage() {
        const { beforeAppointmentStart, appointmentStartAt } = this.state;

        let header = <p>Waiting for the other participant to join...</p>;

        if (beforeAppointmentStart && appointmentStartAt) {
            header = (<p>Your appointment will begin
                at {getLocalizedDateFormatter(appointmentStartAt).format('hh:mm A')}</p>);
        }

        return (<div className = 'waitingMessage'>
            {
                header
            }
            <p>Sit back, relax and take a moment for yourself.</p>
        </div>);
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

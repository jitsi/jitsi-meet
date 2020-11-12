// @flow
/* eslint-disable */
import React, { Component } from 'react';

import type { Dispatch } from 'redux';
import { getLocalizedDateFormatter, translate } from '../../../i18n';
import { connect } from '../../../redux';
import { getParticipantCount } from '../../../participants';
import { getRemoteTracks } from '../../../tracks';
import jwtDecode from 'jwt-decode';
import {
    IconClose
} from '../../../../base/icons';
import { Icon } from '../../../icons/components';
import { isJaneTestMode } from '../../../conference';
import { setWaitingMessageVisibility } from '../../../../jane-waiting-area/actions';

type Props = {
    _isGuest: boolean,
    jwt: Object,
    conferenceHasStarted: boolean,
    waitingMessageHeader: string,
    onClose: Function,
    isJaneTestMode: boolean,
    hideWaitingMessage: Function,
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

    _hideWaitingMessage() {
        this.props.hideWaitingMessage();
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
                <div className='close'>
                    <Icon src={IconClose}
                          onClick={this._hideWaitingMessage.bind(this)}/>
                </div>
            </div>
        );
    }

    _renderWaitingMessage() {
        const { beforeAppointmentStart, appointmentStartAt } = this.state;
        const { waitingMessageHeader, isJaneTestMode } = this.props;

        let header = <p>Waiting for the other participant to join...</p>;
        let text = <p>Sit back, relax and take a moment for yourself.</p>;

        if (beforeAppointmentStart && appointmentStartAt) {
            header = (<p>Your appointment will begin
                at {getLocalizedDateFormatter(appointmentStartAt).format('hh:mm A')}</p>);
        }

        if (waitingMessageHeader) {
            header = <p>{waitingMessageHeader}</p>;
        }

        if (isJaneTestMode) {
            header = <p>Testing your audio and video...</p>;
            text = <p>
                This is just a test area. Begin your online appointment from
                your Upcoming Appointments page.
            </p>;
        }

        return (<div className='waitingMessage'>
            {
                header
            }
            {
                text
            }
        </div>);
    }
}

function _mapStateToProps(state) {
    const { jwt } = state['features/base/jwt'];
    const participantCount = getParticipantCount(state);
    const remoteTracks = getRemoteTracks(state['features/base/tracks']);

    return {
        jwt,
        conferenceHasStarted: participantCount > 1 && remoteTracks.length > 0,
        isJaneTestMode: isJaneTestMode(state)
    };
}

function _mapDispatchToProps(dispatch: Dispatch<any>) {
    return {
        hideWaitingMessage() {
            dispatch(setWaitingMessageVisibility(false));
        }
    };
}

export default connect(_mapStateToProps, _mapDispatchToProps)(translate(WaitingMessage));

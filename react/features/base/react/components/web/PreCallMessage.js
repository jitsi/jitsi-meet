// @flow
/* eslint-disable require-jsdoc*/
import jwtDecode from 'jwt-decode';
import _ from 'lodash';
import React, { Component } from 'react';

import { isJaneWaitingAreaPageEnabled } from '../../../../jane-waiting-area/functions';
import { isJaneTestCall } from '../../../conference/functions';
import { getLocalizedDateFormatter, translate, getTimeStamp } from '../../../i18n';
import {
    getLocalParticipantType,
    getParticipantCount
} from '../../../participants';
import { connect } from '../../../redux';
import { getRemoteTracks } from '../../../tracks';

type Props = {
    appointmentStartAt: string,
    conferenceHasStarted: boolean,
    isStaffMember: boolean,
    isTestCall: boolean,
    isWaitingAreaPageEnabled: boolean
};

type State = {
    beforeAppointmentStart: boolean,
};

class PreCallMessage extends Component<Props, State> {

    _interval;

    constructor(props: Props) {
        super(props);

        this.state = {
            beforeAppointmentStart: false,
            hidePreCallMessage: !props.isTestCall && props.isStaffMember
        };
    }

    componentDidMount() {
        this._startTimer();
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

    render() {
        const { conferenceHasStarted } = this.props;

        if (conferenceHasStarted) {
            return null;
        }

        return this._renderPreCallMessage();
    }

    _renderPreCallMessage() {
        const { beforeAppointmentStart } = this.state;
        const { appointmentStartAt, isWaitingAreaPageEnabled, isTestCall } = this.props;
        let header = 'Waiting for the other participant to join...';
        let message = 'Sit back, relax and take a moment for yourself.';

        if (beforeAppointmentStart && appointmentStartAt) {
            header = `Your appointment will begin
                at ${getLocalizedDateFormatter(appointmentStartAt).format('hh:mm A')}`;
        }

        if (isTestCall) {
            header = 'Testing your audio and video...';
            message = 'When you are done testing your audio and video, '
                + 'hang up to close this screen. Begin your online appointment from your upcoming appointments page.';
        }

        if (isWaitingAreaPageEnabled) {
            header = 'Waiting for the practitioner...';
        }

        return (<div className = 'preCallMessage'>
            <p>{ header }</p>
            <p>{ message}</p>
        </div>);
    }
}

function _mapStateToProps(state) {
    const { jwt } = state['features/base/jwt'];
    const participantCount = getParticipantCount(state);
    const remoteTracks = getRemoteTracks(state['features/base/tracks']);
    const participantType = getLocalParticipantType(state);
    const jwtPayload = jwt && jwtDecode(jwt);
    const isWaitingAreaPageEnabled = isJaneWaitingAreaPageEnabled(state);
    const appointmentStartAt = _.get(jwtPayload, 'context.start_at') || '';

    return {
        conferenceHasStarted: participantCount > 1 && remoteTracks.length > 0,
        isTestCall: isJaneTestCall(state),
        isStaffMember: participantType === 'StaffMember',
        appointmentStartAt,
        isWaitingAreaPageEnabled
    };
}

export default connect(_mapStateToProps)(translate(PreCallMessage));

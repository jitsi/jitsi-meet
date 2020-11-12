// @flow
/* eslint-disable */

import React, { Component } from 'react';
import { getLocalizedDateFormatter, translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';
import ActionButton from '../buttons/ActionButton';
import AudioSettingsButton
    from '../../../toolbox/components/web/AudioSettingsButton';
import VideoSettingsButton
    from '../../../toolbox/components/web/VideoSettingsButton';
import jwtDecode from 'jwt-decode';
import moment from 'moment';
import {
    checkLocalParticipantCanJoin,
    updateParticipantReadyStatus
} from '../../functions';
import {
    joinConference as joinConferenceAction
} from '../../actions';
import JaneHangupButton from '../../../toolbox/components/JaneHangupButton';
import { openURLInBrowser } from '../../../base/util';

type Props = {
    joinConference: Function,
    t: Function,
    jwtPayload: Object,
    participantType: string,
    participant: Object,
    remoteParticipantsStatuses: string,
    authState: string
};

type DialogTitleProps = {
    t: Function,
    participantType: string,
    localParticipantCanJoin: boolean,
    authState: string
}

function DialogTitleComp(props: DialogTitleProps) {
    let header;

    if (props.participantType === 'StaffMember') {
        if (props.localParticipantCanJoin) {
            header = props.t('janeWaitingArea.patientIsReady');
        } else {
            header = props.t('janeWaitingArea.waitClient');
        }
    } else if (props.localParticipantCanJoin) {
        header = props.t('janeWaitingArea.practitionerIsReady');
    } else {
        header = props.t('janeWaitingArea.waitPractitioner');
    }

    if (props.authState === 'failed') {
        header = props.t('janeWaitingArea.authenticationExpired');
    }

    return <div className='jane-waiting-area-info-title'>{header}</div>;
}

function DialogTitleMsgComp(props: DialogTitleProps) {
    let title;

    if (props.localParticipantCanJoin) {
        title = '';
        if (props.participantType === 'StaffMember') {
            title = props.t('janeWaitingArea.whenYouAreReady');
        }
    } else {
        title = props.t('janeWaitingArea.testYourDevice');
    }

    if (props.authState === 'failed') {
        title = '';
    }

    return <div className='jane-waiting-area-info-title-msg'>{title}</div>;
}

const DialogTitle = (translate(DialogTitleComp));
const DialogTitleMsg = (translate(DialogTitleMsgComp));

class JaneDialog extends Component<Props> {

    _joinConference: Function;

    constructor(props) {
        super(props);
        this._joinConference = this._joinConference.bind(this);
    }

    _joinConference() {
        const { joinConference } = this.props;

        updateParticipantReadyStatus('joined');
        joinConference();
    }

    _getStartDate() {
        const { jwtPayload } = this.props;
        const startAt = jwtPayload && jwtPayload.context && jwtPayload.context.start_at || '';

        if (startAt) {
            return (<p>
                {
                    getLocalizedDateFormatter(startAt).format('MMMM D, YYYY')
                }
            </p>);
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

        return (<p>
            {
                `${getLocalizedDateFormatter(startAt).format('h:mm')} -
            ${getLocalizedDateFormatter(endAt).format('h:mm A')}`
            }
        </p>);
    }

    _getDuration() {
        const { jwtPayload } = this.props;
        const startAt = jwtPayload && jwtPayload.context && jwtPayload.context.start_at || '';
        const endAt = jwtPayload && jwtPayload.context && jwtPayload.context.end_at || '';

        if (!startAt || !endAt) {
            return null;
        }
        const duration = getLocalizedDateFormatter(endAt).valueOf() - getLocalizedDateFormatter(startAt).valueOf();

        return (<p>
            {
                `${moment.duration(duration).asMinutes()} Minutes`
            }
        </p>);
    }

    _getBtnText() {
        const { participantType, authState } = this.props;

        if (authState === 'failed') {
            return participantType === 'StaffMember' ? 'Return to my Schedule' : 'Return to my account';
        }

        return participantType === 'StaffMember' ? 'Admit Client' : 'Begin';
    }

    _returnToMyAccount() {
        const { jwtPayload } = this.props;
        const { leave_waiting_area_url } = jwtPayload && jwtPayload.context;
        openURLInBrowser(leave_waiting_area_url);
    }

    render() {
        const {
            participantType,
            jwtPayload,
            remoteParticipantsStatuses,
            authState
        } = this.props;
        const localParticipantCanJoin = checkLocalParticipantCanJoin(remoteParticipantsStatuses, participantType);
        const { _joinConference } = this;

        return (<div className='jane-waiting-area-info-area-container'>
                <div className='jane-waiting-area-info-area'>
                    <div className='jane-waiting-area-info'>
                        <div className='jane-waiting-area-info-logo-wrapper'>
                            <div className='jane-waiting-area-info-logo'/>
                            {participantType === 'StaffMember' && localParticipantCanJoin &&
                            <p className='jane-waiting-area-info-patient-waiting'>Client
                                is waiting</p>}
                        </div>
                        <div className='jane-waiting-area-info-text-wrapper'>
                            <DialogTitle participantType={participantType}
                                         authState={authState}
                                         localParticipantCanJoin={localParticipantCanJoin}/>
                            <DialogTitleMsg participantType={participantType}
                                            authState={authState}
                                            localParticipantCanJoin={localParticipantCanJoin}/>
                            <div className='jane-waiting-area-info-detail'>
                                <p>
                                    {
                                        jwtPayload && jwtPayload.context && jwtPayload.context.treatment
                                    }
                                </p>
                                <p>
                                    {
                                        jwtPayload && jwtPayload.context && jwtPayload.context.practitioner_name
                                    }
                                </p>
                                {
                                    this._getStartDate()
                                }
                                {
                                    this._getStartTimeAndEndTime()
                                }
                                {
                                    this._getDuration()
                                }
                            </div>
                        </div>
                    </div>
                    {
                        <div
                            className='jane-waiting-area-preview-join-btn-container'>
                            {
                                authState !== 'failed' && <ActionButton
                                    onClick={_joinConference}
                                    disabled={!localParticipantCanJoin}
                                    type='primary'>
                                    {this._getBtnText()}
                                </ActionButton>
                            }
                            {
                                authState === 'failed' && <ActionButton
                                    onClick={this._returnToMyAccount.bind(this)}
                                    type='primary'>
                                    {this._getBtnText()}
                                </ActionButton>
                            }
                        </div>
                    }
                </div>
                <div className='jane-waiting-area-preview-btn-container'>
                    <AudioSettingsButton visible/>
                    <JaneHangupButton visible/>
                    <VideoSettingsButton visible/>
                </div>
            </div>
        );
    }
}

function mapStateToProps(state): Object {
    const { jwt } = state['features/base/jwt'];
    const { remoteParticipantsStatuses, authState } = state['features/jane-waiting-area'];
    const jwtPayload = jwt && jwtDecode(jwt) || null;
    const participant = jwtPayload && jwtPayload.context && jwtPayload.context.user || null;
    const participantType = participant && participant.participant_type || null;

    return {
        jwtPayload,
        participantType,
        participant,
        remoteParticipantsStatuses,
        authState
    };
}

function mapDispatchToProps(dispatch): Object {
    return {
        joinConference() {
            dispatch(joinConferenceAction());
        }
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(translate(JaneDialog));

// @flow
/* eslint-disable require-jsdoc,react/no-multi-comp,camelcase*/

import jwtDecode from 'jwt-decode';
import _ from 'lodash';
import moment from 'moment';
import React, { Component } from 'react';

import { getLocalizedDateFormatter, translate } from '../../../base/i18n';
import { getLocalParticipantType } from '../../../base/participants/functions';
import { connect } from '../../../base/redux';
import { openURLInBrowser } from '../../../base/util';
import JaneHangupButton from '../../../toolbox/components/JaneHangupButton';
import AudioSettingsButton
    from '../../../toolbox/components/web/AudioSettingsButton';
import VideoSettingsButton
    from '../../../toolbox/components/web/VideoSettingsButton';
import {
    joinConference as joinConferenceAction
} from '../../actions';
import {
    checkLocalParticipantCanJoin,
    updateParticipantReadyStatus
} from '../../functions';
import ActionButton from '../buttons/ActionButton';

type Props = {
    joinConference: Function,
    t: Function,
    jwtPayload: Object,
    participantType: string,
    participant: Object,
    authState: string,
    localParticipantCanJoin: boolean
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

    return <div className = 'jane-waiting-area-info-title'>{header}</div>;
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

    return <div className = 'jane-waiting-area-info-title-msg'>{title}</div>;
}

const DialogTitle = translate(DialogTitleComp);
const DialogTitleMsg = translate(DialogTitleMsgComp);

class JaneDialog extends Component<Props> {

    _joinConference: Function;
    _onFailed: Function;

    constructor(props) {
        super(props);
        this._joinConference = this._joinConference.bind(this);
        this._onFailed = this._onFailed.bind(this);
    }

    _joinConference() {
        const { joinConference } = this.props;

        updateParticipantReadyStatus('joined');
        joinConference();
    }

    _getStartDate() {
        const { jwtPayload } = this.props;
        const startAt = _.get(jwtPayload, 'context.start_at') ?? '';

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
        const startAt = _.get(jwtPayload, 'context.start_at') ?? '';
        const endAt = _.get(jwtPayload, 'context.end_at') ?? '';

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
        const startAt = _.get(jwtPayload, 'context.start_at') ?? '';
        const endAt = _.get(jwtPayload, 'context.end_at') ?? '';

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

    _onFailed() {
        const { jwtPayload } = this.props;
        const { leave_waiting_area_url } = jwtPayload && jwtPayload.context;

        openURLInBrowser(leave_waiting_area_url);
        updateParticipantReadyStatus('left');
    }

    render() {
        const {
            participantType,
            jwtPayload,
            localParticipantCanJoin,
            authState
        } = this.props;
        const { _joinConference } = this;

        return (<div className = 'jane-waiting-area-info-area-container'>
            <div className = 'jane-waiting-area-info-area'>
                <div className = 'jane-waiting-area-info'>
                    <div className = 'jane-waiting-area-info-logo-wrapper'>
                        <div className = 'jane-waiting-area-info-logo' />
                        {participantType === 'StaffMember' && localParticipantCanJoin
                            && <p className = 'jane-waiting-area-info-patient-waiting'>Client
                                is waiting</p>}
                    </div>
                    <div className = 'jane-waiting-area-info-text-wrapper'>
                        <DialogTitle
                            authState = { authState }
                            localParticipantCanJoin = { localParticipantCanJoin }
                            participantType = { participantType } />
                        <DialogTitleMsg
                            authState = { authState }
                            localParticipantCanJoin = { localParticipantCanJoin }
                            participantType = { participantType } />
                        <div className = 'jane-waiting-area-info-detail'>
                            <p>
                                {
                                    _.get(jwtPayload, 'context.treatment')
                                }
                            </p>
                            <p>
                                {
                                    _.get(jwtPayload, 'context.practitioner_name')
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
                        className = 'jane-waiting-area-preview-join-btn-container'>
                        {
                            authState !== 'failed' && <ActionButton
                                disabled = { !localParticipantCanJoin }

                                onClick = { _joinConference }
                                type = 'primary'>
                                {this._getBtnText()}
                            </ActionButton>
                        }
                        {
                            authState === 'failed' && <ActionButton
                                onClick = { this._onFailed }
                                type = 'primary'>
                                {this._getBtnText()}
                            </ActionButton>
                        }
                    </div>
                }
            </div>
            <div className = 'jane-waiting-area-preview-btn-container settings-button-container'>
                <AudioSettingsButton visible = { true } />
                <JaneHangupButton visible = { true } />
                <VideoSettingsButton visible = { true } />
            </div>
        </div>
        );
    }
}

function mapStateToProps(state): Object {
    const { jwt } = state['features/base/jwt'];
    const { authState } = state['features/jane-waiting-area'];
    const jwtPayload = jwt && jwtDecode(jwt) ?? null;
    const participantType = getLocalParticipantType(state);
    const localParticipantCanJoin = checkLocalParticipantCanJoin(state);

    return {
        jwtPayload,
        participantType,
        authState,
        localParticipantCanJoin
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

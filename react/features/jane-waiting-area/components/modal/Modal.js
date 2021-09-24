// @flow
/* eslint-disable require-jsdoc,react/no-multi-comp,camelcase*/

import jwtDecode from 'jwt-decode';
import _ from 'lodash';
import moment from 'moment';
import React, { Component } from 'react';

import { createWaitingAreaModalEvent, sendAnalytics } from '../../../analytics';
import { getLocalizedDateFormatter, translate } from '../../../base/i18n';
import { getLocalParticipantType } from '../../../base/participants/functions';
import { connect } from '../../../base/redux';
import { openURLInBrowser } from '../../../base/util';
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
    localParticipantCanJoin: boolean,
    isMobile: boolean
};

type DialogTitleProps = {
    t: Function,
    participantType: string,
    localParticipantCanJoin: boolean,
    authState: string,
    isMobile: boolean
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

    return <div className = 'jane-waiting-area-modal-title'>{header}</div>;
}

function DialogTitleMsgComp(props: DialogTitleProps) {
    let title;

    if (props.localParticipantCanJoin) {
        title = '';
        if (props.participantType === 'StaffMember') {
            title = props.t('janeWaitingArea.whenYouAreReady');
        }
    } else {
        title = `${props.t('janeWaitingArea.keepOpen')} ${props.t('janeWaitingArea.youMayTest')}`;
        if (props.participantType === 'Patient') {
            title = `${title} ${props.t('janeWaitingArea.callWillBegin')}`;
        }
    }

    if (props.authState === 'failed') {
        title = '';
    }

    if (title === '') {
        return null;
    }

    if (props.participantType === 'Patient' && props.isMobile) {
        return <>
            <div className = 'jane-waiting-area-modal-title-msg'>{props.t('janeWaitingArea.keepOpen')}</div>
            <div className = 'jane-waiting-area-modal-title-msg'>{props.t('janeWaitingArea.youMayTest')}</div>
            <div className = 'jane-waiting-area-modal-title-msg'>{props.t('janeWaitingArea.callWillBegin')}</div>
        </>;
    }

    return <div className = 'jane-waiting-area-modal-title-msg'>{title}</div>;
}

const DialogTitle = translate(DialogTitleComp);
const DialogTitleMsg = translate(DialogTitleMsgComp);

class Modal extends Component<Props> {

    _joinConference: Function;
    _onFailed: Function;
    _admitClient: Function;

    constructor(props) {
        super(props);
        this._joinConference = this._joinConference.bind(this);
        this._onFailed = this._onFailed.bind(this);
        this._admitClient = this._admitClient.bind(this);
    }

    _joinConference() {
        const { joinConference } = this.props;

        updateParticipantReadyStatus('joined');
        joinConference();
    }

    _admitClient() {
        sendAnalytics(createWaitingAreaModalEvent('admit.button.clicked'));
        this._joinConference();
    }

    componentDidUpdate(prevProps: Props) {
        const { localParticipantCanJoin, participantType } = this.props;

        if (localParticipantCanJoin !== prevProps.localParticipantCanJoin
            && localParticipantCanJoin) {
            if (participantType === 'Patient') {
                this._joinConference();
            }
            if (participantType === 'StaffMember') {
                sendAnalytics(createWaitingAreaModalEvent('admit.button.enabled'));
            }
        }
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
        const { jwtPayload, t } = this.props;
        const startAt = _.get(jwtPayload, 'context.start_at');
        const endAt = _.get(jwtPayload, 'context.end_at');
        const treatmentDuration = _.get(jwtPayload, 'context.treatment_duration');
        let duration;

        if (treatmentDuration) {
            duration = Number(treatmentDuration) / 60;
        }

        if (startAt && endAt && !treatmentDuration) {
            const ms = getLocalizedDateFormatter(endAt)
                .valueOf() - getLocalizedDateFormatter(startAt)
                .valueOf();

            duration = moment.duration(ms).asMinutes();
        }

        if (!duration) {
            return null;
        }

        return (<p>
            {
                t('janeWaitingArea.minutes', { duration })
            }
        </p>);
    }

    _getBtnText() {
        const { participantType, authState, t } = this.props;

        if (authState === 'failed') {
            return participantType === 'StaffMember'
                ? t('janeWaitingArea.returnToSchedule') : t('janeWaitingArea.returnToAccount');
        }

        return participantType === 'StaffMember' ? t('janeWaitingArea.admitClient') : t('janeWaitingArea.begin');
    }

    _onFailed() {
        const { jwtPayload } = this.props;
        const { leave_waiting_area_url } = jwtPayload && jwtPayload.context;

        openURLInBrowser(leave_waiting_area_url);
        setTimeout(() => {
            window.close();
        }, 1000);
    }

    render() {
        const {
            participantType,
            jwtPayload,
            localParticipantCanJoin,
            authState,
            t,
            isMobile
        } = this.props;
        const { _admitClient } = this;

        return (<div className = 'jane-waiting-area-modal'>
            <div className = 'jane-waiting-area-modal-dialog'>
                <div className = 'jane-waiting-area-modal-logo-wrapper'>
                    <div className = 'jane-waiting-area-modal-logo' />
                    {participantType === 'StaffMember' && localParticipantCanJoin
                    && <p className = 'jane-waiting-area-modal-patient-waiting-badge'>
                        {t('janeWaitingArea.clientIsWaiting')}</p>}
                </div>
                <div className = 'jane-waiting-area-modal-text-wrapper'>
                    <DialogTitle
                        authState = { authState }
                        localParticipantCanJoin = { localParticipantCanJoin }
                        participantType = { participantType } />
                    <DialogTitleMsg
                        authState = { authState }
                        isMobile = { isMobile }
                        localParticipantCanJoin = { localParticipantCanJoin }
                        participantType = { participantType } />
                    <div className = 'jane-waiting-area-modal-detail'>
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
                authState !== 'failed' && participantType === 'StaffMember' && <div
                    className = 'jane-waiting-area-preview-join-btn-container'>
                    <ActionButton
                        disabled = { !localParticipantCanJoin }
                        onClick = { _admitClient }
                        type = 'primary'>
                        {this._getBtnText()}
                    </ActionButton>
                </div>
            }
            {
                authState === 'failed' && <div
                    className = 'jane-waiting-area-preview-join-btn-container'>
                    <ActionButton
                        onClick = { this._onFailed }
                        type = 'primary'>
                        {this._getBtnText()}
                    </ActionButton>
                </div>
            }
        </div>);
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

export default connect(mapStateToProps, mapDispatchToProps)(translate(Modal));

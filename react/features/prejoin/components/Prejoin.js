// @flow

import React, { Component } from 'react';
import {
    joinConference as joinConferenceAction,
    joinConferenceWithoutAudio as joinConferenceWithoutAudioAction,
    setJoinByPhoneDialogVisiblity as setJoinByPhoneDialogVisiblityAction,
    setPrejoinName
} from '../actions';
import { getRoomName } from '../../base/conference';
import { translate } from '../../base/i18n';
import { connect } from '../../base/redux';
import ActionButton from './buttons/ActionButton';
import {
    areJoinByPhoneButtonsVisible,
    getPrejoinName,
    isDeviceStatusVisible,
    isJoinByPhoneDialogVisible
} from '../functions';
import { isGuest } from '../../invite';
import CopyMeetingUrl from './preview/CopyMeetingUrl';
import DeviceStatus from './preview/DeviceStatus';
import ParticipantName from './preview/ParticipantName';
import Preview from './preview/Preview';
import { VideoSettingsButton, AudioSettingsButton } from '../../toolbox';

type Props = {

    /**
     * Flag signaling if the device status is visible or not.
     */
    deviceStatusVisible: boolean,

    /**
     * Flag signaling if a user is logged in or not.
     */
    isAnonymousUser: boolean,

    /**
     * Joins the current meeting.
     */
    joinConference: Function,

    /**
     * Joins the current meeting without audio.
     */
    joinConferenceWithoutAudio: Function,

    /**
     * The name of the user that is about to join.
     */
    name: string,

    /**
     * Sets the name for the joining user.
     */
    setName: Function,

    /**
     * The name of the meeting that is about to be joined.
     */
    roomName: string,

    /**
     * Sets visibilit of the 'JoinByPhoneDialog'.
     */
    setJoinByPhoneDialogVisiblity: Function,

    /**
     * If 'JoinByPhoneDialog' is visible or not.
     */
    showDialog: boolean,

    /**
     * If join by phone buttons should be visible.
     */
    showJoinByPhoneButtons: boolean,

    /**
     * Used for translation.
     */
    t: Function,
};

/**
 * This component is displayed before joining a meeting.
 */
class Prejoin extends Component<Props> {
    /**
     * Initializes a new {@code Prejoin} instance.
     *
     * @inheritdoc
     */
    constructor(props) {
        super(props);

        this._showDialog = this._showDialog.bind(this);
    }

    _showDialog: () => void;

    /**
     * Displays the dialog for joining a meeting by phone.
     *
     * @returns {undefined}
     */
    _showDialog() {
        this.props.setJoinByPhoneDialogVisiblity(true);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            deviceStatusVisible,
            isAnonymousUser,
            joinConference,
            joinConferenceWithoutAudio,
            name,
            setName,
            showJoinByPhoneButtons,
            t
        } = this.props;
        const { _showDialog } = this;

        return (
            <div className = 'prejoin-full-page'>
                <Preview />
                <div className = 'prejoin-input-area-container'>
                    <div className = 'prejoin-input-area'>
                        <div className = 'prejoin-title'>
                            {t('prejoin.joinMeeting')}
                        </div>
                        <CopyMeetingUrl />
                        <ParticipantName
                            isEditable = { isAnonymousUser }
                            setName = { setName }
                            value = { name } />
                        <ActionButton
                            onClick = { joinConference }
                            type = 'primary'>
                            { t('calendarSync.join') }
                        </ActionButton>
                        {showJoinByPhoneButtons
                            && <div className = 'prejoin-text-btns'>
                                <ActionButton
                                    onClick = { joinConferenceWithoutAudio }
                                    type = 'text'>
                                    { t('prejoin.joinWithoutAudio') }
                                </ActionButton>
                                <ActionButton
                                    onClick = { _showDialog }
                                    type = 'text'>
                                    { t('prejoin.joinAudioByPhone') }
                                </ActionButton>
                            </div>}
                    </div>
                </div>
                <div className = 'prejoin-preview-btn-container'>
                    <AudioSettingsButton visible = { true } />
                    <VideoSettingsButton visible = { true } />
                </div>
                { deviceStatusVisible && <DeviceStatus /> }
            </div>
        );
    }
}

/**
 * Maps (parts of) the redux state to the React {@code Component} props.
 *
 * @param {Object} state - The redux state.
 * @returns {Object}
 */
function mapStateToProps(state): Object {
    return {
        isAnonymousUser: isGuest(state),
        deviceStatusVisible: isDeviceStatusVisible(state),
        name: getPrejoinName(state),
        roomName: getRoomName(state),
        showDialog: isJoinByPhoneDialogVisible(state),
        showJoinByPhoneButtons: areJoinByPhoneButtonsVisible(state)
    };
}

const mapDispatchToProps = {
    joinConferenceWithoutAudio: joinConferenceWithoutAudioAction,
    joinConference: joinConferenceAction,
    setJoinByPhoneDialogVisiblity: setJoinByPhoneDialogVisiblityAction,
    setName: setPrejoinName
};

export default connect(mapStateToProps, mapDispatchToProps)(translate(Prejoin));

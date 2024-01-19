import React from 'react';
import { WithTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { translate, translateToHTML } from '../../../base/i18n/functions';

/**
 * The type of the React {@code Component} props of {@link RecordingLimitNotificationDescription}.
 */
interface IProps extends WithTranslation {

    /**
     * The name of the app with unlimited recordings.
     */
    _appName?: string;

    /**
     * The URL to the app with unlimited recordings.
     */
    _appURL?: string;

    /**
     * The limit of time in minutes for the recording.
     */
    _limit?: number;

    /**
     * True if the notification is related to the livestreaming and false if not.
     */
    isLiveStreaming: Boolean;
}

/**
 * A component that renders the description of the notification for the recording initiator.
 *
 * @param {IProps} props - The props of the component.
 * @returns {Component}
 */
function RecordingLimitNotificationDescription(props: IProps) {
    const { _limit, _appName, _appURL, isLiveStreaming, t } = props;

    return (
        <span>
            {
                translateToHTML(
                    t,
                    `${isLiveStreaming ? 'liveStreaming' : 'recording'}.limitNotificationDescriptionWeb`, {
                        limit: _limit,
                        app: _appName,
                        url: _appURL
                    })
            }
        </span>
    );
}


/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState) {
    const { recordingLimit = {} } = state['features/base/config'];
    const { limit: _limit, appName: _appName, appURL: _appURL } = recordingLimit;

    return {
        _limit,
        _appName,
        _appURL
    };
}

export default translate(connect(_mapStateToProps)(RecordingLimitNotificationDescription));

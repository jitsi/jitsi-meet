// @flow

import React from 'react';

import { translate, translateToHTML } from '../../../base/i18n';
import { connect } from '../../../base/redux';

/**
 * The type of the React {@code Component} props of {@link RecordingLimitNotificationDescription}.
 */
type Props = {

    /**
     * The limit of time in minutes for the recording.
     */
    _limit: number,

    /**
     * The name of the app with unlimited recordings.
     */
    _appName: string,

    /**
     * The URL to the app with unlimited recordings.
     */
    _appURL: string,

    /**
     * True if the notification is related to the livestreaming and false if not.
     */
    isLiveStreaming: Boolean,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * A component that renders the description of the notification for the recording initiator.
 *
 * @param {Props} props - The props of the component.
 * @returns {Component}
 */
function RecordingLimitNotificationDescription(props: Props) {
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
 * Maps part of the Redix state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {Props}
 */
function _mapStateToProps(state): $Shape<Props> {
    const { recordingLimit = {} } = state['features/base/config'];
    const { limit: _limit, appName: _appName, appURL: _appURL } = recordingLimit;

    return {
        _limit,
        _appName,
        _appURL
    };
}

export default translate(connect(_mapStateToProps)(RecordingLimitNotificationDescription));

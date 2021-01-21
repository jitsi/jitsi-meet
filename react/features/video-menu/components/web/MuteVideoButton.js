/* @flow */

import React from 'react';

import { translate } from '../../../base/i18n';
import { IconCameraDisabled } from '../../../base/icons';
import { connect } from '../../../base/redux';
import AbstractMuteVideoButton, {
    _mapStateToProps,
    type Props
} from '../AbstractMuteVideoButton';

import VideoMenuButton from './VideoMenuButton';

/**
 * Implements a React {@link Component} which displays a button for disabling
 * the camera of a participant in the conference.
 *
 * NOTE: At the time of writing this is a button that doesn't use the
 * {@code AbstractButton} base component, but is inherited from the same
 * super class ({@code AbstractMuteVideoButton} that extends {@code AbstractButton})
 * for the sake of code sharing between web and mobile. Once web uses the
 * {@code AbstractButton} base component, this can be fully removed.
 */
class MuteVideoButton extends AbstractMuteVideoButton {
    /**
     * Instantiates a new {@code Component}.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this._handleClick = this._handleClick.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _videoTrackMuted, participantID, t } = this.props;
        const muteConfig = _videoTrackMuted ? {
            translationKey: 'videothumbnail.videoMuted',
            muteClassName: 'mutelink disabled'
        } : {
            translationKey: 'videothumbnail.domuteVideo',
            muteClassName: 'mutelink'
        };

        return (
            <VideoMenuButton
                buttonText = { t(muteConfig.translationKey) }
                displayClass = { muteConfig.muteClassName }
                icon = { IconCameraDisabled }
                id = { `mutelink_${participantID}` }
                // eslint-disable-next-line react/jsx-handler-names
                onClick = { this._handleClick } />
        );
    }

    _handleClick: () => void
}

export default translate(connect(_mapStateToProps)(MuteVideoButton));

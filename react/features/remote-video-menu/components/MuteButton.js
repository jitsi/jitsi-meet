import React, { Component } from 'react';

import { translate } from '../../base/i18n';

import RemoteVideoMenuButton from './RemoteVideoMenuButton';

/**
 * Implements a React {@link Component} which displays a button for audio muting
 * a participant in the conference.
 *
 * @extends Component
 */
class MuteButton extends Component {
    /**
     * {@code MuteButton} component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * Whether or not the participant is currently audio muted.
         */
        isAudioMuted: React.PropTypes.bool,

        /**
         * The callback to invoke when the component is clicked.
         */
        onClick: React.PropTypes.func,

        /**
         * The ID of the participant linked to the onClick callback.
         */
        participantID: React.PropTypes.string,

        /**
         * Invoked to obtain translated strings.
         */
        t: React.PropTypes.func
    };

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { isAudioMuted, onClick, participantID, t } = this.props;
        const muteConfig = isAudioMuted ? {
            translationKey: 'videothumbnail.muted',
            muteClassName: 'mutelink disabled'
        } : {
            translationKey: 'videothumbnail.domute',
            muteClassName: 'mutelink'
        };

        return (
            <RemoteVideoMenuButton
                buttonText = { t(muteConfig.translationKey) }
                displayClass = { muteConfig.muteClassName }
                iconClass = 'icon-mic-disabled'
                id = { `mutelink_${participantID}` }
                onClick = { onClick } />
        );
    }
}

export default translate(MuteButton);

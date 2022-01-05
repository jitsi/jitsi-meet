/* @flow */

import React from 'react';

import ContextMenuItem from '../../../base/components/context-menu/ContextMenuItem';
import { translate } from '../../../base/i18n';
import { IconMicrophoneEmptySlash } from '../../../base/icons';
import { connect } from '../../../base/redux';
import AbstractMuteButton, {
    _mapStateToProps,
    type Props
} from '../AbstractMuteButton';


/**
 * Implements a React {@link Component} which displays a button for audio muting
 * a participant in the conference.
 *
 * NOTE: At the time of writing this is a button that doesn't use the
 * {@code AbstractButton} base component, but is inherited from the same
 * super class ({@code AbstractMuteButton} that extends {@code AbstractButton})
 * for the sake of code sharing between web and mobile. Once web uses the
 * {@code AbstractButton} base component, this can be fully removed.
 */
class MuteButton extends AbstractMuteButton {
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
        const { _audioTrackMuted, t } = this.props;

        if (_audioTrackMuted) {
            return null;
        }

        return (
            <ContextMenuItem
                accessibilityLabel = { t('dialog.muteParticipantButton') }
                className = 'mutelink'
                icon = { IconMicrophoneEmptySlash }
                // eslint-disable-next-line react/jsx-handler-names
                onClick = { this._handleClick }
                text = { t('dialog.muteParticipantButton') } />
        );
    }

    _handleClick: () => void;
}

export default translate(connect(_mapStateToProps)(MuteButton));

/* @flow */

import React from 'react';

import { translate } from '../../../base/i18n';
import { IconCrown } from '../../../base/icons';
import { connect } from '../../../base/redux';
import AbstractGrantModeratorButton, {
    _mapStateToProps,
    type Props
} from '../AbstractGrantModeratorButton';

import VideoMenuButton from './VideoMenuButton';

declare var interfaceConfig: Object;

/**
 * Implements a React {@link Component} which displays a button for granting
 * moderator to a participant.
 */
class GrantModeratorButton extends AbstractGrantModeratorButton {
    /**
     * Instantiates a new {@code GrantModeratorButton}.
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
        const { participantID, t, visible } = this.props;

        if (!visible) {
            return null;
        }

        return (
            <VideoMenuButton
                buttonText = { t('videothumbnail.grantModerator') }
                displayClass = 'grantmoderatorlink'
                icon = { IconCrown }
                id = { `grantmoderatorlink_${participantID}` }
                // eslint-disable-next-line react/jsx-handler-names
                onClick = { this._handleClick } />
        );
    }

    _handleClick: () => void
}

export default translate(connect(_mapStateToProps)(GrantModeratorButton));

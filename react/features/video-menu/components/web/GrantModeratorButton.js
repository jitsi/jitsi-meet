/* @flow */

import React from 'react';

import { translate } from '../../../base/i18n';
import { IconModerator } from '../../../base/icons';
import { connect } from '../../../base/redux';
import ContextMenuItem from '../../../base/ui/components/web/ContextMenuItem';
import AbstractGrantModeratorButton, {
    type Props,
    _mapStateToProps
} from '../AbstractGrantModeratorButton';

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
        const { t, visible } = this.props;

        if (!visible) {
            return null;
        }

        return (
            <ContextMenuItem
                accessibilityLabel = { t('toolbar.accessibilityLabel.grantModerator') }
                className = 'grantmoderatorlink'
                icon = { IconModerator }
                // eslint-disable-next-line react/jsx-handler-names
                onClick = { this._handleClick }
                text = { t('videothumbnail.grantModerator') } />
        );
    }

    _handleClick: () => void;
}

export default translate(connect(_mapStateToProps)(GrantModeratorButton));

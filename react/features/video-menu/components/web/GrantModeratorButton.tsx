import React from 'react';
import { connect } from 'react-redux';

import { translate } from '../../../base/i18n/functions';
import { IconModerator } from '../../../base/icons/svg';
import ContextMenuItem from '../../../base/ui/components/web/ContextMenuItem';
import AbstractGrantModeratorButton, { IProps, _mapStateToProps } from '../AbstractGrantModeratorButton';

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
    constructor(props: IProps) {
        super(props);

        this._onClick = this._onClick.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { visible, t } = this.props;

        if (!visible) {
            return null;
        }

        return (
            <ContextMenuItem
                accessibilityLabel = { t('toolbar.accessibilityLabel.grantModerator') }
                className = 'grantmoderatorlink'
                icon = { IconModerator }
                // eslint-disable-next-line react/jsx-handler-names
                onClick = { this._onClick }
                text = { t('videothumbnail.grantModerator') } />
        );
    }

    _onClick: () => void;
}

export default translate(connect(_mapStateToProps)(GrantModeratorButton));

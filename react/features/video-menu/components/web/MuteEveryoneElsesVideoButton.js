// @flow

import React from 'react';

import ContextMenuItem from '../../../base/components/context-menu/ContextMenuItem';
import { translate } from '../../../base/i18n';
import { IconMuteVideoEveryoneElse } from '../../../base/icons';
import { connect } from '../../../base/redux';
import AbstractMuteEveryoneElsesVideoButton, {
    type Props
} from '../AbstractMuteEveryoneElsesVideoButton';

/**
 * Implements a React {@link Component} which displays a button for audio muting
 * every participant in the conference except the one with the given
 * participantID.
 */
class MuteEveryoneElsesVideoButton extends AbstractMuteEveryoneElsesVideoButton {
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
        const { t } = this.props;

        return (
            <ContextMenuItem
                accessibilityLabel = { t('toolbar.accessibilityLabel.muteEveryoneElsesVideoStream') }
                icon = { IconMuteVideoEveryoneElse }
                // eslint-disable-next-line react/jsx-handler-names
                onClick = { this._handleClick }
                text = { t('videothumbnail.domuteVideoOfOthers') } />
        );
    }

    _handleClick: () => void;
}

export default translate(connect()(MuteEveryoneElsesVideoButton));

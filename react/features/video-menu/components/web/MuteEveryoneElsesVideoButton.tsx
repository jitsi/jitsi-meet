import React from 'react';
import { connect } from 'react-redux';

import { translate } from '../../../base/i18n/functions';
import { IconVideoOff } from '../../../base/icons/svg';
import ContextMenuItem from '../../../base/ui/components/web/ContextMenuItem';
import AbstractMuteEveryoneElsesVideoButton, { IProps } from '../AbstractMuteEveryoneElsesVideoButton';

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
    constructor(props: IProps) {
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
                icon = { IconVideoOff }
                // eslint-disable-next-line react/jsx-handler-names
                onClick = { this._handleClick }
                text = { t('videothumbnail.domuteVideoOfOthers') } />
        );
    }

    _handleClick: () => void;
}

export default translate(connect()(MuteEveryoneElsesVideoButton));

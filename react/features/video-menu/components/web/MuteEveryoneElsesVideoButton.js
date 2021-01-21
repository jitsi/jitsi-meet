// @flow

import React from 'react';

import { translate } from '../../../base/i18n';
import { IconMuteVideoEveryoneElse } from '../../../base/icons';
import { connect } from '../../../base/redux';
import AbstractMuteEveryoneElsesVideoButton, {
    type Props
} from '../AbstractMuteEveryoneElsesVideoButton';

import VideoMenuButton from './VideoMenuButton';

/**
 * Implements a React {@link Component} which displays a button for audio muting
 * every participant in the conference except the one with the given
 * participantID
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
        const { participantID, t } = this.props;

        return (
            <VideoMenuButton
                buttonText = { t('videothumbnail.domuteVideoOfOthers') }
                displayClass = { 'mutelink' }
                icon = { IconMuteVideoEveryoneElse }
                id = { `mutelink_${participantID}` }
                // eslint-disable-next-line react/jsx-handler-names
                onClick = { this._handleClick } />
        );
    }

    _handleClick: () => void;
}

export default translate(connect()(MuteEveryoneElsesVideoButton));

// @flow

import React from 'react';

import { createToolbarEvent, sendAnalytics } from '../../../analytics';
import { openDialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { IconMuteEveryoneElse } from '../../../base/icons';
import { connect } from '../../../base/redux';

import AbstractMuteButton, {
    _mapStateToProps,
    type Props
} from '../AbstractMuteButton';
import MuteEveryoneDialog from './MuteEveryoneDialog';
import RemoteVideoMenuButton from './RemoteVideoMenuButton';

/**
 * Implements a React {@link Component} which displays a button for audio muting
 * every participant in the conference except the one with the given
 * participantID
 */
class MuteEveryoneElseButton extends AbstractMuteButton {
    /**
     * Instantiates a new {@code MuteEveryoneElseButton}.
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
            <RemoteVideoMenuButton
                buttonText = { t('videothumbnail.domuteOthers') }
                displayClass = { 'mutelink' }
                icon = { IconMuteEveryoneElse }
                id = { `mutelink_${participantID}` }
                // eslint-disable-next-line react/jsx-handler-names
                onClick = { this._handleClick } />
        );
    }

    _handleClick: () => void;

    /**
     * Handles clicking / pressing the button, and opens a confirmation dialog.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        const { dispatch, participantID } = this.props;

        sendAnalytics(createToolbarEvent('mute.everyoneelse.pressed'));
        dispatch(openDialog(MuteEveryoneDialog, { exclude: [ participantID ] }));
    }
}

export default translate(connect(_mapStateToProps)(MuteEveryoneElseButton));

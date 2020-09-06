// @flow

import React from 'react';

import { createToolbarEvent, sendAnalytics } from '../../../analytics';
import { openDialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { IconKickEveryoneElse } from '../../../base/icons';
import { connect } from '../../../base/redux';
import AbstractKickButton, {
    type Props
} from '../AbstractKickButton';

import KickEveryoneDialog from './KickEveryoneDialog';
import RemoteVideoMenuButton from './RemoteVideoMenuButton';

/**
 * Implements a React {@link Component} which displays a button for kicking
 * every participant in the conference except the one with the given
 * participantID
 */
class KickEveryoneElseButton extends AbstractKickButton {
    /**
     * Instantiates a new {@code KickEveryoneElseButton}.
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
                buttonText = { t('videothumbnail.dokickOthers') }
                displayClass = { 'kicklink' }
                icon = { IconKickEveryoneElse }
                id = { `kicklink_${participantID}` }
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

        sendAnalytics(createToolbarEvent('kick.everyoneelse.pressed'));
        dispatch(openDialog(KickEveryoneDialog, { exclude: [ participantID ] }));
    }
}

export default translate(connect(_ => _)(KickEveryoneElseButton));

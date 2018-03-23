// @flow

import React from 'react';
import { connect } from 'react-redux';

import { appNavigate } from '../../../app';
import { ColorPalette } from '../../../base/styles';

import ToolbarButton from '../ToolbarButton';
import styles from '../styles';

import AbstractHangupButton from './AbstractHangupButton';

/**
 * Component that renders a toolbar button for leaving the current conference.
 *
 * @extends Component
 */
class HangupButton extends AbstractHangupButton<*> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <ToolbarButton
                accessibilityLabel = 'Hangup'
                iconName = 'hangup'
                iconStyle = { styles.whitePrimaryToolbarButtonIcon }
                onClick = { this._onToolbarHangup }
                style = { styles.hangup }
                underlayColor = { ColorPalette.buttonUnderlay } />
        );
    }

    _onToolbarHangup: () => void;

    /**
     * Dispatches action to leave the current conference.
     *
     * @private
     * @returns {void}
     */
    _doHangup() {
        // XXX We don't know here which value is effectively/internally used
        // when there's no valid room name to join. It isn't our business to
        // know that anyway. The undefined value is our expression of (1) the
        // lack of knowledge & (2) the desire to no longer have a valid room
        // name to join.
        this.props.dispatch(appNavigate(undefined));
    }
}

export default connect()(HangupButton);

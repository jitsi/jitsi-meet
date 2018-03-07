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
class HangupButton extends AbstractHangupButton {
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
     * Creates an analytics toolbar event for and dispatches an action for
     * leaving the current conference.
     *
     * @private
     * @returns {void}
     */
    _doHangup() {
        this.props.dispatch(appNavigate(undefined));
    }
}

export default connect()(HangupButton);

// @flow

import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { appNavigate } from '../../../app';
import { ColorPalette } from '../../../base/styles';

import AbstractHangupButton from './AbstractHangupButton';
import ToolbarButton from '../ToolbarButton';
import styles from '../styles';

/**
 * Component that renders a toolbar button for leaving the current conference.
 *
 * @extends Component
 */
class HangupButton extends AbstractHangupButton {
    /**
     * {@code HangupButton} component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * Invoked to leave the conference.
         */
        dispatch: PropTypes.func
    };

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

    /**
     * Dispatches an action for leaving the current conference.
     *
     * @private
     * @returns {void}
     */
    _doHangup() {
        this.props.dispatch(appNavigate(undefined));
    }

    _onToolbarHangup: () => void;
}

export default connect()(HangupButton);

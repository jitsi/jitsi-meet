// @flow

import React from 'react';
import PropTypes from 'prop-types';

import { connect } from 'react-redux';

import { disconnect } from '../../../base/connection';
import { translate } from '../../../base/i18n';

import AbstractHangupButton from './AbstractHangupButton';
import ToolbarButtonV2 from '../ToolbarButtonV2';

/**
 * Component that renders a toolbar button for leaving the current conference.
 *
 * @extends Component
 */
export class HangupButton extends AbstractHangupButton {
    /**
     * Default values for {@code HangupButton} component's properties.
     *
     * @static
     */
    static defaultProps = {
        tooltipPosition: 'top'
    };

    /**
     * {@code HangupButton} component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * Invoked to trigger conference leave.
         */
        dispatch: PropTypes.func,

        /**
         * Invoked to obtain translated strings.
         */
        t: PropTypes.func,

        /**
         * Where the tooltip should display, relative to the button.
         */
        tooltipPosition: PropTypes.string
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { t, tooltipPosition } = this.props;

        return (
            <ToolbarButtonV2
                accessibilityLabel = 'Hangup'
                iconName = 'icon-hangup'
                onClick = { this._onToolbarHangup }
                tooltip = { t('toolbar.hangup') }
                tooltipPosition = { tooltipPosition } />
        );
    }

    _onToolbarHangup: () => void;

    /**
     * Dispatches an action for leaving the current conference.
     *
     * @private
     * @returns {void}
     */
    _doHangup() {
        this.props.dispatch(disconnect(true));
    }
}

export default translate(connect()(HangupButton));

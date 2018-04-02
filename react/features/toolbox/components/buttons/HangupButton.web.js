// @flow

import React from 'react';
import { connect } from 'react-redux';

import { disconnect } from '../../../base/connection';
import { translate } from '../../../base/i18n';

import AbstractHangupButton from './AbstractHangupButton';
import type {
    Props as AbstractHangupButtonProps
} from './AbstractHangupButton';
import ToolbarButtonV2 from '../ToolbarButtonV2';

/**
 * The type of the React {@link Component} props of {@link HangupButton}.
 */
type Props = AbstractHangupButtonProps & {

    /**
     * Invoked to obtain translated strings.
     */
    t: Function,

    /**
     * Where the tooltip should display, relative to the button.
     */
    tooltipPosition: string
};

/**
 * Component that renders a toolbar button for leaving the current conference.
 *
 * @extends Component
 */
export class HangupButton extends AbstractHangupButton<Props> {
    /**
     * Default values for {@code HangupButton} component's properties.
     *
     * @static
     */
    static defaultProps = {
        tooltipPosition: 'top'
    };

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

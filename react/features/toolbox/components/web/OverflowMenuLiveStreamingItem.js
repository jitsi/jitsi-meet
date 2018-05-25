import Tooltip from '@atlaskit/tooltip';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { translate } from '../../../base/i18n';

/**
 * React {@code Component} for starting or stopping a live streaming of the
 * current conference and displaying the current state of live streaming.
 *
 * @extends Component
 */
class OverflowMenuLiveStreamingItem extends Component {
    /**
     * Default values for {@code OverflowMenuLiveStreamingItem}
     * component's properties.
     *
     * @static
     */
    static defaultProps = {
        tooltipPosition: 'left',
        disabled: false
    };

    /**
     * The type of the React {@code Component} props of
     * {@link OverflowMenuLiveStreamingItem}.
     */
    static propTypes = {

        /**
         * Whether menu item is disabled or not.
         */
        disabled: PropTypes.bool,

        /**
         * The callback to invoke when {@code OverflowMenuLiveStreamingItem} is
         * clicked.
         */
        onClick: Function,

        /**
         * The current live streaming session, if any.
         */
        session: PropTypes.object,

        /**
         * Invoked to obtain translated strings.
         */
        t: Function,

        /**
         * The text to display in the tooltip.
         */
        tooltip: PropTypes.string,

        /**
         * From which direction the tooltip should appear, relative to the
         * button.
         */
        tooltipPosition: PropTypes.string
    };

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { disabled, onClick, session, t, tooltip, tooltipPosition }
            = this.props;

        const translationKey = session
            ? 'dialog.stopLiveStreaming'
            : 'dialog.startLiveStreaming';

        let className = 'overflow-menu-item';

        className += disabled ? ' disabled' : '';

        const button = (// eslint-disable-line no-extra-parens
            <span>
                <span className = 'profile-text'>
                    { t(translationKey) }
                </span>
                <span className = 'beta-tag'>
                    { t('recording.beta') }
                </span>
            </span>
        );

        return (
            <li
                aria-label = { t('dialog.accessibilityLabel.liveStreaming') }
                className = { className }
                onClick = { disabled ? null : onClick }>
                <span className = 'overflow-menu-item-icon'>
                    <i className = 'icon-public' />
                </span>
                { tooltip
                    ? <Tooltip
                        content = { tooltip }
                        position = { tooltipPosition }>
                        { button }
                    </Tooltip>
                    : button }
            </li>
        );
    }
}

export default translate(OverflowMenuLiveStreamingItem);

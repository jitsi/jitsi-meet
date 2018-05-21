// @flow

import React, { Component } from 'react';

import { translate } from '../../../base/i18n';

/**
 * The type of the React {@code Component} props of
 * {@link OverflowMenuLiveStreamingItem}.
 */
type Props = {

    /**
     * The callback to invoke when {@code OverflowMenuLiveStreamingItem} is
     * clicked.
     */
    onClick: Function,

    /**
     * The current live streaming session, if any.
     */
    session: ?Object,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * React {@code Component} for starting or stopping a live streaming of the
 * current conference and displaying the current state of live streaming.
 *
 * @extends Component
 */
class OverflowMenuLiveStreamingItem extends Component<Props> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { onClick, session, t } = this.props;

        const translationKey = session
            ? 'dialog.stopLiveStreaming'
            : 'dialog.startLiveStreaming';

        return (
            <li
                aria-label = 'Live stream'
                className = 'overflow-menu-item'
                onClick = { onClick }>
                <span className = 'overflow-menu-item-icon'>
                    <i className = 'icon-public' />
                </span>
                <span className = 'profile-text'>
                    { t(translationKey) }
                </span>
                <span className = 'beta-tag'>
                    { t('recording.beta') }
                </span>
            </li>
        );
    }
}

export default translate(OverflowMenuLiveStreamingItem);

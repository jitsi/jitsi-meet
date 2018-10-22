// @flow

import React, { Component } from 'react';
import Tooltip from '@atlaskit/tooltip';

import { translate } from '../../base/i18n';

/**
 * The type of the React {@code Component} props of {@link JoinButton}.
 */
type Props = {

    /**
     * The function called when the button is pressed.
     */
    onPress: Function,

    /**
     * The meeting URL associated with the {@link JoinButton} instance.
     */
    url: string,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * A React Component for joining an existing calendar meeting.
 *
 * @extends Component
 */
class JoinButton extends Component<Props> {

    /**
     * Initializes a new {@code JoinButton} instance.
     *
     * @param {*} props - The read-only properties with which the new instance
     * is to be initialized.
     */
    constructor(props) {
        super(props);

        // Bind event handler so it is only bound once for every instance.
        this._onClick = this._onClick.bind(this);
    }

    /**
     * Implements React's {@link Component#render}.
     *
     * @inheritdoc
     */
    render() {
        const { t } = this.props;

        return (
            <Tooltip
                content = { t('calendarSync.joinTooltip') }>
                <div
                    className = 'button join-button'
                    onClick = { this._onClick }>
                    { t('calendarSync.join') }
                </div>
            </Tooltip>
        );
    }

    _onClick: (Object) => void;

    /**
     * Callback invoked when the component is clicked.
     *
     * @param {Object} event - The DOM click event.
     * @private
     * @returns {void}
     */
    _onClick(event) {
        this.props.onPress(event, this.props.url);
    }
}

export default translate(JoinButton);

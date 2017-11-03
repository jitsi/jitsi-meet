import { ToggleStateless } from '@atlaskit/toggle';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { translate } from '../../base/i18n';

import { default as Notification } from './Notification';
import { NOTIFICATION_TYPE } from '../constants';

/**
 * React {@code Component} for displaying a notification with a toggle element.
 *
 * @extends Component
 */
class NotificationWithToggle extends Component {
    /**
     * {@code NotificationWithToggle} component's property types.
     *
     * @static
     */
    static propTypes = {
        ...Notification.propTypes,

        /**
         * Any additional text to display at the end of the notification message
         * body.
         */
        additionalMessage: PropTypes.string,

        /**
         * Optional callback to invoke when the notification is dismissed. The
         * current value of the toggle element will be passed in.
         */
        onToggleSubmit: PropTypes.func,

        /**
         * Whether or not the toggle element should be displayed.
         */
        showToggle: PropTypes.bool,

        /**
         * Translation key for a message to display at the top of the
         * notification body.
         */
        subtitleKey: PropTypes.string,

        /*
         * The translation key to be used as a label describing what setting the
         * toggle will change.
         */
        toggleLabelKey: PropTypes.string
    };

    /**
     * Initializes a new {@code NotificationWithToggle} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this.state = {
            /**
             * Whether or not the toggle element is active/checked/selected.
             *
             * @type {boolean}
             */
            isToggleChecked: false
        };

        // Bind event handlers so they are only bound once for every instance.
        this._onDismissed = this._onDismissed.bind(this);
        this._onToggleChange = this._onToggleChange.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <Notification
                appearance = { NOTIFICATION_TYPE.WARNING }
                { ...this.props }
                description = { this._renderDescription() } />
        );
    }

    /**
     * Calls back into {@code FlagGroup} to dismiss the notification. Optionally
     * will execute a passed in onToggleSubmit callback with the current state
     * of the toggle element.
     *
     * @private
     * @returns {void}
     */
    _onDismissed() {
        const { onDismissed, onToggleSubmit, showToggle, uid } = this.props;

        if (showToggle && onToggleSubmit) {
            onToggleSubmit(this.state.isToggleChecked);
        }

        onDismissed(uid);
    }

    /**
     * Updates the current known state of the toggle selection.
     *
     * @param {Object} event - The DOM event from changing the toggle selection.
     * @private
     * @returns {void}
     */
    _onToggleChange(event) {
        this.setState({
            isToggleChecked: event.target.checked
        });
    }

    /**
     * Creates a React Element for displaying the notification message as well
     * as a toggle.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderDescription() {
        const {
            additionalMessage,
            descriptionKey,
            showToggle,
            subtitleKey,
            t,
            toggleLabelKey
        } = this.props;

        return (
            <div className = 'notification-with-toggle'>
                <div>{ t(subtitleKey) }</div>
                { descriptionKey ? <div>{ t(descriptionKey) }</div> : null }
                { additionalMessage ? <div>{ additionalMessage }</div>
                    : null }
                { showToggle
                    ? <div>
                        { t(toggleLabelKey) }
                        <ToggleStateless
                            isChecked
                                = { this.state.isToggleChecked }
                            onChange = { this._onToggleChange } />
                    </div>
                    : null }
            </div>
        );
    }
}

export default translate(NotificationWithToggle);

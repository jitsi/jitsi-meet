import Flag from '@atlaskit/flag';
import WarningIcon from '@atlaskit/icon/glyph/warning';
import { ToggleStateless } from '@atlaskit/toggle';
import React, { Component } from 'react';

import { translate } from '../../base/i18n';

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
        /**
         * Any additional text to display at the end of the notification message
         * body.
         */
        additionalMessage: React.PropTypes.string,

        /**
         * Whether or not the dismiss button should be displayed. This is passed
         * in by {@code FlagGroup}.
         */
        isDismissAllowed: React.PropTypes.bool,

        /**
         * The translation key to be used as the main body of the notification.
         */
        messageKey: React.PropTypes.string,

        /**
         * Callback invoked when the user clicks to dismiss the notification.
         * This is passed in by {@code FlagGroup}.
         */
        onDismissed: React.PropTypes.func,

        /**
         * Optional callback to invoke when the notification is dismissed. The
         * current value of the toggle element will be passed in.
         */
        onToggleSubmit: React.PropTypes.func,

        /**
         * Whether or not the toggle element should be displayed.
         */
        showToggle: React.PropTypes.bool,

        /**
         * Translation key for a message to display at the top of the
         * notification body.
         */
        subtitleKey: React.PropTypes.string,

        /**
         * Invoked to obtain translated strings.
         */
        t: React.PropTypes.func,

        /**
         * The translation key to be used as the title of the notification.
         */
        titleKey: React.PropTypes.string,

        /*
         * The translation key to be used as a label describing what setting the
         * toggle will change.
         */
        toggleLabelKey: React.PropTypes.string,

        /**
         * The unique identifier for the notification. Passed back by the
         * {@code Flag} component in the onDismissed callback.
         */
        uid: React.PropTypes.number
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
        const {
            isDismissAllowed,
            t,
            titleKey,
            uid
        } = this.props;

        return (
            <Flag
                actions = { [
                    {
                        content: t('dialog.Ok'),
                        onClick: this._onDismissed
                    }
                ] }
                appearance = 'warning'
                description = { this._renderDescription() }
                icon = { (
                    <WarningIcon
                        label = 'Warning'
                        size = 'medium' />
                ) }
                id = { uid }
                isDismissAllowed = { isDismissAllowed }
                onDismissed = { this._onDismissed }
                title = { t(titleKey) } />
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
            messageKey,
            showToggle,
            subtitleKey,
            t,
            toggleLabelKey
        } = this.props;

        return (
            <div className = 'notification-with-toggle'>
                <div>{ t(subtitleKey) }</div>
                { messageKey ? <div>{ t(messageKey) }</div> : null }
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

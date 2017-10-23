import Flag from '@atlaskit/flag';
import EditorInfoIcon from '@atlaskit/icon/glyph/editor/info';
import PropTypes from 'prop-types';
import ErrorIcon from '@atlaskit/icon/glyph/error';
import WarningIcon from '@atlaskit/icon/glyph/warning';
import React, { Component } from 'react';

import { translate } from '../../base/i18n';

declare var interfaceConfig: Object;

/**
 * Implements a React {@link Component} to display a notification.
 *
 * @extends Component
 */
class Notification extends Component {
    /**
     * Default values for {@code Notification} component's properties.
     *
     * @static
     */
    static defaultProps = {
        appearance: 'normal'
    };

    /**
     * {@code Notification} component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * Display appearance for the component, passed directly to
         * {@code Flag}.
         */
        appearance: PropTypes.string,

        /**
         * The text to display in the body of the notification. If not passed
         * in, the passed in descriptionKey will be used.
         */
        defaultTitleKey: PropTypes.string,

        description: PropTypes.string,

        /**
         * The translation arguments that may be necessary for the description.
         */
        descriptionArguments: PropTypes.object,

        /**
         * The translation key to use as the body of the notification.
         */
        descriptionKey: PropTypes.string,

        /**
         * Whether or not the dismiss button should be displayed. This is passed
         * in by {@code FlagGroup}.
         */
        isDismissAllowed: PropTypes.bool,

        /**
         * Callback invoked when the user clicks to dismiss the notification.
         * this is passed in by {@code FlagGroup}.
         */
        onDismissed: PropTypes.func,

        /**
         * Invoked to obtain translated strings.
         */
        t: PropTypes.func,

        /**
         * The text to display at the top of the notification. If not passed in,
         * the passed in titleKey will be used.
         */
        title: PropTypes.string,

        /**
         * The translation key to display as the title of the notification if
         * no title is provided.
         */
        titleKey: PropTypes.string,

        /**
         * The unique identifier for the notification. Passed back by the
         * {@code Flag} component in the onDismissed callback.
         */
        uid: PropTypes.number
    };

    /**
     * Initializes a new {@code Notification} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        // Bind event handler so it is only bound once for every instance.
        this._onDismissed = this._onDismissed.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            appearance,
            titleKey,
            descriptionArguments,
            descriptionKey,
            description,
            isDismissAllowed,
            onDismissed,
            t,
            title,
            uid
        } = this.props;

        return (
            <Flag
                actions = { this._mapAppearanceToButtons() }
                appearance = { appearance }
                description = { description
                    || t(descriptionKey, descriptionArguments) }
                icon = { this._mapAppearanceToIcon() }
                id = { uid }
                isDismissAllowed = { isDismissAllowed }
                onDismissed = { onDismissed }
                title = { title || t(titleKey) } />
        );
    }

    /**
     * Calls back into {@code FlagGroup} to dismiss the notification.
     *
     * @private
     * @returns {void}
     */
    _onDismissed() {
        this.props.onDismissed(this.props.uid);
    }

    /**
     * Opens the support page.
     *
     * @returns {void}
     * @private
     */
    _onOpenLink() {
        window.open(interfaceConfig.SUPPORT_URL, '_blank');
    }

    /**
     * Creates action button configurations for the notification based on
     * notification appearance.
     *
     * @private
     * @returns {Object[]}
     */
    _mapAppearanceToButtons() {
        switch (this.props.appearance) {
        case 'error':
            return [
                {
                    content: this.props.t('dialog.dismiss'),
                    onClick: this._onDismissed
                },
                {
                    content: this.props.t('dialog.contactSupport'),
                    onClick: this._onOpenLink
                }
            ];
        case 'warning':
            return [
                {
                    content: this.props.t('dialog.Ok'),
                    onClick: this._onDismissed
                },
                {
                    content: this.props.t('dialog.contactSupport'),
                    onClick: this._onOpenLink
                }
            ];

        default:
            return [];
        }
    }

    /**
     * Creates an icon component depending on the configured notification
     * appearance.
     *
     * @private
     * @returns {ReactElement}
     */
    _mapAppearanceToIcon() {
        switch (this.props.appearance) {
        case 'error':
            return (
                <ErrorIcon
                    label = 'error'
                    size = 'medium' />
            );

        case 'warning' :
            return (
                <WarningIcon
                    label = 'Warning'
                    size = 'medium' />
            );

        default:
            return (
                <EditorInfoIcon
                    label = 'info'
                    size = 'medium' />
            );
        }
    }
}

export default translate(Notification);

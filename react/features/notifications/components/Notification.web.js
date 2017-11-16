// @flow

import Flag from '@atlaskit/flag';
import EditorInfoIcon from '@atlaskit/icon/glyph/editor/info';
import ErrorIcon from '@atlaskit/icon/glyph/error';
import WarningIcon from '@atlaskit/icon/glyph/warning';
import { colors } from '@atlaskit/theme';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { translate } from '../../base/i18n';

import { NOTIFICATION_TYPE } from '../constants';

declare var interfaceConfig: Object;

/**
 * Secondary colors for notification icons.
 *
 * @type {{error, info, normal, success, warning}}
 */
const ICON_COLOR = {
    error: colors.R400,
    info: colors.N500,
    normal: colors.N0,
    success: colors.G400,
    warning: colors.Y200
};

/**
 * Implements a React {@link Component} to display a notification.
 *
 * @extends Component
 */
class Notification extends Component<*> {
    /**
     * Default values for {@code Notification} component's properties.
     *
     * @static
     */
    static defaultProps = {
        appearance: NOTIFICATION_TYPE.NORMAL
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

        /**
         * The description string.
         */
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
         * Whether the support link should be hidden in the case of an error
         * message.
         */
        hideErrorSupportLink: PropTypes.bool,

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
            hideErrorSupportLink,
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
                actions = { this._mapAppearanceToButtons(hideErrorSupportLink) }
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

    _onDismissed: () => void;

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
    _onOpenSupportLink() {
        window.open(interfaceConfig.SUPPORT_URL, '_blank', 'noopener');
    }

    /**
     * Creates action button configurations for the notification based on
     * notification appearance.
     *
     * @param {boolean} hideErrorSupportLink - Indicates if the support link
     * should be hidden in the error messages.
     * @private
     * @returns {Object[]}
     */
    _mapAppearanceToButtons(hideErrorSupportLink) {
        switch (this.props.appearance) {
        case NOTIFICATION_TYPE.ERROR: {
            const buttons = [
                {
                    content: this.props.t('dialog.dismiss'),
                    onClick: this._onDismissed
                }
            ];

            if (!hideErrorSupportLink) {
                buttons.push({
                    content: this.props.t('dialog.contactSupport'),
                    onClick: this._onOpenSupportLink
                });
            }

            return buttons;
        }
        case NOTIFICATION_TYPE.WARNING:
            return [
                {
                    content: this.props.t('dialog.Ok'),
                    onClick: this._onDismissed
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
        const appearance = this.props.appearance;
        const secIconColor = ICON_COLOR[this.props.appearance];
        const iconSize = 'medium';

        switch (appearance) {
        case NOTIFICATION_TYPE.ERROR:
            return (
                <ErrorIcon
                    label = { appearance }
                    secondaryColor = { secIconColor }
                    size = { iconSize } />
            );

        case NOTIFICATION_TYPE.WARNING:
            return (
                <WarningIcon
                    label = { appearance }
                    secondaryColor = { secIconColor }
                    size = { iconSize } />
            );

        default:
            return (
                <EditorInfoIcon
                    label = { appearance }
                    secondaryColor = { secIconColor }
                    size = { iconSize } />
            );
        }
    }
}

export default translate(Notification);

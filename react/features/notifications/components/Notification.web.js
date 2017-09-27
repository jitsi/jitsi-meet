import Flag from '@atlaskit/flag';
import EditorInfoIcon from '@atlaskit/icon/glyph/editor/info';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { translate } from '../../base/i18n';

/**
 * Implements a React {@link Component} to display a notification.
 *
 * @extends Component
 */
class Notification extends Component {
    /**
     * {@code Notification} component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * The translation key to display as the title of the notification if
         * no title is provided.
         */
        defaultTitleKey: PropTypes.string,

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
         * the passed in defaultTitleKey will be used.
         */
        title: PropTypes.string,

        /**
         * The unique identifier for the notification. Passed back by the
         * {@code Flag} component in the onDismissed callback.
         */
        uid: PropTypes.number
    };

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            defaultTitleKey,
            descriptionArguments,
            descriptionKey,
            isDismissAllowed,
            onDismissed,
            t,
            title,
            uid
        } = this.props;

        return (
            <Flag
                appearance = 'normal'
                description = { t(descriptionKey, descriptionArguments) }
                icon = { (
                    <EditorInfoIcon
                        label = 'info'
                        size = 'medium' />
                ) }
                id = { uid }
                isDismissAllowed = { isDismissAllowed }
                onDismissed = { onDismissed }
                title = { title || t(defaultTitleKey) } />
        );
    }
}

export default translate(Notification);

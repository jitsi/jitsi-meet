// @flow

import { Component } from 'react';

import { NOTIFICATION_TYPE } from '../constants';

export type Props = {

    /**
     * Display appearance for the component, passed directly to the
     * notification.
     */
    appearance: string,

    /**
     * Callback invoked when the custom button is clicked.
     */
    customActionHandler: Function,

    /**
     * The text to display as button in the notification for the custom action.
     */
    customActionNameKey: string,

    /**
     * The text to display in the body of the notification. If not passed
     * in, the passed in descriptionKey will be used.
     */
    defaultTitleKey: string,

    /**
     * A description string that can be used in addition to the prop
     * descriptionKey.
     */
    description: string,

    /**
     * The translation arguments that may be necessary for the description.
     */
    descriptionArguments: Object,

    /**
     * The translation key to use as the body of the notification.
     */
    descriptionKey: string,

    /**
     * Whether the support link should be hidden in the case of an error
     * message.
     */
    hideErrorSupportLink: boolean,

    /**
     * Whether or not the dismiss button should be displayed.
     */
    isDismissAllowed: boolean,

    /**
     * Maximum lines of the description.
     */
    maxLines: ?number,

    /**
     * Callback invoked when the user clicks to dismiss the notification.
     */
    onDismissed: Function,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function,

    /**
     * The text to display at the top of the notification. If not passed in,
     * the passed in titleKey will be used.
     */
    title: string,

    /**
     * The translation arguments that may be necessary for the title.
     */
    titleArguments: Object,

    /**
     * The translation key to display as the title of the notification if
     * no title is provided.
     */
    titleKey: string,

    /**
     * The unique identifier for the notification.
     */
    uid: number
};

/**
 * Abstract class for {@code Notification} component.
 *
 * @extends Component
 */
export default class AbstractNotification<P: Props> extends Component<P> {
    /**
     * Default values for {@code Notification} component's properties.
     *
     * @static
     */
    static defaultProps = {
        appearance: NOTIFICATION_TYPE.NORMAL,
        isDismissAllowed: true
    };

    /**
     * Initializes a new {@code Notification} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: P) {
        super(props);

        // Bind event handler so it is only bound once for every instance.
        this._onDismissed = this._onDismissed.bind(this);
    }

    _getDescription: () => Array<string>

    /**
     * Returns the description array to be displayed.
     *
     * @protected
     * @returns {Array<string>}
     */
    _getDescription() {
        const {
            description,
            descriptionArguments,
            descriptionKey,
            t
        } = this.props;

        const descriptionArray = [];

        descriptionKey
            && descriptionArray.push(t(descriptionKey, descriptionArguments));

        description && descriptionArray.push(description);

        return descriptionArray;
    }

    _getDescriptionKey: () => string

    /**
     * Returns the description key that was used if any.
     *
     * @protected
     * @returns {string}
     */
    _getDescriptionKey() {
        return this.props.descriptionKey;
    }

    _onDismissed: () => void;

    /**
     * Callback to dismiss the notification.
     *
     * @private
     * @returns {void}
     */
    _onDismissed() {
        this.props.onDismissed(this.props.uid);
    }
}

import { Component } from 'react';

/**
 * The type of the React {@code Component} props of {@link AbstractDialogTab}.
 */
export interface IProps {

    /**
     * Callback to invoke on change.
     */
    onTabStateChange: Function;

    /**
     * The id of the tab.
     */
    tabId: number;
}


/**
 * Abstract React {@code Component} for tabs of the DialogWithTabs component.
 *
 * @augments Component
 */
class AbstractDialogTab<P extends IProps, S> extends Component<P, S> {
    /**
     * Initializes a new {@code AbstractDialogTab} instance.
     *
     * @param {P} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: P) {
        super(props);

        // Bind event handler so it is only bound once for every instance.
        this._onChange = this._onChange.bind(this);
    }

    /**
     * Uses the onTabStateChange function to pass the changed state of the
     * controlled tab component to the controlling DialogWithTabs component.
     *
     * @param {Object} change - Object that contains the changed property and
     * value.
     * @returns {void}
     */
    _onChange(change: Object) {
        const { onTabStateChange, tabId } = this.props;

        onTabStateChange(tabId, {
            ...this.props,
            ...change
        });
    }

}

export default AbstractDialogTab;

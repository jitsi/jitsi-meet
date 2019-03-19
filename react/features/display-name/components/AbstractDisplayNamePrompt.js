// @flow

import { Component } from 'react';
import type { Dispatch } from 'redux';

import { updateSettings } from '../../base/settings';

/**
 * The type of the React {@code Component} props of
 * {@link AbstractDisplayNamePrompt}.
 */
export type Props = {

    /**
     * Invoked to update the local participant's display name.
     */
    dispatch: Dispatch<any>,

    /**
     * Function to be invoked after a successful display name change.
     */
    onPostSubmit: ?Function,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * Implements an abstract class for {@code DisplayNamePrompt}.
 */
export default class AbstractDisplayNamePrompt<S: *>
    extends Component<Props, S> {
    /**
     * Instantiates a new component.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this._onSetDisplayName = this._onSetDisplayName.bind(this);
    }

    _onSetDisplayName: string => boolean;

    /**
     * Dispatches an action to update the local participant's display name. A
     * name must be entered for the action to dispatch.
     *
     * It returns a boolean to comply the Dialog behaviour:
     *     {@code true} - the dialog should be closed.
     *     {@code false} - the dialog should be left open.
     *
     * @param {string} displayName - The display name to save.
     * @returns {boolean}
     */
    _onSetDisplayName(displayName) {
        if (!displayName || !displayName.trim()) {
            return false;
        }

        const { dispatch, onPostSubmit } = this.props;

        // Store display name in settings
        dispatch(updateSettings({
            displayName
        }));

        onPostSubmit && onPostSubmit();

        return true;
    }
}

import { Component } from 'react';
import { WithTranslation } from 'react-i18next';

import { IStore } from '../../app/types';
import { updateSettings } from '../../base/settings/actions';

/**
 * The type of the React {@code Component} props of
 * {@link AbstractDisplayNamePrompt}.
 */
export interface IProps extends WithTranslation {

    /**
     * Invoked to update the local participant's display name.
     */
    dispatch: IStore['dispatch'];

    /**
     * Function to be invoked after a successful display name change.
     */
    onPostSubmit?: Function;
}

/**
 * Implements an abstract class for {@code DisplayNamePrompt}.
 */
export default class AbstractDisplayNamePrompt<S>
    extends Component<IProps, S> {
    /**
     * Instantiates a new component.
     *
     * @inheritdoc
     */
    constructor(props: IProps) {
        super(props);

        this._onSetDisplayName = this._onSetDisplayName.bind(this);
    }

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
    _onSetDisplayName(displayName: string) {
        if (!displayName || !displayName.trim()) {
            return false;
        }

        const { dispatch, onPostSubmit } = this.props;

        // Store display name in settings
        dispatch(updateSettings({
            displayName
        }));

        onPostSubmit?.();

        return true;
    }
}

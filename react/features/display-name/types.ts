import { WithTranslation } from 'react-i18next';

import { IStore } from '../app/types';

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

    /**
     * Function to be invoked after a display name change.
     */
    validateInput?: Function;
}

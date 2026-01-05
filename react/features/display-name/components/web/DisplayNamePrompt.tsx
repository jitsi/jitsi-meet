import {useState} from "react";

import Dialog from '../../../base/ui/components/web/Dialog';
import Input from '../../../base/ui/components/web/Input';
import {onSetDisplayName} from '../../functions';
import {IProps} from '../../types';

const INITIAL_DISPLAY_NAME = '';

/**
 * Implements a React function component for displaying a dialog with a field
 * for setting the local participant's display name.
 */
const DisplayNamePrompt = (props: IProps) => {
    // State for the entered display name.
    const [displayName, setDisplayName] = useState(INITIAL_DISPLAY_NAME);

    // State for input validation result.
    const [isValid, setIsValid] = useState(
        props.validateInput ? props.validateInput(INITIAL_DISPLAY_NAME) : true
    );

    /**
     * Creates a function that dispatches an action to update
     * the local participant's display name.
     */
    const _onSetDisplayName = onSetDisplayName(props.dispatch, props.onPostSubmit);

    /**
     * Updates the entered display name and validates it if needed.
     *
     * @param {string} value - The new value of the input.
     */
    const _onDisplayNameChange = (value: string) => {
        if (props.validateInput) {
            setDisplayName(value);
            setIsValid(props.validateInput(value));
            return;
        }
        setDisplayName(value);
    };

    /**
     * Dispatches an action to update the local participant's display name.
     *
     * @returns {boolean}
     */
    const _onSubmit = () => {
        return _onSetDisplayName(displayName);
    };

    const disableCloseDialog = Boolean(props.validateInput);

    return (
        <Dialog
            cancel={{hidden: true}}
            disableBackdropClose={disableCloseDialog}
            disableEnter={!isValid}
            disableEscape={disableCloseDialog}
            hideCloseButton={disableCloseDialog}
            ok={{
                disabled: !isValid,
                translationKey: 'dialog.Ok'
            }}
            onSubmit={_onSubmit}
            titleKey='dialog.displayNameRequired'>
            <Input
                autoFocus={true}
                className='dialog-bottom-margin'
                id='dialog-displayName'
                label={props.t('dialog.enterDisplayName')}
                name='displayName'
                onChange={_onDisplayNameChange}
                type='text'
                value={displayName}/>
        </Dialog>
    );

}

export default DisplayNamePrompt;

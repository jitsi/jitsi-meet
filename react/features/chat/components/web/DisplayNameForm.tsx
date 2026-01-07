import { useState } from 'react';
import { WithTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { IStore } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import { updateSettings } from '../../../base/settings/actions';
import Button from '../../../base/ui/components/web/Button';
import Input from '../../../base/ui/components/web/Input';

import KeyboardAvoider from './KeyboardAvoider';

/**
 * The type of the React {@code Component} props of {@DisplayNameForm}.
 */
interface IProps extends WithTranslation {

    /**
     * Invoked to set the local participant display name.
     */
    dispatch: IStore['dispatch'];

    /**
     * Whether CC tab is enabled or not.
     */
    isCCTabEnabled: boolean;

    /**
     * Whether chat is disabled.
     */
    isChatDisabled: boolean;

    /**
     * Whether file sharing is enabled.
     */
    isFileSharingEnabled: boolean;

    /**
     * Whether the polls feature is enabled or not.
     */
    isPollsEnabled: boolean;
}

/**
 * React functional component for requesting the local participant to set a display name.
 */

const DisplayNameForm = (props: IProps) => {
    const [ displayName, setDisplayName ] = useState('');

    /**
     * Dispatches an action update the entered display name.
     *
     * @param {string} value - Keyboard event.
     * @private
     * @returns {void}
     */
    const _onDisplayNameChange = (value: string): void => {
        setDisplayName(value);
    }

    /**
     * Dispatches an action to hit enter to change your display name.
     *
     * @param {event} event - Keyboard event
     * that will check if user has pushed the enter key.
     * @private
     * @returns {void}
     */
    const _onSubmit = (event: any): void => {
        event?.preventDefault?.();

        // Store display name in settings
        props.dispatch(updateSettings({
            displayName: displayName
        }));
    }

    /**
     * KeyPress handler for accessibility.
     *
     * @param {React.KeyboardEvent} e - The key event to handle.
     *
     * @returns {void}
     */
    const _onKeyPress = (e: React.KeyboardEvent)=> {
        if (e.key === ' ' || e.key === 'Enter') {
            _onSubmit(e);
        }
    }

    const {
        isCCTabEnabled,
        isChatDisabled,
        isFileSharingEnabled,
        isPollsEnabled,
        t
    } = props;

    // Build array of enabled feature names (translated).
    const features : string[] = [
        !isChatDisabled ? t('chat.nickname.featureChat') : '',
        isPollsEnabled ? t('chat.nickname.featurePolls') : '',
        isFileSharingEnabled ? t('chat.nickname.featureFileSharing') : '',
        isCCTabEnabled ? t('chat.nickname.featureClosedCaptions') : ''
    ].filter(Boolean);

    // Return null if no features available - component won't render.
    if (features.length === 0) {
        return null;
    }

    // Build translation arguments dynamically: { feature1: "chat", feature2: "polls", ... }
    const translationArgs = features.reduce((acc, feature, index) => {
        acc[`feature${index + 1}`] = feature;

        return acc;
    }, {} as Record<string, string>);

    // Use dynamic translation key: "titleWith1Features", "titleWith2Features", etc.
    const title = t(`chat.nickname.titleWith${features.length}Features`, translationArgs);

    return (
        <div id='nickname'>
            <form onSubmit = { _onSubmit }>
                <Input
                    accessibilityLabel = { t(title) }
                    autoFocus = { true }
                    id='nickinput'
                    label = { t(title) }
                    name = 'name'
                    onChange = { _onDisplayNameChange }
                    placeholder = { t('chat.nickname.popover') }
                    type = 'text'
                    value = { displayName } />
            </form>
            <br />
            <Button
                accessibilityLabel = { t('chat.enter') }
                disabled = { !displayName.trim() }
                fullWidth = { true }
                label = { t('chat.enter') }
                onClick = { _onSubmit } />
            <KeyboardAvoider />
        </div>
    );

}
export default translate(connect()(DisplayNameForm));

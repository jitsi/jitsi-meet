import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

/**
 * A hook that tracks whether the native keyboard is visible.
 *
 * @returns {boolean} - Whether the keyboard is visible.
 */
export const useKeyboardVisible = (): boolean => {
    const [ keyboardVisible, setKeyboardVisible ] = useState(false);

    useEffect(() => {
        const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
        const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));

        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    return keyboardVisible;
};

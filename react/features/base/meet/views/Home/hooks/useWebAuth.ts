import { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';

import { loginSuccess } from '../../../general/store/auth/actions';
import { setUser } from '../../../general/store/user/actions';
import { useLocalStorage } from '../../../LocalStorageManager';
import { PaymentsService } from "../../../services/payments.service";
import { LoginCredentials } from "../../../services/types/command.types";
import { WebAuthService } from "../../../services/web-auth.service";

interface UseWebAuthProps {
    onClose: () => void;
    onLogin?: (token: string) => void;
    translate: (key: string) => string;
}

export function useWebAuth({ onClose, onLogin, translate }: UseWebAuthProps) {
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [webAuthError, setWebAuthError] = useState('');

    const storageManager = useLocalStorage();
    const dispatch = useDispatch();

    const saveUserSession = useCallback(
        async (credentials: LoginCredentials) => {
            storageManager.saveCredentials(credentials.newToken, credentials.mnemonic, credentials.user);

            try {
                const subscription = await PaymentsService.instance.getUserSubscription();
                storageManager.setSubscription(subscription);
            } catch (err) {
                console.error("Error getting user subscription:", err);
            }

            dispatch(loginSuccess(credentials));
            dispatch(setUser(credentials.user));
            onLogin?.(credentials.newToken);
        },
        [storageManager, onLogin, dispatch]
    );

    /**
     * Handles web-based login using popup window
     */
    const handleWebLogin = async () => {
        setIsLoggingIn(true);
        setWebAuthError('');

        try {
            const credentials = await WebAuthService.instance.loginWithWeb();

            if (!credentials?.newToken || !credentials?.user) {
                throw new Error(translate('meet.auth.modal.error.invalidCredentials'));
            }

            await saveUserSession(credentials);
            onClose();
        } catch (err: unknown) {
            if (err instanceof Error) {
                if (err.message.includes("popup blocker")) {
                    setWebAuthError(translate("meet.auth.modal.error.popupBlocked"));
                } else if (err.message.includes("cancelled")) {
                    setWebAuthError(translate("meet.auth.modal.error.authCancelled"));
                } else if (err.message.includes("timeout")) {
                    setWebAuthError(translate("meet.auth.modal.error.authTimeout"));
                } else {
                    setWebAuthError(err.message);
                }
            } else {
                setWebAuthError(translate("meet.auth.modal.error.genericError"));
            }
        } finally {
            setIsLoggingIn(false);
        }
    };

    /**
     * Handles web-based signup using popup window
     */
    const handleWebSignup = async () => {
        setIsLoggingIn(true);
        setWebAuthError('');

        try {
            const credentials = await WebAuthService.instance.signupWithWeb();

            if (!credentials?.newToken || !credentials?.user) {
                throw new Error(translate('meet.auth.modal.error.invalidCredentials'));
            }

            await saveUserSession(credentials);
            onClose();
        } catch (err: unknown) {
            if (err instanceof Error) {
                if (err.message.includes("popup blocker")) {
                    setWebAuthError(translate("meet.auth.modal.error.popupBlocked"));
                } else if (err.message.includes("cancelled")) {
                    setWebAuthError(translate("meet.auth.modal.error.authCancelled"));
                } else if (err.message.includes("timeout")) {
                    setWebAuthError(translate("meet.auth.modal.error.authTimeout"));
                } else {
                    setWebAuthError(err.message);
                }
            } else {
                setWebAuthError(translate("meet.auth.modal.error.genericError"));
            }
        } finally {
            setIsLoggingIn(false);
        }
    };

    const resetState = useCallback(() => {
        setWebAuthError('');
        setIsLoggingIn(false);
    }, []);

    return {
        isLoggingIn,
        webAuthError,
        handleWebLogin,
        handleWebSignup,
        resetState,
    };
}

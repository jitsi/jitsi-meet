import { useCallback, useState } from 'react';

let _excalidrawPromise: Promise<any> | null = null;

/**
 * Dynamically imports the @jitsi/excalidraw library.
 *
 * @returns {Promise} - Promise that resolves to the excalidraw module.
 */
function _getExcalidraw() {
    if (!_excalidrawPromise) {
        _excalidrawPromise = import(/* webpackChunkName: "excalidraw" */ '@jitsi/excalidraw');
    }

    return _excalidrawPromise;
}

/**
 * Custom hook to dynamically load ExcalidrawApp component.
 *
 * @returns {Object} - Object containing ExcalidrawApp component and loading state.
 */
export function useExcalidrawApp() {
    const [ ExcalidrawApp, setExcalidrawApp ] = useState<any>(null);
    const [ isLoading, setIsLoading ] = useState(false);
    const [ error, setError ] = useState<Error | null>(null);

    const loadExcalidrawApp = useCallback(async () => {
        if (ExcalidrawApp) {
            return ExcalidrawApp;
        }

        setIsLoading(true);
        setError(null);

        try {
            const excalidrawModule = await _getExcalidraw();

            setExcalidrawApp(excalidrawModule.ExcalidrawApp);

            return excalidrawModule.ExcalidrawApp;
        } catch (err) {
            const _error = err instanceof Error ? err : new Error('Failed to load Excalidraw');

            setError(_error);
            throw _error;
        } finally {
            setIsLoading(false);
        }
    }, [ ExcalidrawApp ]);

    return {
        ExcalidrawApp,
        isLoading,
        error,
        loadExcalidrawApp
    };
}

/**
 * Custom hook to dynamically load generateCollaborationLinkData function.
 *
 * @returns {Function} - Function that loads and returns generateCollaborationLinkData.
 */
export function useGenerateCollaborationLinkData() {
    return useCallback(async (...args: any[]) => {
        const excalidrawModule = await _getExcalidraw();

        return excalidrawModule.generateCollaborationLinkData(...args);
    }, []);
}

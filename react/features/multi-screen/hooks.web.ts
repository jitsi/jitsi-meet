import { useSelector } from 'react-redux';

import MultiScreenButton from './components/MultiScreenButton';
import { isMultiScreenSupported } from './functions';

const multiScreen = {
    key: 'multi-screen',
    Content: MultiScreenButton,
    group: 2
};

/**
 * A hook that returns the multi-screen toolbar button descriptor when the
 * feature is supported, and undefined otherwise (so the toolbox omits it
 * entirely), mirroring the other conditional toolbar-button hooks.
 *
 * @returns {Object | undefined}
 */
export function useMultiScreenButton() {
    const supported = useSelector(isMultiScreenSupported);

    if (supported) {
        return multiScreen;
    }
}

import { useSelector } from 'react-redux';

import { IReduxState } from '../app/types';

import PiPButton from './components/PiPButton';
import { isPiPEnabled } from './external-api.shared';

const pip = {
    key: 'pip',
    Content: PiPButton,
    group: 2
};

/**
 * A hook that returns the PiP button if Picture-in-Picture is enabled and undefined otherwise.
 *
 * @returns {Object | undefined}
 */
export function usePiPButton() {
    const enabled = useSelector((state: IReduxState) => isPiPEnabled(state['features/base/config'].pip));

    if (enabled) {
        return pip;
    }
}

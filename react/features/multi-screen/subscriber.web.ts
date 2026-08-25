import StateListenerRegistry from '../base/redux/StateListenerRegistry';

import { getSecondScreenSignature, refreshSecondScreens } from './functions.web';

/**
 * Re-applies the second-screen sources whenever what they should render changes
 * — most importantly when the active speaker switches (the {@code role: 'stage'}
 * source resolves to a different track), so the window's {@code srcObject} is
 * swapped in place without ever re-opening it.
 */
StateListenerRegistry.register(
    /* selector */ state => getSecondScreenSignature(state),
    /* listener */ (signature, store) => {
        if (signature) {
            refreshSecondScreens(store);
        }
    }
);

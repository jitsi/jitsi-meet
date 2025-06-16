import { useSelector } from 'react-redux';

import { IReduxState } from '../app/types';

import SharedDocumentButtonWeb from './components/SharedDocumentButton';

const etherpad = {
    key: 'etherpad',
    Content: SharedDocumentButtonWeb,
    group: 3
};

/**
 * A hook that returns the etherpad button if it is enabled and undefined otherwise.
 *
 *  @returns {Object | undefined}
 */
export function useEtherpadButton() {
    const visible = useSelector((state: IReduxState) => Boolean(state['features/etherpad'].documentUrl));

    if (visible) {
        return etherpad;
    }
}

import { useSelector } from 'react-redux';

import FileSharingButton from './components/web/FileSharingButton';
import { isFileSharingEnabled } from './functions.any';

const fileSharing = {
    key: 'filesharing',
    Content: FileSharingButton,
    group: 2
};

/**
 * A hook that returns the file sharing button if it is enabled and undefined otherwise.
 *
 * @returns {Object | undefined} - The file sharing button object or undefined.
 */
export function useFileSharingButton() {
    const isEnabled = useSelector(isFileSharingEnabled);

    if (isEnabled) {
        return fileSharing;
    }
}

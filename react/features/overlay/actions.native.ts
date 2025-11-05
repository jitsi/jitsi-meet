import { ConnectionFailedError } from '../base/connection/types';
import { openDialog } from '../base/dialog/actions';
import PageReloadDialog from '../base/dialog/components/native/PageReloadDialog';


/**
 * Opens {@link PageReloadDialog}.
 *
 * @param {Error} conferenceError - The conference error that caused the reload.
 * @param {Error} configError - The conference error that caused the reload.
 * @param {Error} connectionError - The conference error that caused the reload.
 * @returns {Function}
 */
export function openPageReloadDialog(
        conferenceError?: Error, configError?: Error, connectionError?: ConnectionFailedError) {
    return openDialog(PageReloadDialog, {
        conferenceError,
        configError,
        connectionError
    });
}

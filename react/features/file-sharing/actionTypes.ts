/**
 * The type of redux action to update file progress.
 *
 * {
 *     type: UPDATE_FILE_UPLOAD_PROGRESS,
 *     fileId: string,
 *     progress: number
 * }
 */
export const UPDATE_FILE_UPLOAD_PROGRESS = 'UPDATE_FILE_UPLOAD_PROGRESS';

/**
 * The type of redux action to add files to the state.
 *
 * {
 *     type: ADD_FILES,
 *     files: Array<IFile>
 * }
 */
export const ADD_FILES = 'ADD_FILES';

/**
 * The type of redux action to remove a file from the state.
 *
 * {
 *     type: REMOVE_FILE,
 *     fileId: string
 * }
 */
export const REMOVE_FILE = 'REMOVE_FILE';

/**
 * The type of redux action to download a file.
 *
 * {
 *     type: DOWNLOAD_FILE,
 *     fileId: string
 * }
 */
export const DOWNLOAD_FILE = 'DOWNLOAD_FILE'; 
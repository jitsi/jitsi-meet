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
 * The type of redux action to upload files.
 *
 * {
 *     type: UPLOAD_FILES,
 *     files: Array<File>
 * }
 */
export const UPLOAD_FILES = 'UPLOAD_FILES';

/**
 * The type of redux action to add file data to the state.
 *
 * {
 *     type: ADD_FILE,
 *     file: IFileMetadata
 * }
 */
export const ADD_FILE = 'ADD_FILE';

/**
 * The type of redux action to add files to the state.
 *
 * {
 *    type: _FILE_LIST_RECEIVED,
 *    files: Array<IFileMetadata>
 * }
 */
export const _FILE_LIST_RECEIVED = '_FILE_LIST_RECEIVED';

/**
 * The type of redux action to remove a file from the state as it was removed from the backend.
 *
 * {
 *    type: _FILE_REMOVED,
 *    fileId: string
 * }
 */
export const _FILE_REMOVED = '_FILE_REMOVED';

/**
 * The type of redux action to remove a file from the backend.
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

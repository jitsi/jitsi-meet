import { getConferenceName, getCurrentConference } from '../base/conference/functions';
import { getLocalParticipant, getParticipantDisplayName } from '../base/participants/functions';
import { parseJWTFromURLParams } from '../base/jwt/functions';
import { showErrorNotification } from '../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE, NOTIFICATION_TYPE } from '../notifications/constants';
import { ADD_FILES, REMOVE_FILE, DOWNLOAD_FILE, SET_FILES } from './actionTypes';
import { getFileExtension, makeApiCall } from './functions.any';
import { removeFile, updateFileProgress } from './actions';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import logger from './logger';
import { FILE_SHARING_ID } from './constants';
import { OPEN_CHAT } from '../chat/actionTypes';

/**
 * Middleware that handles file sharing actions.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => async action => {
    switch (action.type) {
    case ADD_FILES: {
        const result = next(action);
        const state = store.getState();
        const conference = getCurrentConference(state);
        const sessionId = conference?.getMeetingUniqueId();
        const localParticipant = getLocalParticipant(state);
        const { connection, locationURL } = state['features/base/connection'];
        const jwt = parseJWTFromURLParams(locationURL);
        const conferenceFullName = getConferenceName(state);

        for (const file of action.files) {
            const jid = connection?.getJid();

            const headers = {
                ...jwt && { 'Authorization': `Bearer ${jwt}` }
            };

            try {
                const fileMetadata = {
                    authorParticipantJid: jid,
                    authorParticipantName: getParticipantDisplayName(state, localParticipant!.id),
                    conferenceFullName,
                    fileId: file.id,
                    fileName: file.file.name,
                    fileSize: file.file.size,
                    fileType: getFileExtension(file.file.name),
                    timestamp: Date.now()
                };

                const formData = new FormData();

                formData.append('metadata', JSON.stringify(fileMetadata));
                formData.append('file', file.file as Blob, file.file.name);

                const existingMetadata = conference?.getMetadataHandler()?.getMetadata()?.[FILE_SHARING_ID]?.files || {};

                conference?.getMetadataHandler().setMetadata(FILE_SHARING_ID, {
                    files: {
                        ...existingMetadata,
                        [file.id]: fileMetadata
                    }
                });

                await makeApiCall({
                    method: 'POST',
                    endpoint: `/sessions/${sessionId}`,
                    headers,
                    body: formData
                });

                store.dispatch(updateFileProgress(file.id, 100));
            } catch (error) {
                logger.warn('Could not upload file:', error);

                store.dispatch(removeFile(file.id));

                store.dispatch(showErrorNotification({
                    titleKey: 'fileSharing.uploadFailedTitle',
                    descriptionKey: 'fileSharing.uploadFailedDescription',
                    appearance: NOTIFICATION_TYPE.ERROR
                }, NOTIFICATION_TIMEOUT_TYPE.MEDIUM));
            }
        }

        return result;
    }

    case REMOVE_FILE: {
        const result = next(action);
        const state = store.getState();
        const conference = getCurrentConference(state);
        const { locationURL } = state['features/base/connection'];
        const jwt = parseJWTFromURLParams(locationURL);
        const sessionId = conference?.getMeetingUniqueId();

        const headers = {
            ...jwt && { 'Authorization': `Bearer ${jwt}` }
        };

        try {
            // Get file metadata from conference metadata
            const existingMetadata = conference?.getMetadataHandler().getMetadata()?.[FILE_SHARING_ID]?.files || {};
            const fileMetadata = existingMetadata[action.fileId];

            if (fileMetadata) {
                await makeApiCall({
                    method: 'DELETE',
                    endpoint: `/sessions/${sessionId}/files/${action.fileId}`,
                    headers
                });

                const remainingFiles = { ...existingMetadata };

                delete remainingFiles[action.fileId];

                conference?.getMetadataHandler().setMetadata(FILE_SHARING_ID, {
                    files: remainingFiles
                });
            }
        } catch (error) {
            logger.warn('Could not delete file:', error);
        }

        return result;
    }

    case DOWNLOAD_FILE: {
        const result = next(action);
        const state = store.getState();
        const { locationURL } = state['features/base/connection'];
        const jwt = parseJWTFromURLParams(locationURL);
        const conference = getCurrentConference(state);
        const sessionId = conference?.getMeetingUniqueId();

        const headers = {
            ...jwt && { 'Authorization': `Bearer ${jwt}` }
        };

        try {
            const response = await makeApiCall({
                method: 'GET',
                endpoint: `/sessions/${sessionId}/${action.fileId}`,
                headers
            });

            if (response) {
                const blob = new Blob([ response ], { type: 'application/octet-stream' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');

                a.href = url;
                a.download = action.fileName;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
        } catch (error) {
            logger.warn('Could not download file:', error);

            store.dispatch(showErrorNotification({
                titleKey: 'fileSharing.downloadFailedTitle',
                descriptionKey: 'fileSharing.downloadFailedDescription',
                appearance: NOTIFICATION_TYPE.ERROR
            }, NOTIFICATION_TIMEOUT_TYPE.MEDIUM));
        }

        return result;
    }

    case OPEN_CHAT: {
        const result = next(action);
        const state = store.getState();
        const conference = getCurrentConference(state);
        const metadataFiles = conference?.getMetadataHandler().getMetadata()?.[FILE_SHARING_ID]?.files;

        if (metadataFiles) {
            store.dispatch({
                type: SET_FILES,
                files: metadataFiles
            });
        }

        return result;
    }
    }

    return next(action);
});

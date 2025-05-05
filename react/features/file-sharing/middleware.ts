import { getCurrentConference } from '../base/conference/functions';
import { getLocalParticipant, getRemoteParticipants } from '../base/participants/functions';
import { extractFqnFromPath } from '../dynamic-branding/functions.any';
import { parseJWTFromURLParams } from '../base/jwt/functions';
import { showErrorNotification, showNotification } from '../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE, NOTIFICATION_TYPE } from '../notifications/constants';
import { ADD_FILES, REMOVE_FILE, DOWNLOAD_FILE } from './actionTypes';
import { calculateFileHash, makeApiCall } from './functions.any';
import { updateFileProgress } from './actions';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import logger from './logger';
import { FILE_SHARING_ID } from './constants';

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
        const remoteParticipants = getRemoteParticipants(state);
        const { connection, locationURL } = state['features/base/connection'];
        const jwt = parseJWTFromURLParams(locationURL);
        const meetingFqn = extractFqnFromPath(state);

        for (const file of action.files) {
            const jid = connection?.getJid();
            const participants: Array<string | undefined> = [];

            participants.push(localParticipant?.id);
            remoteParticipants.forEach(p => participants.push(p.id));

            const headers = {
                ...jwt && { 'Authorization': `Bearer ${jwt}` }
            };

            try {
                const fileHash = await calculateFileHash(file.file, progress => {
                    store.dispatch(updateFileProgress(file.id, progress / 2));
                });

                // const existingFiles = await makeApiCall({
                //     method: 'GET',
                //     endpoint: `/documents/file-metadata/jaas/${sessionId}`,
                //     headers
                // });

                // if (existingFiles?.length > 0) {
                //     store.dispatch(showNotification({
                //         titleKey: 'fileSharing.uploadFailedTitle',
                //         descriptionKey: 'fileSharing.fileAlreadyUploaded',
                //         appearance: NOTIFICATION_TYPE.WARNING,
                //         maxLines: 2
                //     }, NOTIFICATION_TIMEOUT_TYPE.SHORT));

                //     return result;
                // }

                const fileMetadata = {
                    sessionId,
                    contentType: file.file.name.split('.').pop()?.toUpperCase(),
                    meetingFqn,
                    timestamp: Date.now(),
                    size: file.file.size,
                    md5: fileHash,
                    authorParticipantJid: jid,
                    participantsIds: participants.filter(Boolean) as string[],
                    name: file.file.name
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
                    endpoint: `/documents/${sessionId}`,
                    headers,
                    body: formData
                });

                store.dispatch(updateFileProgress(file.id, 100));
            } catch (error) {
                logger.warn('Could not upload file:', error);

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
                    endpoint: `/documents/${sessionId}/files/${action.fileId}`,
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
                endpoint: `/documents/${sessionId}/${action.fileId}`,
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
    }

    return next(action);
});

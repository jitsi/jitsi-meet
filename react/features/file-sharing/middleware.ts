import { getCurrentConference } from '../base/conference/functions';
import { getLocalParticipant, getRemoteParticipants } from '../base/participants/functions';
import { extractFqnFromPath } from '../dynamic-branding/functions.any';
import { parseJWTFromURLParams } from '../base/jwt/functions';
import { showErrorNotification, showNotification } from '../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE, NOTIFICATION_TYPE } from '../notifications/constants';
import { ADD_FILES, REMOVE_FILE } from './actionTypes';
import { calculateFileHash, makeApiCall } from './functions';
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

                // Check if file already exists
                const existingFiles = await makeApiCall({
                    method: 'GET',
                    endpoint: `/documents?md5=${fileHash}&meetingFqn=${meetingFqn}`,
                    headers
                });

                if (existingFiles?.length > 0) {
                    store.dispatch(showNotification({
                        titleKey: 'fileSharing.uploadFailedTitle',
                        descriptionKey: 'fileSharing.fileAlreadyUploaded',
                        appearance: NOTIFICATION_TYPE.WARNING,
                        maxLines: 2
                    }, NOTIFICATION_TIMEOUT_TYPE.SHORT));

                    return result;
                }

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
                formData.append('file', file.file);

                await makeApiCall({
                    method: 'POST',
                    endpoint: '/documents',
                    headers,
                    body: formData
                });

                // Update conference metadata with file information
                const existingMetadata = conference?.getMetadataHandler().getMetadata()?.fileSharing?.files || {};

                conference?.getMetadataHandler().setMetadata(FILE_SHARING_ID, {
                    files: {
                        ...existingMetadata,
                        [file.id]: fileMetadata
                    }
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
        const meetingFqn = extractFqnFromPath(state);

        const headers = {
            ...jwt && { 'Authorization': `Bearer ${jwt}` }
        };

        try {
            // Get file metadata from conference metadata
            const existingMetadata = conference?.getMetadataHandler().getMetadata()?.fileSharing?.files || {};
            const fileMetadata = existingMetadata[action.fileId];

            if (fileMetadata) {
                await makeApiCall({
                    method: 'DELETE',
                    endpoint: `/documents?md5=${fileMetadata.md5}&meetingFqn=${meetingFqn}`,
                    headers
                });

                // Update conference metadata to remove the file
                const { [action.fileId]: _, ...remainingFiles } = existingMetadata;

                conference?.getMetadataHandler().setMetadata(FILE_SHARING_ID, {
                    files: remainingFiles
                });
            }
        } catch (error) {
            logger.warn('Could not delete file:', error);
        }

        return result;
    }
    }

    return next(action);
});

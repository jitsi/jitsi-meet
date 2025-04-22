import { getCurrentConference } from '../base/conference/functions';
import { getLocalParticipant, getRemoteParticipants } from '../base/participants/functions';
import { extractFqnFromPath } from '../dynamic-branding/functions.any';
import { parseJWTFromURLParams } from '../base/jwt/functions';
import { showErrorNotification, showNotification } from '../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE, NOTIFICATION_TYPE } from '../notifications/constants';
import { ADD_FILES } from './actionTypes';
import { calculateFileHash, isFileAlreadyUploaded, uploadFileToServer } from './functions';
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

                const fileAlreadyUploaded = await isFileAlreadyUploaded(fileHash, meetingFqn, headers);

                if (fileAlreadyUploaded) {
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

                await uploadFileToServer(file.file, fileMetadata, headers);

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
    }

    return next(action);
});

import { v4 as uuidv4 } from 'uuid';

import { IStore } from '../app/types';
import { getCurrentConference } from '../base/conference/functions';
import { getLocalParticipant, getParticipantDisplayName } from '../base/participants/functions';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import { showErrorNotification } from '../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE, NOTIFICATION_TYPE } from '../notifications/constants';

import { DOWNLOAD_FILE, REMOVE_FILE, UPLOAD_FILES } from './actionTypes';
import { addFile, removeFile, updateFileProgress } from './actions';
import { FILE_SHARING_PREFIX, FILE_SHARING_SERVICE } from './constants';
import { getFileExtension } from './functions.any';
import logger from './logger';
import { IFileMetadata } from './types';

/**
 * Middleware that handles file sharing actions.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case UPLOAD_FILES: {
        const state = store.getState();
        const conference = getCurrentConference(state);

        conference?.getShortTermCredentials(FILE_SHARING_SERVICE).then((token: string) => {
            for (const file of action.files) {
                uploadFile(file, store, token);
            }
        });

        return next(action);
    }

    case REMOVE_FILE: {
        const state = store.getState();
        const conference = getCurrentConference(state);
        const { fileSharing } = state['features/base/config'];
        const sessionId = conference?.getMeetingUniqueId();
        let doDelete = false;

        // First remove the file metadata so others won't attempt to download it anymore.
        const metadataHandler = conference?.getMetadataHandler();

        if (metadataHandler) {
            const metadataId = `${FILE_SHARING_PREFIX}.${action.fileId}`;
            const existingMetadata = metadataHandler.getMetadata()[metadataId] ?? {};

            doDelete = (existingMetadata?.process ?? 100) === 100;

            metadataHandler.setMetadata(metadataId, {});
        }

        if (!doDelete) {
            return next(action);
        }

        // Now delete it from the server.
        conference?.getShortTermCredentials(FILE_SHARING_SERVICE)
        .then((token: string) => fetch(`${fileSharing!.apiUrl!}/sessions/${sessionId}/files/${action.fileId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }))
        .then((response: { ok: any; statusText: any; }) => {
            if (!response.ok) {
                throw new Error(`Failed to delete file: ${response.statusText}`);
            }
        })
        .catch((error: any) => {
            logger.warn('Could not delete file:', error);
        });

        return next(action);
    }

    case DOWNLOAD_FILE: {
        const state = store.getState();
        const { fileSharing } = state['features/base/config'];
        const conference = getCurrentConference(state);
        const sessionId = conference?.getMeetingUniqueId();

        conference?.getShortTermCredentials(FILE_SHARING_SERVICE)
        .then((token: string) => fetch(`${fileSharing!.apiUrl!}/sessions/${sessionId}/files/${action.fileId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }))
        .then((response: any) => response.json())
        .then((data: { presignedUrl: any; }) => {
            const url = data.presignedUrl;

            if (!url) {
                throw new Error('No presigned URL found in the response.');
            }

            window.open(url, '_blank', 'noreferrer,noopener');
        })
        .catch((error: any) => {
            logger.warn('Could not download file:', error);

            store.dispatch(showErrorNotification({
                titleKey: 'fileSharing.downloadFailedTitle',
                descriptionKey: 'fileSharing.downloadFailedDescription',
                appearance: NOTIFICATION_TYPE.ERROR
            }, NOTIFICATION_TIMEOUT_TYPE.STICKY));
        });

        return next(action);
    }
    }

    return next(action);
});

/**
 * Uploads a file to the server.
 *
 * @param {File} file - The file to upload.
 * @param {IStore} store - The redux store.
 * @param {string} token - The token to use for requests.
 * @returns {void}
 */
function uploadFile(file: File, store: IStore, token: string): void {
    const state = store.getState();
    const conference = getCurrentConference(state);
    const sessionId = conference?.getMeetingUniqueId();
    const localParticipant = getLocalParticipant(state);
    const { fileSharing } = state['features/base/config'];
    const { connection } = state['features/base/connection'];
    const roomJid = conference?.room?.roomjid;

    const jid = connection!.getJid();
    const fileId = uuidv4();
    const fileMetadata: IFileMetadata = {
        authorParticipantId: localParticipant!.id,
        authorParticipantJid: jid,
        authorParticipantName: getParticipantDisplayName(state, localParticipant!.id),
        conferenceFullName: roomJid ?? '',
        fileId,
        fileName: file.name,
        fileSize: file.size,
        fileType: getFileExtension(file.name),
        timestamp: Date.now()
    };

    store.dispatch(addFile(fileMetadata));
    store.dispatch(updateFileProgress(fileId, 1));

    // Upload file.
    const formData = new FormData();

    formData.append('metadata', JSON.stringify(fileMetadata));

    // @ts-ignore
    formData.append('file', file as Blob, file.name);

    // Use XMLHttpRequest to track upload
    const xhr = new XMLHttpRequest();

    const handleError = () => {
        logger.warn('Could not upload file:', xhr.statusText);

        store.dispatch(removeFile(fileId));
        store.dispatch(showErrorNotification({
            titleKey: 'fileSharing.uploadFailedTitle',
            descriptionKey: 'fileSharing.uploadFailedDescription',
            appearance: NOTIFICATION_TYPE.ERROR
        }, NOTIFICATION_TIMEOUT_TYPE.STICKY));
    };

    xhr.open('POST', `${fileSharing!.apiUrl!}/sessions/${sessionId}/files`);
    xhr.responseType = 'json';

    if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    xhr.upload.onprogress = event => {
        if (event.lengthComputable) {
            // We use 99% as the max value to avoid showing 100% before the
            // upload is actually finished, that is, when the request is completed.
            const percent = Math.max((event.loaded / event.total) * 100, 99);

            store.dispatch(updateFileProgress(fileId, percent));
        }
    };

    xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
            store.dispatch(updateFileProgress(fileId, 100));

            const metadataHandler = conference?.getMetadataHandler();

            metadataHandler?.setMetadata(`${FILE_SHARING_PREFIX}.${fileId}`, fileMetadata);
        } else {
            handleError();
        }
    };

    xhr.onerror = handleError;

    xhr.send(formData);
}

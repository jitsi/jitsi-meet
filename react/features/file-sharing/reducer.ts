import ReducerRegistry from '../base/redux/ReducerRegistry';

import {
    ADD_FILE,
    CLEAR_UNREAD_FILES_COUNT,
    INCREMENT_UNREAD_FILES_COUNT,
    UPDATE_FILE_UPLOAD_PROGRESS,
    _FILE_LIST_RECEIVED,
    _FILE_REMOVED
} from './actionTypes';
import { IFileMetadata } from './types';

export interface IFileSharingState {
    files: Map<string, IFileMetadata>;
    nbUnreadFiles: number;
}

const DEFAULT_STATE = {
    files: new Map<string, IFileMetadata>(),
    nbUnreadFiles: 0
};

ReducerRegistry.register<IFileSharingState>('features/file-sharing',
(state = DEFAULT_STATE, action): IFileSharingState => {
    switch (action.type) {
    case ADD_FILE: {
        const newFiles = new Map(state.files);

        newFiles.set(action.file.fileId, action.file);

        return {
            files: newFiles,
            nbUnreadFiles: state.nbUnreadFiles
        };
    }

    case _FILE_REMOVED: {
        const newFiles = new Map(state.files);

        newFiles.delete(action.fileId);

        return {
            files: newFiles,
            nbUnreadFiles: state.nbUnreadFiles
        };
    }

    case UPDATE_FILE_UPLOAD_PROGRESS: {
        const newFiles = new Map(state.files);
        const file = newFiles.get(action.fileId);

        if (file) {
            newFiles.set(action.fileId, { ...file, progress: action.progress });
        }

        return {
            files: newFiles,
            nbUnreadFiles: state.nbUnreadFiles
        };
    }

    case _FILE_LIST_RECEIVED: {
        return {
            files: new Map(Object.entries(action.files)),
            nbUnreadFiles: action.remoteFilesCount || 0
        };
    }

    case CLEAR_UNREAD_FILES_COUNT: {
        return {
            files: state.files,
            nbUnreadFiles: 0
        };
    }

    case INCREMENT_UNREAD_FILES_COUNT: {
        return {
            files: state.files,
            nbUnreadFiles: state.nbUnreadFiles + 1
        };
    }

    default:
        return state;
    }
});

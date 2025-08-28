import ReducerRegistry from '../base/redux/ReducerRegistry';

import { ADD_FILE, UPDATE_FILE_UPLOAD_PROGRESS, _FILE_LIST_RECEIVED, _FILE_REMOVED } from './actionTypes';
import { IFileMetadata } from './types';

export interface IFileSharingState {
    files: Map<string, IFileMetadata>;
}

const DEFAULT_STATE = {
    files: new Map<string, IFileMetadata>()
};

ReducerRegistry.register<IFileSharingState>('features/file-sharing',
(state = DEFAULT_STATE, action): IFileSharingState => {
    switch (action.type) {
    case ADD_FILE: {
        const newFiles = new Map(state.files);

        newFiles.set(action.file.fileId, action.file);

        return {
            files: newFiles
        };
    }

    case _FILE_REMOVED: {
        const newFiles = new Map(state.files);

        newFiles.delete(action.fileId);

        return {
            files: newFiles
        };
    }

    case UPDATE_FILE_UPLOAD_PROGRESS: {
        const newFiles = new Map(state.files);
        const file = newFiles.get(action.fileId);

        if (file) {
            newFiles.set(action.fileId, { ...file, progress: action.progress });
        }

        return {
            files: newFiles
        };
    }

    case _FILE_LIST_RECEIVED: {
        return {
            files: new Map(Object.entries(action.files))
        };
    }

    default:
        return state;
    }
});

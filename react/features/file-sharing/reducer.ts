import ReducerRegistry from '../base/redux/ReducerRegistry';

import { ADD_FILE, FILE_LIST_RECEIVED, FILE_REMOVED, UPDATE_FILE_UPLOAD_PROGRESS } from './actionTypes';
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

    case FILE_REMOVED: {
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

    case FILE_LIST_RECEIVED: {
        const files = new Map();

        // convert the array to map we want in the state
        action.files.forEach((f: IFileMetadata) => {
            files.set(f.fileId, f);
        });

        return {
            files
        };
    }

    default:
        return state;
    }
});

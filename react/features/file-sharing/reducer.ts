import { isEqual } from 'lodash-es';

import { UPDATE_CONFERENCE_METADATA } from '../base/conference/actionTypes';
import ReducerRegistry from '../base/redux/ReducerRegistry';
import {
    ADD_FILE,
    REMOVE_FILE,
    UPDATE_FILE_UPLOAD_PROGRESS
} from './actionTypes';
import { FILE_SHARING_PREFIX } from './constants';
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

    case REMOVE_FILE: {
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

    case UPDATE_CONFERENCE_METADATA: {
        const { metadata } = action;
        const files = new Map();

        for (const [ key, value ] of Object.entries(metadata)) {
            if (key.startsWith(FILE_SHARING_PREFIX)) {
                const fileId = key.substring(FILE_SHARING_PREFIX.length + 1);

                files.set(fileId, value);
            }
        }

        if (files.size === 0) {
            return state;
        }

        const newFiles: Map<string, IFileMetadata> = new Map(state.files);

        for (const [ key, value ] of files) {
            // Deleted files will not have fileId.
            if (!value.fileId) {
                newFiles.delete(key);
            } else {
                newFiles.set(key, value);
            }
        }

        if (isEqual(newFiles, state.files)) {
            return state;
        }

        return {
            files: newFiles
        };
    }

    default:
        return state;
    }
});

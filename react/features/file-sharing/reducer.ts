import { IFile } from './types';
import {
    ADD_FILES,
    REMOVE_FILE,
    SET_FILES,
    UPDATE_FILE_UPLOAD_PROGRESS
} from './actionTypes';
import ReducerRegistry from '../base/redux/ReducerRegistry';

export interface IFileSharingState {
    files: IFile[];
}

const DEFAULT_STATE = {
    files: []
};

ReducerRegistry.register<IFileSharingState>('features/file-sharing', (state = DEFAULT_STATE, action) => {
    switch (action.type) {
    case ADD_FILES:
        return {
            ...state,
            files: [ ...state.files, ...action.files ]
        };

    case REMOVE_FILE:
        return {
            ...state,
            files: state.files.filter(file => file.id !== action.fileId)
        };

    case UPDATE_FILE_UPLOAD_PROGRESS:
        return {
            ...state,
            files: state.files.map(file =>
                file.id === action.fileId
                    ? { ...file, progress: action.progress }
                    : file
            )
        };

    case SET_FILES:
        const newState = {
            ...state,
            files: action.files
        };

        return newState;


    default:
        return state;
    }
});

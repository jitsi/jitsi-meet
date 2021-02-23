// @flow
import { useEffect } from 'react';
import { Clipboard } from 'react-native';
import { connect } from '../../base/redux';
import { appNavigate } from '../../app';
import { toURLString, isJaneVideoChatLink } from '../../base/util';
import { Dispatch } from 'redux';

/**
 * VideoChatUrlDetector's React {@code Component} prop types.
 */
type Props = {

    /**
     * Signals that the App state has changed (in terms of execution state). The
     * application can be in 3 states: 'active', 'inactive' and 'background'.
     */
    appState: string,

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Dispatch<any>
};

/**
 * React component to detect if the contents from the clipboard contain jane video chat url.
 *
 * @param {Object} props - The read-only properties with which the new
 * instance is to be initialized.
 * @returns {null}
 */
const VideoChatUrlDetector = (props: Props) => {

    const getClipboardContents = async () => await Clipboard.getString();

    const checkClipboardContents = async () => {
        const contents = await getClipboardContents();

        if (isJaneVideoChatLink(contents)) {
            // Start call with the video chat url.
            props.dispatch(appNavigate(toURLString(contents)));
        }
    };

    useEffect(() => {
        checkClipboardContents();
    }, []);

    useEffect(() => {
        if (props.appState === 'active') {
            checkClipboardContents();
        }
    }, [ props.appState ]);

    return null;
};

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {Object}
 */
function _mapStateToProps(state) {
    const { appState } = state['features/background'];

    return {
        appState
    };
}

export default connect(_mapStateToProps)(VideoChatUrlDetector);

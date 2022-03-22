import React, { useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';

import { setSafeAreaInsets } from '../actions';

/**
 * A component that detects the nearest SafeAreaProvider insets and stores them in redux.
 *
 * @returns {Component}
 */
function SafeAreaInsetsDetector() {
    const { top = 0, right = 0, bottom = 0, left = 0 } = useSafeAreaInsets();
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(setSafeAreaInsets({
            top,
            right,
            bottom,
            left
        }));
    }, [ dispatch, top, right, bottom, left ]);

    return <></>;
}

export default SafeAreaInsetsDetector;

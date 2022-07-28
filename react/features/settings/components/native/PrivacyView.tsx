/* eslint-disable lines-around-comment */

import React, { useEffect } from 'react';

// @ts-ignore
import JitsiScreenWebView from '../../../base/modal/components/JitsiScreenWebView';
// @ts-ignore
import JitsiStatusBar from '../../../base/modal/components/JitsiStatusBar';
// @ts-ignore
import { renderArrowBackButton }
// @ts-ignore
    from '../../../mobile/navigation/components/welcome/functions';

// @ts-ignore
import styles from './styles';


type Props = {

    /**
     * Default prop for navigating between screen components(React Navigation).
     */
    navigation: Object
}

/**
 * The URL at which the privacy policy is available to the user.
 */
const PRIVACY_URL = 'https://jitsi.org/meet/privacy';

const PrivacyView = ({ navigation }: Props) => {

    useEffect(() => {
        // @ts-ignore
        navigation.setOptions({
            headerLeft: () =>
                renderArrowBackButton(() =>
                    // @ts-ignore
                    navigation.goBack())
        });
    });

    return (
        <>
            <JitsiStatusBar />
            <JitsiScreenWebView
                source = { PRIVACY_URL }
                style = { styles.screenContainer } />
        </>
    );
};

export default PrivacyView;

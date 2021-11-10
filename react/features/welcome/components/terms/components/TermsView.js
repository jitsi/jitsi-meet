// @flow

import React, { useEffect } from 'react';

import JitsiScreenWebView from '../../../../base/modal/components/JitsiScreenWebView';
import JitsiStatusBar from '../../../../base/modal/components/JitsiStatusBar';
import { screen } from '../../../../conference/components/native/routes';
import { renderArrowBackButton } from '../../../../welcome/functions.native';

import styles from './styles';


type Props = {

    /**
     * Default prop for navigating between screen components(React Navigation).
     */
    navigation: Object
}

/**
 * The URL at which the terms (of service/use) are available to the user.
 */
const TERMS_URL = 'https://jitsi.org/meet/terms';

const TermsView = ({ navigation }: Props) => {

    useEffect(() => {
        navigation.setOptions({
            headerLeft: () =>
                renderArrowBackButton(() =>
                    navigation.jumpTo(screen.welcome.main))
        });
    });

    return (
        <>
            <JitsiStatusBar />
            <JitsiScreenWebView
                source = { TERMS_URL }
                style = { styles.termsViewContainer } />
        </>
    );
};

export default TermsView;

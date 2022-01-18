import { useEffect } from 'react';
import { Alert, Linking } from 'react-native';
import VersionCheck from 'react-native-version-check';

export const UpdateModal = () => {
    useEffect(() => {
        VersionCheck.needUpdate({
            depth: 2
        }).then(res => {
            if (res.currentVersion !== res.latestVersion) {
                Alert.alert(
                    'Update Available',
                    `A new version is available. Please update to version ${res.latestVersion} now.`,
                    [
                        {
                            text: 'Next time',
                            onPress: () => console.log('Next time Pressed')
                        },
                        {
                            text: 'Update',
                            onPress: () => {
                                Linking.openURL(res.storeUrl);
                            }
                        }
                    ]
                );
            }
        });
    }, []);

    return null;
};

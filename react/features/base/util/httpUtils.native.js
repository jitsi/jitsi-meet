import { Linking } from 'react-native';

// eslint-disable-next-line require-jsdoc
function sendBeacon(url, data) {
    return fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain; charset=UTF-8'
        },
        body: data
    })
        .then(res => {
            if (!res.ok) {
                throw Error(res.statusText);
            }
        })
        .catch(error => {
            console.error(error);
        });
}

// eslint-disable-next-line require-jsdoc
export function sendBeaconToJane(leaveUrl, surveyUrl, data) {
    Linking.openURL(surveyUrl).then(() => {
        sendBeacon(leaveUrl, data).then(r => {
            console.log(r, 'response');
        })
            .catch(e => {
                console.log(e, 'error');
            });
    });
}

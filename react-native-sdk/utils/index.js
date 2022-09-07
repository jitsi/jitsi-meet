/**
 * Converts the meetingOptions domain and roomName to a URL that can be passed to the App component.
 * @param {*} domain domain address from props.
 * @param {*} roomname room name from props.
 */
export function convertPropsToURL(domain, roomName) {
    return `${domain}/${roomName}`;
}

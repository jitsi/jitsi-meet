// @flow

import { IconWhiteboard } from '../../base/icons';
import { AbstractButton, type AbstractButtonProps } from '../../base/toolbox/components';

type Props = AbstractButtonProps & {

    /**
     * The URL to the applications page.
     */
    _downloadAppsUrl: string
};

/**
 * Implements an {@link AbstractButton} to open the applications page in a new window.
 */
class WhiteboardButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'Go to Whiteboard';
    icon = IconWhiteboard;
    label = 'Go to Whiteboard';
    /* <path d="M12.5,4.16L0,16.66L0,20.8L4.16,20.8L16.66,8.33Z M18.75,6.255L20.8,4.16L16.66,0L14.58,2.08Z" /> */

    /**
     * Handles clicking / pressing the button, and opens a new window with the user documentation.
     *
     * @private
     * @returns {void}
     */
    
    _handleClick() {
      const url = randomUrl();
      window.open(url);
    }
}


/**
 * Create shared URL for using Whiteboard
 *
 * @returns {string} the shared URL
 */

const randomUrl = () => {

  let jitsiUrl = APP.conference.roomName.toLowerCase();

  jitsiUrl = jitsiUrl.concat("fhfw3efiow23fd6jvk7vkj");

  const id = jitsiUrl.substring(0,20);
  const key = jitsiUrl.substring(0,22);

  return `https://excalidraw.com/#room=${id},${key}`;
}

export default WhiteboardButton;

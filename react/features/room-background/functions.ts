/**
 * Extract background-relevant information if existing from serialized background properties.
 *
 * @param {Object} serializedBackgroundProperties - Serialized background properties ('|' separated).
 * @returns {Object}
 */
export function extractBackgroundProperties(serializedBackgroundProperties: String) {
  if (!serializedBackgroundProperties) {
      return {
          backgroundColor: undefined,
          backgroundImageUrl: undefined,
          lastUpdate: undefined
      };
  }
  const unparsedBackgroundData = serializedBackgroundProperties.split('|');

  return {
      backgroundColor: unparsedBackgroundData[0],
      backgroundImageUrl: unparsedBackgroundData[1],
      lastUpdate: unparsedBackgroundData[2]
  };
}

/**
* Returns a boolean describing whether a background is currently set or not.
*
* @param {Object} state - Redux state.
* @returns {boolean}
*/
export function isRoomBackgroundDefined(state: Object = {}) {
  const roomBackgroundState = state['features/room-background'];

  if (roomBackgroundState?.backgroundImageUrl || roomBackgroundState?.backgroundColor) {
      return true;
  }

  return false;
}

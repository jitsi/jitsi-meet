/* global interfaceConfig */
const interfaceConfig = {
    AUDIO_LEVEL_PRIMARY_COLOR: '#FF0000',
    AUDIO_LEVEL_SECONDARY_COLOR: '#00FF00',
    // Other configuration properties...
};

// Importing the UIUtil module from '../util/UIUtil'
import UIUtil from '../util/UIUtil';

/**
 * Responsible for drawing audio levels.
 */
// Defining the AudioLevels object
const AudioLevels = {
    // Function to update the audio level for a large video element
    updateLargeVideoAudioLevel(elementId, audioLevel) {
        // Getting the element by its ID
        const element = document.getElementById(elementId);

        // Checking if the element is visible using UIUtil.isVisible() function
        if (!UIUtil.isVisible(element)) {
            return; // Exit the function if the element is not visible
        }

        // Parsing the audioLevel value to a float number or defaulting to 0
        const level = parseFloat(audioLevel) || 0;

        // Finding the shadow element within the main element
        const shadowElement = element.querySelector('.dynamic-shadow');

        // Checking if the shadowElement exists
        if (shadowElement) {
            // Setting the box shadow style of the shadowElement using _updateLargeVideoShadow() function
            shadowElement.style.boxShadow = this._updateLargeVideoShadow(level);
        }
    },

    // Function to generate the box shadow style based on the audio level
    _updateLargeVideoShadow(level) {
        // Defining the scale for adjusting the shadow level
        const scale = 2;

        // Defining the internal shadow properties
        const int = {
            level: level > 0.15 ? 20 : 0, // Setting the level based on the audio level threshold
            color: interfaceConfig.AUDIO_LEVEL_PRIMARY_COLOR, // Using the primary audio level color
            blur: 0 // Initializing the blur value
        };

        // Defining the external shadow properties
        const ext = {
            level: parseFloat(((int.level * scale * level) + int.level).toFixed(0)), // Calculating the external shadow level
            color: interfaceConfig.AUDIO_LEVEL_SECONDARY_COLOR, // Using the secondary audio level color
            blur: 0 // Initializing the blur value
        };

        // Adjusting the blur values based on the level
        int.blur = int.level ? 2 : 0;
        ext.blur = ext.level ? 6 : 0;

        // Returning the box shadow style by combining the internal and external shadows
        return `${this._getShadowStyle(int)} ${this._getShadowStyle(ext)}`;
    },

    // Function to generate the individual shadow style
    _getShadowStyle({ blur, level, color }) {
        return `0 0 ${blur}px ${level}px ${color}`; // Returning the shadow style string
    }
};

export default AudioLevels;

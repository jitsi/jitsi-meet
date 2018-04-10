import Chat from './chat/Chat';
import SettingsMenu from './settings/SettingsMenu';
import Profile from './profile/Profile';
import { isButtonEnabled } from '../../../react/features/toolbox';

const SidePanels = {
    init(eventEmitter) {
        // Initialize chat
        if (isButtonEnabled('chat')) {
            Chat.init(eventEmitter);
        }

        // Initialize settings
        if (isButtonEnabled('settings')) {
            SettingsMenu.init(eventEmitter);
        }

        // Initialize profile
        if (isButtonEnabled('profile')) {
            Profile.init(eventEmitter);
        }
    }
};

export default SidePanels;

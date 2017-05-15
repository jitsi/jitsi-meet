import Chat from './chat/Chat';
import SettingsMenu from './settings/SettingsMenu';
import Profile from './profile/Profile';
import ContactListView from './contactlist/ContactListView';
import UIUtil from '../util/UIUtil';

const SidePanels = {
    init (eventEmitter) {
        // Initialize chat
        if (UIUtil.isButtonEnabled('chat')) {
            Chat.init(eventEmitter);
        }

        // Initialize settings
        if (UIUtil.isButtonEnabled('settings')) {
            SettingsMenu.init(eventEmitter);
        }

        // Initialize profile
        if (UIUtil.isButtonEnabled('profile')) {
            Profile.init(eventEmitter);
        }

        // Initialize contact list view
        if (UIUtil.isButtonEnabled('contacts')) {
            ContactListView.init();
        }
    }
};

export default SidePanels;

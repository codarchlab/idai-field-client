const hotkeys = require('protractor-hotkeys');


export class MenuPage {

    public static navigateToSettings() {

        hotkeys.trigger('ctrl+alt+s');
    }


    public static navigateToImport() {

        hotkeys.trigger('ctrl+i');
    }


    public static navigateToImages() {

        hotkeys.trigger('ctrl+b');
    }
}
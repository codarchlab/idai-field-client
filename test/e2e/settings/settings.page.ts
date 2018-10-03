import {browser, protractor, element, by} from 'protractor';

let EC = protractor.ExpectedConditions;
let delays = require('../config/delays');
let common = require('../common.js');

/**
 * @author Thomas Kleinke
 */
export class SettingsPage {

    public static get = function() {

        return browser.get('#/settings');
    };


    public static clickSaveSettingsButton = function() {

        common.click(element(by.id('save-settings-button')));
    };


    public static getUserName = function() {

        return this.getUserNameInput().getAttribute('value');
    };


    public static getUserNameInput = function() {

        browser.wait(EC.visibilityOf(element(by.id('username-input'))), delays.ECWaitTime);
        return element(by.id('username-input'));
    };


    public static getImagestorePathInput = function() {

        browser.wait(EC.visibilityOf(element(by.id('imagestorepath-input'))), delays.ECWaitTime);
        return element(by.id('imagestorepath-input'));
    };
}
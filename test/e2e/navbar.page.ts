import {browser, protractor, element, by} from 'protractor';

const EC = protractor.ExpectedConditions;
const delays = require('./config/delays');
const common = require('./common');

export class NavbarPage {

    // click

    public static clickNavigateToProject() {

        return common.click(element.all(by.css('.nav-link')).get(0));
    }


    public static clickNavigateToExcavation() {

        return common.click(element.all(by.css('.nav-link')).get(2));
    };


    public static clickNavigateToBuilding() {

        return common.click(element.all(by.css('.nav-link')).get(3));
    };


    public static clickNavigateToMediaOverview() {

        return common.click(element.all(by.css('.nav-link')).get(8));
    };


    public static clickNavigateToMatrix() {

        return common.click(element.all(by.css('.nav-link')).get(6));
    };


    public static clickConflictsButton() {

        return common.click(element(by.id('taskbar-conflicts-button')));
    };


    public static clickConflictResolverLink(identifier) {

        return common.click(element(by.id('taskbar-conflict-' + identifier)));
    };


    public static clickSelectProject = function(option) {

        browser.wait(EC.presenceOf(element(by.id('projectSelectBox'))), delays.ECWaitTime);
        element.all(by.css('#projectSelectBox option')).get(option).click();
    };


    public static clickCloseAllMessages() {

        browser.wait(EC.presenceOf(element.all(by.css('.alert button')).first()), delays.ECWaitTime);
        return element.all(by.css('.alert button')).then(buttonEls=>{
            for (let buttonEl of buttonEls.reverse()) {
                buttonEl.click();
            }
        })
    };


    // await

    public static awaitAlert(text, matchExactly = true) {

        if (matchExactly) {
            browser.wait(EC.presenceOf(element(by.xpath("//span[@class='message-content' and normalize-space(text())='"+text+"']"))), delays.ECWaitTime);
        }
        else {
            browser.wait(EC.presenceOf(element(by.xpath("//span[@class='message-content' and contains(text(),'"+text+"')]"))), delays.ECWaitTime);
        }
    };


    // get text

    public static getMessageText() {

        browser.sleep(200);
        return element(by.id('message-0')).getText();
    };


    public static getActiveNavLinkLabel() {

        browser.wait(EC.visibilityOf(element(by.css('#navbarSupportedContent .nav-link.active'))), delays.ECWaitTime);
        return element(by.css('#navbarSupportedContent .nav-link.active')).getText();
    }


    // sequences

    public static performNavigateToSettings() {

        common.click(element(by.id('taskbar-dropdown')));
        return common.click(element(by.id('settings-button')));
    };


    public static performNavigateToImport() {

        common.click(element(by.id('taskbar-dropdown')));
        common.click(element(by.id('import-button')));
    };
}
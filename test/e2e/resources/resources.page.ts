import {browser, protractor, element, by} from 'protractor';

'use strict';
let common = require('../common.js');
let EC = protractor.ExpectedConditions;
let delays = require('../config/delays');
import {DocumentEditWrapperPage} from '../widgets/document-edit-wrapper.page';


export class ResourcesPage {

    public static get = function() {
        return browser.get('#/resources/excavation');
    };

    // click

    public static clickCreateObject = function() {
        common.click(by.id('object-overview-button-create-object'));
    };

    public static clickSaveInModal = function() {
        common.click(by.id('overview-save-confirmation-modal-save-button'));
    };

    public static clickCancelInModal = function() {
        common.click(by.id('overview-save-confirmation-modal-cancel-button'));
    };

    public static clickDiscardInModal = function() {
        common.click(by.id('overview-save-confirmation-modal-discard-button'));
    };

    public static clickDeleteDocument = function() {
        common.click(by.id('document-edit-button-delete-document'));
    };

    public static clickDeleteInModal = function() {
        common.click(by.id('delete-resource-confirm'));
    };

    public static clickChooseTypeFilter = function(typeIndex) {

        common.click(by.id('searchfilter'));
        common.click(by.id('choose-type-filter-option-' + typeIndex));
    };

    public static clickSelectGeometryType = function(type?) {
        let geom = 'none';
        if (type) geom = type;
        return common.click(by.id('choose-geometry-option-' + geom));
    };

    /**
     * @deprecated use selectObjectByIdentifier instead
     */
    public static clickSelectObjectByIndex = function(listIndex) {
        browser.wait(EC.visibilityOf(element(by.id('objectList')).all(by.tagName('li')).get(listIndex)),
            delays.ECWaitTime);
        return element(by.id('objectList')).all(by.tagName('li')).get(listIndex).click();
    };

    public static clickSelectResource = function(identifier) {
        return common.click(by.xpath('//*[@id="objectList"]//div[@class="identifier" and normalize-space(text())="'
            + identifier + '"]'));
    };

    public static clickListModeButton = function() {
        common.click(by.id('list-mode-button'));
    };

    public static openEditByDoubleClickResource = function(identifier) {
        browser.wait(EC.visibilityOf(
            element(by.xpath('//*[@id="objectList"]//div[@class="identifier" and normalize-space(text())="'
                + identifier + '"]'))), delays.ECWaitTime);
        return browser.actions().doubleClick(element(by.xpath('//*[@id="objectList"]//div[@class="identifier" and ' +
            'normalize-space(text())="' + identifier + '"]'))).perform();
    };

    public static clickSelectResourceType = function(typeIndex?) {
        if (!typeIndex) typeIndex = 0;
        return element(by.id('choose-type-option-' + typeIndex)).click();
    };

    // get text

    public static getListItemIdentifierText = function(itemNr) {
        browser.wait(EC.visibilityOf(element(by.css('#objectList .list-group-item:nth-child('
            + (itemNr + 1) + ') .identifier'))), delays.ECWaitTime);
        return element(by.css('#objectList .list-group-item:nth-child(' + (itemNr + 1) + ') .identifier')).getText();
    };

    public static getSelectedListItemIdentifierText = function() {
        browser.wait(EC.visibilityOf(element(by.css('#objectList .list-group-item.selected .identifier'))),
            delays.ECWaitTime);
        return element(by.css('#objectList .list-group-item.selected .identifier')).getText();
    };

    public static getListModeInputFieldValue = function(identifier, index) {
        return ResourcesPage.getListModeInputField(identifier, index).getAttribute('value');
    };

    public static getSelectedMainTypeDocumentOption = function() {
        browser.wait(EC.presenceOf(element(by.css('#mainTypeSelectBox option:checked'))), delays.ECWaitTime);
        return element.all(by.css('#mainTypeSelectBox option:checked')).getText();
    };

    // elements

    public static getListItemMarkedNewEl = function() {
        return element(by.css('#objectList .list-group-item .new'));
    };

    public static getListItemMarkedNewEls = function() {
        return element.all(by.css('#objectList .list-group-item .new'));
    };

    public static getListItemEl = function(identifier) {
        return element(by.id('resource-' + identifier));
    };

    public static getListModeInputField = function(identifier, index) {
        browser.wait(EC.visibilityOf(element.all(by.id('resource-' + identifier + ' input')).get(index)));
        return element.all(by.id('resource-' + identifier + ' input')).get(index);
    };

    public static selectMainType = function(option) {
        browser.wait(EC.presenceOf(element(by.id('mainTypeSelectBox'))), delays.ECWaitTime);
        element.all(by.css('#mainTypeSelectBox option')).get(option).click();
    };

    // sequences

    public static performCreateResource = function(identifier, typeIndex?, inputFieldText?: string, inputFieldIndex?: number) {
        ResourcesPage.clickCreateObject();
        ResourcesPage.clickSelectResourceType(typeIndex);
        ResourcesPage.clickSelectGeometryType();
        DocumentEditWrapperPage.typeInInputField(identifier);
        if (inputFieldText && inputFieldIndex) {
            DocumentEditWrapperPage.typeInInputField(inputFieldText, inputFieldIndex);
        }
        ResourcesPage.scrollUp();
        DocumentEditWrapperPage.clickSaveDocument();
        browser.sleep(delays.shortRest);
    };

    public static performCreateRelation = function(identifier, targetIdentifier, relationGroupIndex) {
        ResourcesPage.openEditByDoubleClickResource(identifier);
        DocumentEditWrapperPage.clickRelationsTab();
        DocumentEditWrapperPage.clickAddRelationForGroupWithIndex(relationGroupIndex);
        DocumentEditWrapperPage.typeInRelationByIndices(relationGroupIndex, 0, targetIdentifier);
        DocumentEditWrapperPage.clickChooseRelationSuggestion(relationGroupIndex, 0, 0);
        DocumentEditWrapperPage.clickSaveDocument();
        browser.sleep(delays.shortRest);
    };

    public static performCreateLink = function() {
        ResourcesPage.performCreateResource('1', 1); // Fund
        ResourcesPage.performCreateResource('2', 1); // Fund
        ResourcesPage.performCreateRelation('2', '1', 1);
    };

    // script

    public static scrollDown = function() {
        return browser.executeScript('window.scrollTo(0,200);');
    };

    public static scrollUp = function() {
        return browser.executeScript('window.scrollTo(0,0);');
    };

    // type in

    public static typeInIdentifierInSearchField = function(identifier) {
        return common.typeIn(element(by.id('object-search')), identifier);
    };

    public static typeInListModeInputField = function(identifier, index, inputText) {
        return common.typeIn(this.getListModeInputField(identifier, index), inputText);
    };
}
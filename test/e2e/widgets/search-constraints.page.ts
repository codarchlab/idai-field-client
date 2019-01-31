import {element, by, browser, protractor} from 'protractor';

const common = require('../common.js');
const EC = protractor.ExpectedConditions;
const delays = require('../config/delays');


/**
 * @author Thomas Kleinke
 */
export class SearchConstraintsPage {

    // click

    public static clickConstraintsMenuButton() {

        return common.click(element(by.id('constraints-menu-button')));
    }


    public static clickSelectConstraintField(fieldName: string) {

        common.click(this.getConstraintFieldOption(fieldName));
    };


    public static clickSelectDropdownValue(optionIndex: number) {

        browser.wait(EC.visibilityOf(element(by.id('constraint-search-term-select'))), delays.ECWaitTime);
        element.all(by.css('#constraint-search-term-select option')).get(optionIndex + 1).click();
    }


    public static clickSelectBooleanValue(value: boolean) {

        common.click(element(by.id('constraint-search-term-boolean-select-option-' + value)));
    }


    public static clickAddConstraintButton() {

        common.click(element(by.id('add-constraint-button')));
    }


    public static clickRemoveConstraintButton(fieldName: string) {

        common.click(element(by.id('remove-constraint-button-' + fieldName)));
    }


    // elements

    public static getConstraintFieldOption(fieldName: string) {

        return element(by.id('constraint-field-select-option-' + fieldName));
    }


    // type in

    public static typeInConstraintSearchTerm(inputText: string) {

        return common.typeIn(element(by.id('constraint-search-term-input')), inputText);
    }
}
'use strict';

import {element, by} from 'protractor';

const common = require('../common.js');

/**
 * @author Daniel de Oliveira
 */
export class ImagePickerModalPage {

    // click

    public static clickAddImage() {

        common.click(element(by.css('#image-picker-modal-header #add-image')));
    }


    public static clickAddImages() {

        common.click(element(by.css('#image-picker-modal-header #add-images')));
    }


    // typeIn

    public static typeInIdentifierInSearchField(identifier) {

       common.typeIn(element(by.css('#image-picker-modal .search-bar-input')), identifier);
    }


    // elements

    public static getCells() {

        return element.all(by.css('.cell'));
    }
}
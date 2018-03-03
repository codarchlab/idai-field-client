"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var configuration_1 = require("idai-components-2/configuration");
var idai_field_image_document_datastore_1 = require("../../../app/core/datastore/idai-field-image-document-datastore");
var idai_field_document_datastore_1 = require("../../../app/core/datastore/idai-field-document-datastore");
var document_datastore_1 = require("../../../app/core/datastore/document-datastore");
var idai_field_type_converter_1 = require("../../../app/core/datastore/idai-field-type-converter");
var type_utility_1 = require("../../../app/common/type-utility");
var static_1 = require("./static");
/**
 * @author Daniel de Oliveira
 */
var DAOsSpecHelper = (function () {
    function DAOsSpecHelper() {
        this.projectConfiguration = new configuration_1.ProjectConfiguration({
            'types': [
                {
                    'type': 'Trench',
                    'fields': []
                },
                {
                    'type': 'Image',
                    'fields': []
                }
            ]
        });
        spyOn(console, 'debug'); // suppress console.debug
        var _a = static_1.Static.createPouchdbDatastore('testdb'), datastore = _a.datastore, documentCache = _a.documentCache;
        var converter = new idai_field_type_converter_1.IdaiFieldTypeConverter(new type_utility_1.TypeUtility(this.projectConfiguration));
        this.idaiFieldImageDocumentDatastore = new idai_field_image_document_datastore_1.IdaiFieldImageDocumentDatastore(datastore, documentCache, converter);
        this.idaiFieldDocumentDatastore = new idai_field_document_datastore_1.IdaiFieldDocumentDatastore(datastore, documentCache, converter);
        this.documentDatastore = new document_datastore_1.DocumentDatastore(datastore, documentCache, converter);
    }
    return DAOsSpecHelper;
}());
exports.DAOsSpecHelper = DAOsSpecHelper;
//# sourceMappingURL=daos-spec-helper.js.map
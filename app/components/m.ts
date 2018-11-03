import {Injectable} from '@angular/core';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {MD, Message} from 'idai-components-2';

/**
 * @author Daniel de Oliveira
 * @author Jan G. Wieners
 * @author Thomas Kleinke
 */
@Injectable()
export class M extends MD { // = Messages Dictionary. For reasons of brevity of calls to it just 'M'.

    // Internal messages from components
    // The original messages in the internal dictionary are overwritten with the translated ones
    public static MESSAGES_ERROR_UNKNOWN_MESSAGE: string = 'messages.error.unknownMessage';
    public static PROJECT_CONFIGURATION_ERROR_GENERIC: string = 'projectConfiguration.error.generic';
    public static CONFIG_READER_ERROR_INVALID_JSON: string = 'configReader.error.invalidJson';

    // All packages
    public static ALL_ERROR_FIND = 'all.error.find';

    // App Package
    public static APP_ERROR_GENERIC_SAVE_ERROR = 'app.error.genericSaveError';

    // Settings Package
    public static SETTINGS_SUCCESS = 'settings.success';
    public static SETTINGS_ERROR_MALFORMED_ADDRESS = 'settings.error.malformedAddress';

    // Model Package
    public static MODEL_VALIDATION_ERROR_IDENTIFIER_EXISTS = 'model.validation.error.identifierExists';
    public static MODEL_VALIDATION_ERROR_MISSING_COORDINATES = 'model.validation.error.missingCoordinates';
    public static MODEL_VALIDATION_ERROR_INVALID_COORDINATES = 'model.validation.error.invalidCoordinates';
    public static MODEL_VALIDATION_ERROR_MISSING_GEOMETRYTYPE = 'model.validation.error.missingGeometryType';
    public static MODEL_VALIDATION_ERROR_UNSUPPORTED_GEOMETRYTYPE = 'model.validation.error.unsupportedGeometryType';

    // Backup Package
    public static BACKUP_WRITE_SUCCESS = 'backup.write.success';
    public static BACKUP_READ_SUCCESS = 'backup.read.success';
    public static BACKUP_WRITE_ERROR_GENERIC = 'backup.write.error.generic';
    public static BACKUP_READ_ERROR_GENERIC = 'backup.read.error.generic';
    public static BACKUP_READ_ERROR_FILE_NOT_FOUND = 'backup.read.error.fileNotFound';
    public static BACKUP_READ_ERROR_NO_PROJECT_NAME = 'backup.read.error.noProjectName';
    public static BACKUP_READ_ERROR_SAME_PROJECT_NAME = 'backup.read.error.sameProjectName';

    // Import Package
    public static IMPORT_SUCCESS_SINGLE= 'importer.success.single';
    public static IMPORT_SUCCESS_MULTIPLE= 'importer.success.multiple';
    public static IMPORT_WARNING_GEOJSON_DUPLICATE_IDENTIFIER= 'importer.warning.geojsonDuplicateIdentifier';
    public static IMPORT_WARNING_GEOJSON_DUPLICATE_IDENTIFIERS= 'importer.warning.geojsonDuplicateIdentifiers';
    public static IMPORT_ERROR_GENERIC_START_ERROR= 'importer.error.genericStartError';
    public static IMPORT_ERROR_FILE_UNREADABLE = 'importer.error.fileUnreadable';
    public static IMPORT_ERROR_INVALID_JSON = 'importer.error.invalidJson';
    public static IMPORT_ERROR_INVALID_JSONL = 'importer.error.invalidJsonl';
    public static IMPORT_ERROR_INVALID_GEOJSON_IMPORT_STRUCT = 'importer.error.invalidGeojsonImportStruct';
    public static IMPORT_ERROR_MISSING_IDENTIFIER = 'importer.error.missingIdentifier';
    public static IMPORT_ERROR_IDENTIFIER_FORMAT = 'importer.error.identifierFormat';
    public static IMPORT_ERROR_INVALID_CSV = 'importer.error.invalidCsv';
    public static IMPORT_ERROR_GENERIC_CSV_ERROR = 'importer.error.genericCsvError';
    public static IMPORT_ERROR_MANDATORY_CSV_FIELD_MISSING = 'importer.error.mandatoryCsvFieldMissing';
    public static IMPORT_ERROR_GENERIC_DATASTORE_ERROR = 'importer.error.genericDatastoreError';
    public static IMPORT_ERROR_INVALID_GEOMETRY = 'importer.error.invalidGeometry';
    public static IMPORT_ERROR_ROLLBACK_ERROR = 'importer.error.rollbackError';
    public static IMPORT_ERROR_MISSING_RESOURCE = 'importer.error.missingResource';
    public static IMPORT_ERROR_MISSING_RELATION_TARGET = 'importer.error.missingRelationTarget';
    public static IMPORT_ERROR_INVALID_OPERATION_RESOURCE = 'importer.error.invalidOperationResource';
    public static IMPORT_ERROR_OPERATIONS_NOT_ALLOWED = 'importer.error.operationsNotAllowed';
    public static IMPORT_ERROR_NO_OPERATION_ASSIGNABLE = 'importer.error.noOperationAssignable';
    public static IMPORT_ERROR_NO_FEATURE_ASSIGNABLE = 'importer.error.noFeatureAssignable';
    public static IMPORT_VALIDATION_ERROR_MISSING_PROPERTY = 'import.validation.error.missingProperty';
    public static IMPORT_VALIDATION_ERROR_NO_RECORDEDIN = 'import.validation.error.noRecordedin';
    public static IMPORT_VALIDATION_ERROR_NO_RECORDEDIN_TARGET = 'import.validation.error.noRecordedinTarget';
    public static IMPORT_VALIDATION_ERROR_INVALID_TYPE = 'import.validation.error.invalidType';
    public static IMPORT_VALIDATION_ERROR_INVALID_FIELD = 'import.validation.error.invalidField';
    public static IMPORT_VALIDATION_ERROR_INVALID_FIELDS = 'import.validation.error.invalidFields';
    public static IMPORT_VALIDATION_ERROR_INVALID_RELATION_FIELD = 'import.validation.error.invalidRelationField';
    public static IMPORT_VALIDATION_ERROR_INVALID_RELATION_FIELDS = 'import.validation.error.invalidRelationFields';
    public static IMPORT_VALIDATION_ERROR_INVALID_NUMERIC_VALUE = 'import.validation.error.invalidNumericValue';
    public static IMPORT_VALIDATION_ERROR_INVALID_NUMERIC_VALUES = 'import.validation.error.invalidNumericValues';

    // Datastore Package
    public static DATASTORE_ERROR_NOT_FOUND = 'datastore.error.notFound';

    // Docedit Package
    public static DOCEDIT_SUCCESS_SAVE = 'docedit.success.save';
    public static DOCEDIT_SUCCESS_DELETE = 'docedit.success.delete';
    public static DOCEDIT_WARNING_SAVE_CONFLICT = 'docedit.warning.saveConflict';
    public static DOCEDIT_WARNING_TYPE_CHANGE_FIELDS = 'docedit.warning.typeChange.fields';
    public static DOCEDIT_WARNING_TYPE_CHANGE_RELATIONS = 'docedit.warning.typeChange.relations';
    public static DOCEDIT_ERROR_SAVE = 'docedit.error.save';
    public static DOCEDIT_ERROR_DELETE = 'docedit.error.delete';
    public static DOCEDIT_VALIDATION_ERROR_INVALID_NUMERIC_VALUE = 'docedit.validation.error.invalidNumericValue';
    public static DOCEDIT_VALIDATION_ERROR_INVALID_NUMERIC_VALUES = 'docedit.validation.error.invalidNumericValues';
    public static DOCEDIT_VALIDATION_ERROR_MISSING_PROPERTY = 'docedit.validation.error.missingProperty';
    public static DOCEDIT_VALIDATION_ERROR_NO_RECORDEDIN = 'docedit.validation.error.noRecordedIn';
    public static DOCEDIT_VALIDATION_ERROR_NO_RECORDEDIN_TARGET = 'docedit.validation.error.noRecordedInTarget';

    // Images Package
    public static IMAGES_SUCCESS_WORLDFILE_UPLOADED = 'images.success.worldfileUploaded';
    public static IMAGES_SUCCESS_GEOREFERENCE_DELETED = 'images.success.georeferenceDeleted';

    // Imagestore Package
    public static IMAGESTORE_ERROR_INVALID_PATH = 'imagestore.error.invalidPath';
    public static IMAGESTORE_ERROR_INVALID_PATH_READ = 'imagestore.error.invalidPath.read';
    public static IMAGESTORE_ERROR_INVALID_PATH_WRITE = 'imagestore.error.invalidPath.write';
    public static IMAGESTORE_ERROR_INVALID_PATH_DELETE = 'imagestore.error.invalidPath.delete';
    public static IMAGESTORE_ERROR_WRITE = 'imagestore.error.write';
    public static IMAGESTORE_ERROR_DELETE = 'imagestore.error.delete';
    public static IMAGESTORE_ERROR_INVALID_WORLDFILE = 'imagestore.error.invalidWorldfile';
    public static IMAGESTORE_DROP_AREA_ERROR_UNSUPPORTED_EXTENSIONS = 'imagestore.dropArea.error.unsupportedExtensions';

    // Resources Package
    public static RESOURCES_SUCCESS_FILE_UPLOADED = 'resources.success.fileUploaded';
    public static RESOURCES_SUCCESS_FILES_UPLOADED = 'resources.success.filesUploaded';
    public static RESOURCES_WARNING_PROJECT_NAME_NOT_SAME = 'resources.error.projectNameNotSame';
    public static RESOURCES_ERROR_TYPE_NOT_FOUND = 'resources.error.typeNotFound';
    public static RESOURCES_ERROR_NO_PROJECT_NAME = 'resources.error.noProjectName';
    public static RESOURCES_ERROR_PROJECT_NAME_LENGTH = 'resources.error.projectNameLength';
    public static RESOURCES_ERROR_PROJECT_NAME_SYMBOLS = 'resources.error.projectNameSymbols';
    public static RESOURCES_ERROR_PROJECT_NAME_EXISTS = 'resources.error.projectNameExists';
    public static RESOURCES_ERROR_ONE_PROJECT_MUST_EXIST = 'resources.error.oneProjectMustExist';

    // Media overview Package
    public static MEDIA_SUCCESS_FILE_UPLOADED = 'media.success.fileUploaded';
    public static MEDIA_SUCCESS_FILES_UPLOADED = 'media.success.filesUploaded';

    // Upload Package
    public static UPLOAD_ERROR_UNSUPPORTED_EXTENSIONS: string = 'upload.error.unsupportedExtensions';
    public static UPLOAD_ERROR_FILE_READER: string = 'upload.error.fileReader';
    public static UPLOAD_ERROR_DUPLICATE_FILENAME: string = 'upload.error.duplicateFilename';
    public static UPLOAD_ERROR_DUPLICATE_FILENAMES: string = 'upload.error.duplicateFilenames';
    public static UPLOAD_ERROR_FILE_TYPES_MIXED: string = 'upload.error.fileTypesMixed';

    // Model3DStore Package
    public static MODEL_3D_STORE_ERROR_WRITE: string = 'model3dStore.error.write';


    // Keys END /////////////////////////////////

    public msgs : { [id: string]: Message } = {};


    constructor(private i18n: I18n) {

        super();

        this.msgs[M.MESSAGES_ERROR_UNKNOWN_MESSAGE] = {
            content: i18n({
                id: 'messages.messages.error.unknownMessage',
                value: 'Ein unbekannter Fehler ist aufgetreten. Details können in der Developer Console eingesehen werden.',
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.PROJECT_CONFIGURATION_ERROR_GENERIC] = {
            content: i18n({
                id: 'messages.configuration.error.generic',
                value: 'Fehler beim Auswerten eines Konfigurationsobjektes.',
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.CONFIG_READER_ERROR_INVALID_JSON] = {
            content: i18n({
                id: 'messages.configReader.error.invalidJson',
                value: 'Fehler beim Parsen der Konfigurationsdatei \'[0]\': Das JSON ist nicht valide.',
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.ALL_ERROR_FIND] = {
            content: i18n({
                id: 'messages.all.error.find',
                value: 'Beim Laden von Ressourcen ist ein Fehler aufgetreten.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.SETTINGS_SUCCESS] = {
            content: i18n({
                id: 'messages.settings.success',
                value: 'Die Einstellungen wurden erfolgreich aktiviert.'
            }),
            level: 'success',
            params: [],
            hidden: false
        };
        this.msgs[M.SETTINGS_ERROR_MALFORMED_ADDRESS] = {
            content: i18n({
                id: 'messages.settings.error.malformedAddress',
                value: 'Die angegebene Serveradresse entspricht nicht dem angegebenen Format.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.APP_ERROR_GENERIC_SAVE_ERROR] = {
            content: i18n({
                id: 'messages.app.error.genericSaveError',
                value: 'Beim Speichern der Ressource ist ein Fehler aufgetreten.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.BACKUP_WRITE_SUCCESS] = {
            content: i18n({
                id: 'messages.backup.write.success',
                value: 'Die Datenbank wurde erfolgreich gesichert.'
            }),
            level: 'success',
            params: [],
            hidden: false
        };
        this.msgs[M.BACKUP_READ_SUCCESS] = {
            content: i18n({
                id: 'messages.backup.read.success',
                value: 'Das Backup wurde erfolgreich eingelesen.'
            }),
            level: 'success',
            params: [],
            hidden: false
        };
        this.msgs[M.BACKUP_WRITE_ERROR_GENERIC] = {
            content: i18n({
                id: 'messages.backup.write.error.generic',
                value: 'Beim Sichern der Datenbank ist ein Fehler aufgetreten.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.BACKUP_READ_ERROR_GENERIC] = {
            content: i18n({
                id: 'messages.backup.read.error.generic',
                value: 'Beim Einlesen der Backup-Datei ist ein Fehler aufgetreten.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.BACKUP_READ_ERROR_FILE_NOT_FOUND] = {
            content: i18n({
                id: 'messages.backup.read.error.fileNotFound',
                value: 'Die angegebene Datei konnte nicht gefunden werden.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.BACKUP_READ_ERROR_NO_PROJECT_NAME] = {
            content: i18n({
                id: 'messages.backup.read.error.noProjectName',
                value: 'Geben Sie einen Projektnamen an, um fortzufahren.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.BACKUP_READ_ERROR_SAME_PROJECT_NAME] = {
            content: i18n({
                id: 'messages.backup.read.error.sameProjectName',
                value: 'Bitte wählen Sie als Ziel ein anderes als das gerade ausgewählte Projekt.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.MODEL_VALIDATION_ERROR_IDENTIFIER_EXISTS] = {
            content: i18n({
                id: 'messages.model.validation.error.identifierExists',
                value: 'Der Ressourcen-Bezeichner [0] existiert bereits.'
            }),
            level: 'danger',
            params: [''],
            hidden: false
        };
        this.msgs[M.MODEL_VALIDATION_ERROR_MISSING_COORDINATES] = {
            content: i18n({
                id: 'messages.model.validation.error.missingCoordinates',
                value: 'Die Koordinaten einer Geometrie sind nicht definiert.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.MODEL_VALIDATION_ERROR_INVALID_COORDINATES] = {
            content: i18n({
                id: 'messages.model.validation.error.invalidCoordinates',
                value: 'Die Koordinaten einer Geometrie vom Typ [0] sind nicht valide.'
            }),
            level: 'danger',
            params: ['?'],
            hidden: false
        };
        this.msgs[M.MODEL_VALIDATION_ERROR_MISSING_GEOMETRYTYPE] = {
            content: i18n({
                id: 'messages.model.validation.error.missingGeometryType',
                value: 'Der Typ einer Geometrie ist nicht definiert.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.MODEL_VALIDATION_ERROR_UNSUPPORTED_GEOMETRYTYPE] = {
            content: i18n({
                id: 'messages.model.validation.error.unsupportedGeometryType',
                value: 'Der Geometrietyp [0] wird von der Anwendung nicht unterstützt.'
            }),
            level: 'danger',
            params: ['?'],
            hidden: false
        };
        this.msgs[M.IMPORT_SUCCESS_SINGLE] = {
            content: i18n({
                id: 'messages.import.success.single',
                value: 'Eine Ressource wurde erfolgreich importiert.'
            }),
            level: 'success',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORT_SUCCESS_MULTIPLE] = {
            content: i18n({
                id: 'messages.import.success.multiple',
                value: '[0] Ressourcen wurden erfolgreich importiert.'
            }),
            level: 'success',
            params: [
                i18n({
                    id: 'messages.import.success.multiple.defaultParameter',
                    value: 'Mehrere'
                })],
            hidden: false
        };
        this.msgs[M.IMPORT_WARNING_GEOJSON_DUPLICATE_IDENTIFIER] = {
            content: i18n({
                id: 'messages.import.warning.geojson.duplicateIdentifier',
                value: 'In den GeoJSON-Daten ist der Ressourcen-Bezeichner [0] mehrfach eingetragen. Bitte beachten Sie, dass lediglich die zuletzt aufgeführten Geometriedaten importiert wurden.'
            }),
            level: 'warning',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORT_WARNING_GEOJSON_DUPLICATE_IDENTIFIERS] = {
            content: i18n({
                id: 'messages.import.warning.geojson.duplicateIdentifiers',
                value: 'In den GeoJSON-Daten sind folgende Ressourcen-Bezeichner mehrfach eingetragen: [0]. Bitte beachten Sie, dass lediglich die jeweils zuletzt aufgeführten Geometriedaten importiert wurden.'
            }),
            level: 'warning',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORT_ERROR_GENERIC_START_ERROR] = {
            content: i18n({
                id: 'messages.import.error.genericStartError',
                value: 'Import kann nicht gestartet werden.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORT_ERROR_FILE_UNREADABLE] = {
            content: i18n({
                id: 'messages.import.error.fileUnreadable',
                value: 'Beim Import ist ein Fehler aufgetreten: Die Datei [0] konnte nicht gelesen werden.',
            }),
            level: 'danger',
            params: [''],
            hidden: false
        };
        this.msgs[M.IMPORT_ERROR_INVALID_JSON] = {
            content: i18n({
                id: 'messages.import.error.invalidJson',
                value: 'Beim Import ist ein Fehler aufgetreten: Das JSON ist nicht valide. Die ursprüngliche Fehlermeldung lautet: [0].'
            }),
            level: 'danger',
            params: ['?'],
            hidden: false
        };
        this.msgs[M.IMPORT_ERROR_INVALID_JSONL] = {
            content: i18n({
                id: 'messages.import.error.invalidJsonl',
                value: 'Beim Import ist ein Fehler aufgetreten: Das JSON in Zeile [0] ist nicht valide.'
            }),
            level: 'danger',
            params: ['?'],
            hidden: false
        };
        this.msgs[M.IMPORT_ERROR_INVALID_GEOJSON_IMPORT_STRUCT] = {
            content: i18n({
                id: 'messages.import.error.invalidGeojsonImportStruct',
                value: 'Fehlerhafte GeoJSON-Importstruktur. Grund: [0].'
            }),
            level: 'danger',
            params: ['?'],
            hidden: false
        };
        this.msgs[M.IMPORT_ERROR_MISSING_IDENTIFIER] = {
            content: i18n({
                id: 'messages.import.error.missingIdentifier',
                value: 'Beim Import ist ein Fehler aufgetreten: Ein oder mehrere Features ohne properties.identifier wurden gefunden.'
            }),
            level: 'danger',
            params: ['?'],
            hidden: false
        };
        this.msgs[M.IMPORT_ERROR_IDENTIFIER_FORMAT] = {
            content: i18n({
                id: 'messages.import.error.identifierFormat',
                value: 'Beim Import ist ein Fehler aufgetreten: properties.identifier muss eine Zeichenkette sein, keine Zahl.'
            }),
            level: 'danger',
            params: ['?'],
            hidden: false
        };
        this.msgs[M.IMPORT_ERROR_INVALID_CSV] = {
            content: i18n({
                id: 'messages.import.error.invalidCsv',
                value: 'Beim Import ist ein Fehler aufgetreten: Das CSV in Zeile [0] konnte nicht gelesen werden.'
            }),
            level: 'danger',
            params: ['?'],
            hidden: false
        };
        this.msgs[M.IMPORT_ERROR_GENERIC_CSV_ERROR] = {
            content: i18n({
                id: 'messages.import.error.genericCsvError',
                value: 'Beim Import ist ein Fehler aufgetreten: Die CSV-Daten konnten nicht gelesen werden.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORT_ERROR_MANDATORY_CSV_FIELD_MISSING] = {
            content: i18n({
                id: 'messages.import.error.mandatoryCsvFieldMissing',
                value: 'Beim Import ist ein Fehler aufgetreten: In Zeile [0] fehlt das Pflichtfeld \'[1]\'.'
            }),
            level: 'danger',
            params: ['?', '?'],
            hidden: false
        };
        this.msgs[M.IMPORT_ERROR_INVALID_OPERATION_RESOURCE] = {
            content: i18n({
                id: 'messages.import.error.invalidOperationResource',
                value: 'Beim Import ist ein Fehler aufgetreten: Ressourcen vom Typ [0] können der gewählten Maßnahme vom Typ [1] nicht zugeordnet werden.'
            }),
            level: 'danger',
            params: ['?', '?'],
            hidden: false
        };
        this.msgs[M.IMPORT_ERROR_OPERATIONS_NOT_ALLOWED] = {
            content: i18n({
                id: 'messages.import.error.operationsNotAllowed',
                value: 'Wenn die Option \'Daten einer Maßnahme zuordnen\' gewählt ist, darf die Import-Datei keine Maßnahmen enthalten.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORT_ERROR_GENERIC_DATASTORE_ERROR] = {
            content: i18n({
                id: 'messages.import.error.genericDatastoreError',
                value: 'Beim Import ist ein Fehler aufgetreten: Die Ressource [0] konnte nicht gespeichert werden.'
            }),
            level: 'danger',
            params: [ '?' ],
            hidden: false
        };
        this.msgs[M.IMPORT_ERROR_INVALID_GEOMETRY] = {
            content: i18n({
                id: 'messages.import.error.invalidGeometry',
                value: 'Beim Import ist ein Fehler aufgetreten: Invalide Geometriedaten in Zeile [0].'
            }),
            level: 'danger',
            params: ['?'],
            hidden: false
        };
        this.msgs[M.IMPORT_ERROR_ROLLBACK_ERROR] = {
            content: i18n({
                id: 'messages.import.error.rollbackError',
                value: 'Beim Versuch, die bereits importierten Daten zu löschen, ist ein Fehler aufgetreten.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORT_ERROR_MISSING_RESOURCE] = {
            content: i18n({
                id: 'messages.import.error.missingResource',
                value: 'Die Zuordnung zu einer Ressource mit dem Bezeichner [0] ist fehlgeschlagen. Die Ressource wurde nicht gefunden.'
            }),
            level: 'danger',
            params: ['?'],
            hidden: false
        };
        this.msgs[M.IMPORT_ERROR_MISSING_RELATION_TARGET] = {
            content: i18n({
                id: 'messages.import.error.missingRelationTarget',
                value: 'Beim Import ist ein Fehler aufgetreten: Die als Ziel einer Relation angegebene Ressource mit der ID [0] konnte nicht gefunden werden.'
            }),
            level: 'danger',
            params: ['?'],
            hidden: false
        };
        this.msgs[M.IMPORT_ERROR_NO_OPERATION_ASSIGNABLE] = {
            content: i18n({
                id: 'messages.import.error.noOperationAssignable',
                value: 'Beim Import ist ein Fehler aufgetreten: Eine Ressource konnte keiner Maßnahme mit dem Bezeichner \'[0]\' zugeordnet werden.'
            }),
            level: 'danger',
            params: ['?'],
            hidden: false
        };
        this.msgs[M.IMPORT_ERROR_NO_FEATURE_ASSIGNABLE] = {
            content: i18n({
                id: 'messages.import.error.noFeatureAssignable',
                value: 'Beim Import ist ein Fehler aufgetreten: Eine Ressource konnte keiner stratigraphischen Einheit zugeordnet werden. Ziel-Bezeichner oder Fehler: \'[0]\''
            }),
            level: 'danger',
            params: ['?'],
            hidden: false
        };
        this.msgs[M.IMPORT_VALIDATION_ERROR_INVALID_TYPE] = {
            content: i18n({
                id: 'messages.import.validation.error.invalidType',
                value: 'Ungültige Typdefinition: \'[0]\''
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORT_VALIDATION_ERROR_INVALID_FIELD] = {
            content: i18n({
                id: 'messages.import.validation.error.invalidField',
                value: 'Fehlende Felddefinition für das Feld \'[1]\' der Ressource vom Typ \'[0]\'.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORT_VALIDATION_ERROR_INVALID_FIELDS] = {
            content: i18n({
                id: 'messages.import.validation.error.invalidFields',
                value: 'Fehlende Felddefinitionen für die Felder \'[1]\' der Ressource vom Typ \'[0]\'.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.MEDIA_SUCCESS_FILE_UPLOADED] = {
            content: i18n({
                id: 'messages.media.success.fileUploaded',
                value: 'Die Datei wurde erfolgreich importiert.'
            }),
            level: 'success',
            params: [],
            hidden: false
        };
        this.msgs[M.MEDIA_SUCCESS_FILES_UPLOADED] = {
            content: i18n({
                id: 'messages.media.success.filesUploaded',
                value: '{0} Dateien wurden erfolgreich importiert.'
            }),
            level: 'success',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORT_VALIDATION_ERROR_INVALID_RELATION_FIELD] = {
            content: i18n({
                id: 'messages.import.validation.error.invalidRelationField',
                value: 'Fehlende Definition für die Relation \'[1]\' der Ressource vom Typ \'[0]\'.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORT_VALIDATION_ERROR_INVALID_RELATION_FIELDS] = {
            content: i18n({
                id: 'messages.import.validation.error.invalidRelationFields',
                value: 'Fehlende Definitionen für die Relationen \'[1]\' der Ressource vom Typ \'[0]\'.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORT_VALIDATION_ERROR_INVALID_NUMERIC_VALUE] = {
            content: i18n({
                id: 'messages.import.validation.error.invalidNumericValue',
                value: 'Falsche Zahlenwerte für das Feld \'[1]\' der Ressource vom Typ \'[0]\'.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORT_VALIDATION_ERROR_INVALID_NUMERIC_VALUES] = {
            content: i18n({
                id: 'messages.import.validation.error.invalidNumericValues',
                value: 'Falsche Zahlenwerte für die Felder \'[1]\' der Ressource vom Typ \'[0]\'.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORT_VALIDATION_ERROR_MISSING_PROPERTY] = {
            content: i18n({
                id: 'messages.import.validation.error.missingProperty',
                value: 'Eigenschaft(en) der Ressource vom Typ \'[0]\' müssen vorhanden sein: \'[1]\'.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORT_VALIDATION_ERROR_NO_RECORDEDIN] = {
            content: i18n({
                id: 'messages.import.validation.error.noRecordedIn',
                value: 'Fehlende Definition von \'Aufgenommen in Maßnahme\'. Eine Zuordnung muss vorgenommen werden.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORT_VALIDATION_ERROR_NO_RECORDEDIN_TARGET] = {
            content: i18n({
                id: 'messages.import.validation.error.noRecordedInTarget',
                value: 'Fehlendes Ziel einer Relation vom Typ \'Aufgenommen in Maßnahme\'. Ziel-ID: [0].'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.DATASTORE_ERROR_NOT_FOUND] = {
            content: i18n({
                id: 'messages.datastore.error.notFound',
                value: 'Die Ressource konnte nicht gefunden werden.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.DOCEDIT_SUCCESS_SAVE] = {
            content: i18n({
                id: 'messages.docedit.success.save',
                value: 'Die Ressource wurde erfolgreich gespeichert.'
            }),
            level: 'success',
            params: [],
            hidden: false
        };
        this.msgs[M.DOCEDIT_SUCCESS_DELETE] = {
            content: i18n({
                id: 'messages.docedit.success.delete',
                value: 'Die Ressource wurde erfolgreich gelöscht.'
            }),
            level: 'success',
            params: [],
            hidden: false
        };
        this.msgs[M.DOCEDIT_WARNING_SAVE_CONFLICT] = {
            content: i18n({
                id: 'messages.docedit.warning.saveConflict',
                value: 'Beim Speichern der Ressource ist ein Konflikt aufgetreten.'
            }),
            level: 'warning',
            params: [],
            hidden: false
        };
        this.msgs[M.DOCEDIT_WARNING_TYPE_CHANGE_FIELDS] = {
            content: i18n({
                id: 'messages.docedit.warning.typeChange.fields',
                value: 'Bitte beachten Sie, dass die Daten der folgenden Felder beim Speichern verloren gehen: [0]'
            }),
            level: 'warning',
            params: [''],
            hidden: false
        };
        this.msgs[M.DOCEDIT_WARNING_TYPE_CHANGE_RELATIONS] = {
            content: i18n({
                id: 'messages.docedit.warning.typeChange.relations',
                value: 'Bitte beachten Sie, dass die Relationen der folgenden Relationstypen beim Speichern verloren gehen: [0]'
            }),
            level: 'warning',
            params: [''],
            hidden: false
        };
        this.msgs[M.DOCEDIT_ERROR_SAVE] = {
            content: i18n({
                id: 'messages.docedit.error.save',
                value: 'Beim Speichern der Ressource ist ein Fehler aufgetreten.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.DOCEDIT_ERROR_DELETE] = {
            content: i18n({
                id: 'messages.docedit.error.delete',
                value: 'Beim Löschen der Ressource ist ein Fehler aufgetreten.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.DOCEDIT_VALIDATION_ERROR_INVALID_NUMERIC_VALUE] = {
            content: i18n({
                id: 'messages.docedit.validation.error.invalidNumericValue',
                value: 'Bitte tragen Sie im Feld \'[1]\' einen gültigen Zahlenwert ein.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.DOCEDIT_VALIDATION_ERROR_INVALID_NUMERIC_VALUES] = {
            content: i18n({
                id: 'messages.docedit.validation.error.invalidNumericValues',
                value: 'Bitte tragen Sie in den Feldern \'[1]\' gültige Zahlenwerte ein.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.DOCEDIT_VALIDATION_ERROR_MISSING_PROPERTY] = {
            content: i18n({
                id: 'messages.docedit.validation.error.missingProperty',
                value: 'Bitte füllen Sie das Feld \'[1]\' aus.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.DOCEDIT_VALIDATION_ERROR_NO_RECORDEDIN] = {
            content: i18n({
                id: 'messages.docedit.validation.error.noRecordedIn',
                value: 'Bitte wählen Sie eine Zielressource für die Relation \'Aufgenommen in Maßnahme\' aus.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.DOCEDIT_VALIDATION_ERROR_NO_RECORDEDIN_TARGET] = {
            content: i18n({
                id: 'messages.docedit.validation.error.noRecordedInTarget',
                value: 'Die Zielressource [0] der Relation \'Aufgenommen in Maßnahme\' konnte nicht gefunden werden.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMAGES_SUCCESS_WORLDFILE_UPLOADED] = {
            content: i18n({
                id: 'messages.images.success.worldfileUploaded',
                value: 'Das Worldfile wurde erfolgreich geladen.'
            }),
            level: 'success',
            params: [],
            hidden: false
        };
        this.msgs[M.IMAGES_SUCCESS_GEOREFERENCE_DELETED] = {
            content: i18n({
                id: 'messages.images.success.georeferenceDeleted',
                value: 'Die Georeferenzdaten wurden erfolgreich gelöscht.'
            }),
            level: 'success',
            params: [],
            hidden: false
        };
        this.msgs[M.IMAGESTORE_ERROR_INVALID_PATH] = {
            content: i18n({
                id: 'messages.imagestore.error.invalidPath',
                value: 'Das Bilderverzeichnis konnte nicht gefunden werden. Der Verzeichnispfad \'[0]\' ist ungültig.'
            }),
            level: 'warning',
            params: [],
            hidden: false
        };
        this.msgs[M.IMAGESTORE_ERROR_INVALID_PATH_READ] = {
            content: i18n({
                id: 'messages.imagestore.error.invalidPath.read',
                value: 'Es können keine Dateien aus dem Bilderverzeichnis gelesen werden. Bitte geben Sie einen gültigen Verzeichnispfad in den Einstellungen an.'
            }),
            level: 'warning',
            params: [],
            hidden: false
        };
        this.msgs[M.IMAGESTORE_ERROR_INVALID_PATH_WRITE] = {
            content: i18n({
                id: 'messages.imagestore.error.invalidPath.write',
                value: 'Es können keine Dateien im Bilderverzeichnis gespeichert werden. Bitte geben Sie einen gültigen Verzeichnispfad in den Einstellungen an.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMAGESTORE_ERROR_INVALID_PATH_DELETE] = {
            content: i18n({
                id: 'messages.imagestore.error.invalidPath.delete',
                value: 'Es können keine Dateien aus dem Bilderverzeichnis gelöscht werden. Bitte geben Sie einen gültigen Verzeichnispfad in den Einstellungen an.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMAGESTORE_ERROR_WRITE] = {
            content: i18n({
                id: 'messages.imagestore.error.write',
                value: 'Die Datei \'[0]\' konnte nicht im Bilderverzeichnis gespeichert werden.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMAGESTORE_ERROR_DELETE] = {
            content: i18n({
                id: 'messages.imagestore.error.delete',
                value: 'Fehler beim Löschen des Bilds \'[0]\'.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMAGESTORE_ERROR_INVALID_WORLDFILE] = {
            content: i18n({
                id: 'messages.imagestore.error.invalidWorldfile',
                value: 'Die Datei \'[0]\' ist kein gültiges World-File.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMAGESTORE_DROP_AREA_ERROR_UNSUPPORTED_EXTENSIONS] = {
            content: i18n({
                id: 'messages.imagestore.dropArea.error.unsupportedExtensions',
                value: 'Diese Auswahl ein oder mehrerer Dateien enhält ungültige Dateiformate ([0]). Die entsprechenden Dateien werden ignoriert.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.RESOURCES_SUCCESS_FILE_UPLOADED] = {
            content: i18n({
                id: 'messages.resources.success.fileUploaded',
                value: 'Die Datei wurde erfolgreich importiert und mit der Ressource {0} verknüpft.'
            }),
            level: 'success',
            params: [],
            hidden: false
        };
        this.msgs[M.RESOURCES_SUCCESS_FILES_UPLOADED] = {
            content: i18n({
                id: 'messages.resources.success.filesUploaded',
                value: '{0} Dateien wurden erfolgreich importiert und mit der Ressource {1} verknüpft.'
            }),
            level: 'success',
            params: [],
            hidden: false
        };
        this.msgs[M.RESOURCES_WARNING_PROJECT_NAME_NOT_SAME] = {
            content: i18n({
                id: 'messages.resources.warning.projectNameNotSame',
                value: 'Die Namen stimmen nicht miteinander überein. Das Projekt wird nicht gelöscht.'
            }),
            level: 'warning',
            params: [],
            hidden: false
        };
        this.msgs[M.RESOURCES_ERROR_TYPE_NOT_FOUND] = {
            content: i18n({
                id: 'messages.resources.error.typeNotFound',
                value: 'Typdefinition für \'[0]\' fehlt in Fields.json.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.RESOURCES_ERROR_NO_PROJECT_NAME] = {
            content: i18n({
                id: 'messages.resources.error.noProjectName',
                value: 'Bitte geben Sie einen Namen für das neue Projekt ein.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.RESOURCES_ERROR_PROJECT_NAME_EXISTS] = {
            content: i18n({
                id: 'messages.resources.error.projectNameExists',
                value: 'Ein Projekt mit dem Namen \'[0]\' existiert bereits.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.RESOURCES_ERROR_PROJECT_NAME_LENGTH] = {
            content: i18n({
                id: 'messages.resources.error.projectNameLength',
                value: 'Der angegebene Projektname ist um [0] Zeichen zu lang.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.RESOURCES_ERROR_PROJECT_NAME_SYMBOLS] = {
            content: i18n({
                id: 'messages.resources.error.projectNameSymbols',
                value: 'Erlaubte Zeichen sind Kleinbuchstaben und Ziffern sowie _ und -.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.RESOURCES_ERROR_ONE_PROJECT_MUST_EXIST] = {
            content: i18n({
                id: 'messages.resources.error.oneProjectMustExist',
                value: 'Das Projekt kann nicht gelöscht werden. Es muss mindestens ein Projekt vorhanden sein.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.UPLOAD_ERROR_UNSUPPORTED_EXTENSIONS] = {
            content: i18n({
                id: 'messages.upload.error.unsupportedExtensions',
                value: 'Diese Auswahl ein oder mehrerer Dateien enthält ungültige Dateiformate ({0}). Die entsprechenden Dateien werden ignoriert.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.UPLOAD_ERROR_FILE_READER] = {
            content: i18n({
                id: 'messages.upload.error.fileReader',
                value: 'Die Datei \'{0}\' konnte nicht vom lokalen Dateisystem gelesen werden.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.UPLOAD_ERROR_DUPLICATE_FILENAME] = {
            content: i18n({
                id: 'messages.upload.error.duplicateFilename',
                value: 'Die Datei \'{0}\' konnte nicht hinzugefügt werden. Eine Ressource mit dem gleichen Dateinamen existiert bereits.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.UPLOAD_ERROR_DUPLICATE_FILENAMES] = {
            content: i18n({
                id: 'messages.upload.error.duplicateFilenames',
                value: 'Die folgenden Dateien konnten nicht hinzugefügt werden, da Ressourcen mit identischen Dateinamen bereits existieren: {0}'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.UPLOAD_ERROR_FILE_TYPES_MIXED] = {
            content: i18n({
                id: 'messages.upload.error.fileTypesMixed',
                value: 'Die von Ihnen gewählten Dateien gehören unterschiedlichen Medientypen an. Bitte fügen Sie in einem Uploadschritt nur Dateien eines einzigen Medientyps (Bild oder 3D-Modell) hinzu.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.MODEL_3D_STORE_ERROR_WRITE] = {
            content: i18n({
                id: 'messages.model3DStore.error.write',
                value: 'Es können keine Dateien im 3D-Modell-Verzeichnis gespeichert werden. Bitte geben Sie einen gültigen Verzeichnispfad in den Einstellungen an.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
    }
}
import {isnt, on} from 'tsfun';
import {Document, FindResult, NewDocument, Query} from 'idai-components-2';
import {ValidationErrors} from './validation-errors';
import {Validations} from './validations';
import {ProjectConfiguration} from '../configuration/project-configuration';
import {HierarchicalRelations} from './relation-constants';
import RECORDED_IN = HierarchicalRelations.RECORDEDIN;
import {ProjectCategories} from '../configuration/project-categories';


/**
 * Validates against data model of ProjectConfiguration and ProjectCategories and contents of Database
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class Validator {

    constructor(protected projectConfiguration: ProjectConfiguration,
                protected find: (query: Query) => Promise<FindResult>,
                protected projectCategories: ProjectCategories) {}


    /**
     * @throws [NO_ISRECORDEDIN_TARGET]
     */
    public async assertIsRecordedInTargetsExist(document: Document|NewDocument): Promise<void> {

        if (document.resource.relations[RECORDED_IN] && document.resource.relations[RECORDED_IN].length > 0) {
            const invalidRelationTargets = await this.validateRelationTargets(document as Document, RECORDED_IN);
            if (invalidRelationTargets) {
                throw [
                    ValidationErrors.NO_ISRECORDEDIN_TARGET,
                    invalidRelationTargets.join(', ')
                ];
            }
        }
    }


    /**
     * @throws [IDENTIFIER_ALREADY_EXISTS]
     */
    public async assertIdentifierIsUnique(document: Document|NewDocument): Promise<void> {

        if (!document.resource.identifier) return;

        let result;

        try {
            result = await this.find({
                constraints: { 'identifier:match': document.resource.identifier }
            });
        } catch (e) {
            throw ([ValidationErrors.GENERIC_DATASTORE]);
        }

        if (result.totalCount > 0 && on('resource.id', isnt(result.documents[0].resource.id))(document)) {
            throw[ValidationErrors.IDENTIFIER_ALREADY_EXISTS, document.resource.identifier];
        }
    }


    async isExistingRelationTarget(targetId: string): Promise<boolean> {

        return (await this.find({ constraints: { 'id:match': targetId } })).documents.length === 1;
    }


    /**
     * @throws [NO_ISRECORDEDIN]
     */
    public assertHasIsRecordedIn(document: Document|NewDocument) {

        if (this.isExpectedToHaveIsRecordedInRelation(document)
            && !Document.hasRelations(document as Document, RECORDED_IN)) {

            throw [ValidationErrors.NO_ISRECORDEDIN];
        }
    }


    public assertGeometryIsValid(document: Document) {

        if (document.resource.geometry) {
            const errWithParam: string[]|null
                = Validations.validateStructureOfGeometries(document.resource.geometry);
            if (errWithParam) throw(errWithParam);
        }
    }


    protected isExpectedToHaveIsRecordedInRelation(document: Document|NewDocument): boolean {

        return this.projectCategories
            .getRegularCategoryNames()
            .includes(document.resource.category);
    }


    private async validateRelationTargets(document: Document,
                                          relationName: string): Promise<string[]|undefined> {

        if (!Document.hasRelations(document, relationName)) return [];

        const invalidRelationTargetIds: string[] = [];

        for (let targetId of document.resource.relations[relationName]) {
            if (!(await this.isExistingRelationTarget(targetId))) invalidRelationTargetIds.push(targetId);
        }

        return invalidRelationTargetIds.length > 0 ? invalidRelationTargetIds : undefined;
    }
}
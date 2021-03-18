import {Component} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {Pair, Mapping, to, isNot, undefinedOrEmpty, left, on, includedIn, right, map, flow, empty, prune,
    is} from 'tsfun';
import {FieldDocument, FieldResource, Resource, Document} from 'idai-components-2';
import {FieldReadDatastore} from '../../../../../core/datastore/field/field-read-datastore';
import {TypeImagesUtil} from '../../../../../core/util/type-images-util';
import {TypeRelations} from '../../../../../core/model/relation-constants';
import {ProjectConfiguration} from '../../../../../core/configuration/project-configuration';
import {Category} from '../../../../../core/configuration/model/category';
import {ValuelistDefinition} from '../../../../../core/configuration/model/valuelist-definition';
import {Group} from '../../../../../core/configuration/model/group';
import {FieldDefinition} from '../../../../../core/configuration/model/field-definition';
import {ValuelistUtil} from '../../../../../core/util/valuelist-util';
import {ImageRowItem} from '../../../../../core/images/row/image-row';
import {FindResult} from '../../../../../core/datastore/model/read-datastore';
import {Query} from '../../../../../core/datastore/model/query';
import {Constraint} from '../../../../../core/datastore/model/constraint';
import {ImageReadDatastore} from '../../../../../core/datastore/field/image-read-datastore';
import {onName} from '../../../../../core/util/named';


const CRITERION = 'criterion';
const TYPECATALOG = 'TypeCatalog';
const TYPE = 'Type';

const DOCUMENT_LIMIT: number = 5;


type Criterion = {
    name: string;
    label: string;
}


@Component({
    selector: 'type-relation-picker',
    templateUrl: './type-relation-picker.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    }
})
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class TypeRelationPickerComponent {

    public selectedCatalog: FieldResource|undefined;
    public availableCatalogs: Array<FieldResource> = [];
    public selectedCriterion: string = '';
    public availableCriteria: Array<Criterion> = [];

    public typeDocumentsWithLinkedImages: Array<Pair<FieldDocument, Array<ImageRowItem>>> = [];
    public typeDocument = left;
    public images = right;

    public currentOffset: number = 0;
    public totalDocumentCount: number = 0;

    private resource: Resource|undefined = undefined;
    private q: string = '';
    private timeoutRef: any;


    constructor(public activeModal: NgbActiveModal,
                private fieldDatastore: FieldReadDatastore,
                private imageDatastore: ImageReadDatastore,
                projectConfiguration: ProjectConfiguration) {

        this.initialize(projectConfiguration.getCategory(TYPECATALOG));
    }


    public getCurrentPage = () => this.currentOffset ? (this.currentOffset / DOCUMENT_LIMIT) + 1 : 1;

    public getPageCount = () => this.totalDocumentCount ? Math.ceil(this.totalDocumentCount / DOCUMENT_LIMIT) : 1;

    public canTurnPage = () => (this.currentOffset + DOCUMENT_LIMIT) < this.totalDocumentCount;

    public canTurnPageBack = () => this.currentOffset > 0;


    public onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') this.activeModal.close();
    }


    public async setResource(resource: Resource) {

        this.resource = resource;
        this.currentOffset = 0;
        await this.fetchTypes();
    }


    public async onSelectCatalog() {

        this.currentOffset = 0;
        await this.fetchTypes();
    }


    public async onSelectCriterion() {

        await this.fetchCatalogs();
        this.selectedCatalog = undefined;
        this.currentOffset = 0;
        await this.fetchTypes();
    }


    public setQueryString(q: string) {

        this.q = q;
        if (this.timeoutRef) clearTimeout(this.timeoutRef);
        this.timeoutRef = setTimeout(() => {
            this.currentOffset = 0;
            this.fetchTypes();
        }, 200);
    }


    public async turnPage() {

        if (!this.canTurnPage()) return;

        this.currentOffset += DOCUMENT_LIMIT;
        await this.fetchTypes();
    }


    public async turnPageBack() {

        if (!this.canTurnPageBack()) return;

        this.currentOffset -= DOCUMENT_LIMIT;
        await this.fetchTypes();
    }


    private async initialize(typeCatalogCategory: Category) {

        const usedCriteria = await this.getUsedCatalogCriteria();

        this.availableCriteria = TypeRelationPickerComponent.getConfiguredCriteria(typeCatalogCategory)
            .filter(on('name', includedIn(usedCriteria)));

        this.fetchCatalogs();
    }


    private async getUsedCatalogCriteria(): Promise<string[]> {

        return flow(
            await this.fieldDatastore.find({ categories: [TYPECATALOG] }),
            to(FindResult.DOCUMENTS),
            map(to(Document.RESOURCE)),
            map(to(CRITERION)),
            prune as any
        );
    }


    private async fetchCatalogs() {

        const query: Query = {
            categories: [TYPECATALOG],
            constraints: {}
        };
        if (this.selectedCriterion) query.constraints = { 'criterion:match': this.selectedCriterion };

        this.availableCatalogs = flow(
            await this.fieldDatastore.find(query),
            to(FindResult.DOCUMENTS),
            map(to(Document.RESOURCE))
        );
    }


    private async fetchTypes() {

        if (!this.resource) return;

        const query = TypeRelationPickerComponent.constructQuery(
            this.resource,
            this.q,
            this.selectedCatalog
                ? [this.selectedCatalog]
                : this.availableCatalogs,
            this.currentOffset
        );

        const result: FindResult = await this.fieldDatastore.find(query);
        this.totalDocumentCount = result.totalCount;
        this.typeDocumentsWithLinkedImages = this.pairWithLinkedImages(result.documents);
    }


    private pairWithLinkedImages: Mapping
        = (documents: Array<FieldDocument>) => map((document: FieldDocument) => {
            return [
                document,
                TypeImagesUtil.getLinkedImageIds(document, this.fieldDatastore, this.imageDatastore)
                    .map(id => ({ imageId: id }))
            ] as Pair<FieldDocument, Array<ImageRowItem>>;
        })(documents);


    private static constructQuery(resource: Resource, q: string, selectedCatalogs: Array<FieldResource>,
                                  offset: number) {

        const query: Query = {
            q: q,
            categories: [TYPE],
            limit: DOCUMENT_LIMIT,
            offset: offset,
            sort: {
                matchCategory: resource.category,
                mode: Query.SORT_MODE_EXACTMATCHFIRST,
            },
            constraints: {}
        };
        if (isNot(undefinedOrEmpty)(resource.relations[TypeRelations.INSTANCEOF])) {
            (query.constraints as any)['id:match'] = {
                value: resource.relations[TypeRelations.INSTANCEOF],
                subtract: true
            };
        }
        if (isNot(empty)(selectedCatalogs)) {
            (query.constraints as any)['liesWithin:contain'] = {
                value: selectedCatalogs.map(to(Resource.ID)),
                searchRecursively: true
            } as Constraint;
        }

        return query;
    }


    private static getConfiguredCriteria(typeCatalogCategory: Category): Array<Criterion> {

        const identificationGroup: Group = typeCatalogCategory.groups
            .find(onName(is('identification'))) as Group;

        const criterionField: FieldDefinition = identificationGroup.fields
            .find(onName(is('criterion'))) as FieldDefinition;

        const valuelist: ValuelistDefinition = (criterionField.valuelist as ValuelistDefinition);

        return ValuelistUtil.getOrderedValues(valuelist).map((valueName: string) => {
            return {
                name: valueName,
                label: ValuelistUtil.getValueLabel(valuelist, valueName)
            }
        });
    }
}

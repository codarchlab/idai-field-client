import {Component, Input, OnChanges} from '@angular/core';
import {FieldDocument} from 'idai-components-2';
import {AngularUtility} from '../../../../angular/angular-utility';
import {Loading} from '../../../widgets/loading';
import {FieldReadDatastore} from '../../../../core/datastore/field/field-read-datastore';
import {ViewFacade} from '../../../../core/resources/view/view-facade';
import {ResourcesComponent} from '../../resources.component';


@Component({
    selector: 'children-view',
    templateUrl: './children-view.html'
})
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class ChildrenViewComponent implements OnChanges {

    @Input() document: FieldDocument;

    public children: Array<FieldDocument> = [];
    public childrenCount: number = 0;


    constructor(private viewFacade: ViewFacade,
                private loading: Loading,
                private datastore: FieldReadDatastore,
                private resourcesComponent: ResourcesComponent) {}


    public isScrollbarVisible = (element: HTMLElement) => element.scrollHeight > element.clientHeight;

    public closePopover = () => this.resourcesComponent.closePopover();


    async ngOnChanges() {

        await this.updateChildren(this.document);
    }


    public async openChildCollection(documentToSelect?: FieldDocument) {

        this.resourcesComponent.closePopover();

        if (documentToSelect) {
            await this.viewFacade.setSelectedDocument(documentToSelect.resource.id);
        } else {
            await this.viewFacade.moveInto(this.viewFacade.getSelectedDocument(), true);
        }
    }


    private async updateChildren(document: FieldDocument) {

        this.children = [];
        this.childrenCount = document.resource.id ? this.viewFacade.getChildrenCount(document) : 0;

        if (this.childrenCount === 0) {
            this.children = [];
            return;
        }

        this.loading.start('sidebar-children');
        await AngularUtility.refresh();

        this.children = await this.getChildren(document);

        this.loading.stop('sidebar-children');
    }


    private async getChildren(document: FieldDocument): Promise<Array<FieldDocument>> {

        if (!document) return [];

        return (await this.datastore.find({constraints: {
                'liesWithin:contain' : document.resource.id
            }}, true)).documents;
    }
}

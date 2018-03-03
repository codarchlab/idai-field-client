import {Injectable} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Location} from '@angular/common';
import {Observable} from 'rxjs/Observable';
import {Observer} from 'rxjs/Observer';
import {Document} from 'idai-components-2/core';
import {ProjectConfiguration, RelationDefinition} from 'idai-components-2/configuration';
import {TypeUtility} from '../common/type-utility';
import {ViewFacade} from './resources/view/view-facade';
import {DocumentReadDatastore} from '../core/datastore/document-read-datastore';


@Injectable()
/**
 * Centralizes access to the Router.
 * Has knowledge about how to route into as well as route within
 * bigger components like ResourcesComponent (via ViewFacade).
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */
export class RoutingService {

    private currentRoute: any;


    constructor(private router: Router,
                private viewFacade: ViewFacade,
                private location: Location,
                private imageTypeUtility: TypeUtility,
                private projectConfiguration: ProjectConfiguration,
                private datastore: DocumentReadDatastore
    ) {
    }


    // For ResourcesComponent
    public routeParams(route: ActivatedRoute) {

        return Observable.create((observer: Observer<any>) => {
            this.setRoute(route, observer);
        });
    }


    // Currently used from SidebarListComponent
    public async jumpToMainTypeHomeView(document: Document) {

        const viewName = this.viewFacade.getMainTypeHomeViewName(document.resource.type);
        if (viewName == this.viewFacade.getCurrentViewName()) return;

        await this.router.navigate(['resources', viewName, document.resource.id]);
        this.viewFacade.selectMainTypeDocument(document);
    }


    // Currently used from DocumentViewSidebar and ImageViewComponent
    public jumpToRelationTarget(documentToSelect: Document, tab?: string,
                                comingFromOutsideOverviewComponent: boolean = false) {

        if (comingFromOutsideOverviewComponent) this.currentRoute = undefined; // TODO see also comment below. it feels actually a bit unfortunate have this kind of state (this.currentRoute) here at all at all.

        // TODO we really have two separate public methods instead of this check
        if (this.imageTypeUtility.isImageType(documentToSelect.resource.type)) {
            this.jumpToImageTypeRelationTarget(documentToSelect);
        } else if (documentToSelect.resource.type == 'Object3D') {
            this.jumpTo3DTypeRelationTarget(documentToSelect);
        } else {
            this.jumpToResourceTypeRelationTarget(
                documentToSelect, tab, comingFromOutsideOverviewComponent);
        }
    }


    public jumpToConflictResolver(document: Document) {

        if (this.imageTypeUtility.isImageType(document.resource.type)) {
            return this.router.navigate(['images', document.resource.id, 'edit', 'conflicts']);
        } else {
            this.getMainTypeNameForDocument(document).then(mainTypeName =>
                this.viewFacade.getMainTypeHomeViewName(mainTypeName)
            ).then(viewName => {
                this.router.navigate(['resources', viewName, document.resource.id, 'edit', 'conflicts']);
            });
        }
    }


    public getMainTypeNameForDocument(document: Document): Promise<string> {

        const relations = document.resource.relations['isRecordedIn'];
        return (relations && relations.length > 0) ?
            this.datastore.get(relations[0]).then(mainTypeDocument => mainTypeDocument.resource.type) :
            RoutingService.handleNoRelationdInGetMainTypeNameForDocument(
                this.projectConfiguration.getRelationDefinitions(document.resource.type));
    }


    private jumpToImageTypeRelationTarget(documentToSelect: Document) {

        const selectedDocument = this.viewFacade.getSelectedDocument();
        if (selectedDocument) {
            if (this.currentRoute && selectedDocument.resource && selectedDocument.resource.id) {
                this.currentRoute += '/' + selectedDocument.resource.id + '/show/images';
            }
        }

        this.router.navigate(
            ['images', documentToSelect.resource.id, 'show', 'relations'],
            { queryParams: { from: this.currentRoute } }
        );
    }


    private async jumpTo3DTypeRelationTarget(documentToSelect: Document) {

        const selectedDocument = this.viewFacade.getSelectedDocument();
        if (selectedDocument) {
            if (this.currentRoute && selectedDocument.resource && selectedDocument.resource.id) {
                this.currentRoute += '/' + selectedDocument.resource.id + '/show/3d';
            }
        }

        await this.router.navigate(
            ['3d', documentToSelect.resource.id, 'show', 'relations'],
            { queryParams: { from: this.currentRoute } }
        );
    }


    private async jumpToResourceTypeRelationTarget(documentToSelect: Document, tab?: string,
                                                   comingFromOutsideOverviewComponent: boolean = false) {

        const viewName = await this.viewFacade.getMainTypeHomeViewName(
            await this.getMainTypeNameForDocument(documentToSelect));

        if (comingFromOutsideOverviewComponent ||
            viewName != this.viewFacade.getCurrentViewName()) {

            if (tab) {
                return this.router.navigate(['resources', viewName,
                    documentToSelect.resource.id, 'view', tab]);
            } else {
                return this.router.navigate(['resources', viewName,
                    documentToSelect.resource.id]);
            }
        } else {

            this.viewFacade.setSelectedDocument(documentToSelect)
        }
    }


    // For ResourcesComponent
    private setRoute(route: ActivatedRoute, observer: Observer<any>) { // we need a setter because the route must come from the componenent it is bound to

        route.params.subscribe(async (params) => {

            this.currentRoute = undefined;
            if (params['view']) this.currentRoute = 'resources/' + params['view'];

            this.location.replaceState('resources/' + params['view']);

            try {
                await this.viewFacade.setupView(params['view'], params['id']);
                observer.next(params);
            } catch (msgWithParams) {
                if (msgWithParams) console.error(
                    'got msgWithParams in GeneralRoutingService#setRoute: ', msgWithParams);
            }
        });
    }


    private static async handleNoRelationdInGetMainTypeNameForDocument(
        relationDefinitions: Array<RelationDefinition>|undefined) {

        try {
            let mainTypeName: string = '';

            if (relationDefinitions) {
                
                for (let relationDefinition of relationDefinitions) {
                    if (relationDefinition.name == 'isRecordedIn') {
                        mainTypeName = relationDefinition.range[0];
                        break;
                    }
                }
            }
            return Promise.resolve(mainTypeName);

        } catch (e) {}
    }
}
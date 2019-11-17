import {Injectable} from '@angular/core';
import {Observable, Observer} from 'rxjs';
import {FieldDocument, Document} from 'idai-components-2';
import {RoutingService} from '../../routing-service';
import {ViewFacade} from '../view/view-facade';
import {ObserverUtil} from '../../../core/util/observer-util';
import {TypeUtility} from '../../../core/model/type-utility';
import {ProjectConfiguration} from '../../../core/configuration/project-configuration';
import {RelationDefinition} from '../../../core/configuration/model/relation-definition';
import {IdaiType} from '../../../core/configuration/model/idai-type';


@Injectable()
/**
 * This serves to centralize the behaviour of navigation buttons of both the sidebar as well as the
 * full scale list.
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class NavigationService {

    private moveIntoObservers: Array<Observer<any>> = [];

    constructor(private projectConfiguration: ProjectConfiguration,
                private routingService: RoutingService,
                private viewFacade: ViewFacade,
                private typeUtility: TypeUtility) {
    }


    public moveIntoNotifications = (): Observable<Array<Document>> =>
        ObserverUtil.register(this.moveIntoObservers);


    public async jumpToView(document: FieldDocument) {

        await this.routingService.jumpToOperationView(document);
    }


    public shouldShowArrowTopRight(document: FieldDocument) {

        return this.showJumpToViewOption(document);
    }


    public async moveInto(document: FieldDocument|undefined) {

        await this.viewFacade.moveInto(document);
        ObserverUtil.notify(this.moveIntoObservers, undefined);
    }


    public async jumpToResourceInSameView(document: FieldDocument) { // arrow up

        await this.viewFacade.setBypassHierarchy(false);
        await this.routingService.jumpToResource(document);
    }


    public async jumpToResourceFromOverviewToOperation(document: FieldDocument) { // arrow top right, when in search

        await this.routingService.jumpToResource(document);
        await this.viewFacade.setBypassHierarchy(false);
        await this.routingService.jumpToResource(document);
    }


    public shouldShowArrowBottomRight(document: FieldDocument): boolean {

        if (!document.resource.id) return false; // do not show as long as it is not saved
        if (this.viewFacade.getBypassHierarchy()) return false;

        return ((this.projectConfiguration
            .getRelationDefinitions(document.resource.type, true) as any)
            .map((_: RelationDefinition) => _.name)
            .indexOf('liesWithin') !== -1);
    }


    public shouldShowArrowTopRightForSearchMode(document: FieldDocument) {

        return (this.viewFacade.isInOverview() && this.viewFacade.getBypassHierarchy()
            && (!this.typeUtility.isSubtype(document.resource.type, 'Operation') && document.resource.type !== 'Place'));
    }


    public shouldShowArrowUpForSearchMode(document: FieldDocument) {

        return (!this.viewFacade.isInOverview() && this.viewFacade.getBypassHierarchy())
            || (this.viewFacade.isInOverview() && this.viewFacade.getBypassHierarchy()
                && (this.typeUtility.isSubtype(document.resource.type, 'Operation') || document.resource.type === 'Place'))
    }


    private showJumpToViewOption(document: FieldDocument): boolean {

        if (!document.resource.id) return false; // do not show as long as it is not saved
        if (this.viewFacade.getBypassHierarchy()) return false;

        const operationType: IdaiType|undefined = this.projectConfiguration.getTypesMap()['Operation'];

        return operationType !== undefined && operationType.children !== undefined
            && operationType.children
                .map((type: IdaiType) => type.name)
                .includes(document.resource.type);
    }
}

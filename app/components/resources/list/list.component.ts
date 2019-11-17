import {Component, Input} from '@angular/core';
import {FieldDocument} from 'idai-components-2';
import {ResourcesComponent} from '../resources.component';
import {Loading} from '../../../widgets/loading';
import {ViewFacade} from '../view/view-facade';
import {BaseList} from '../base-list';
import {ProjectConfiguration} from '../../../core/configuration/project-configuration';
import {IdaiType} from '../../../core/configuration/model/idai-type';


@Component({
    selector: 'list',
    moduleId: module.id,
    templateUrl: './list.html'
})
/**
 * @author Fabian Z.
 * @author Thomas Kleinke
 * @author Philipp Gerth
 */
export class ListComponent extends BaseList {

    @Input() documents: Array<FieldDocument>;

    public typesMap: { [type: string]: IdaiType };


    constructor(
        resourcesComponent: ResourcesComponent,
        viewFacade: ViewFacade,
        loading: Loading,
        projectConfiguration: ProjectConfiguration
    ) {
        super(resourcesComponent, viewFacade, loading);
        this.typesMap = projectConfiguration.getTypesMap()
    }


    public async createNewDocument(doc: FieldDocument) {

        this.documents = this.documents
            .filter(_ => _.resource.id)
            .concat([doc]);
    }
}
import {Component} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {intersection, set} from 'tsfun';
import {Document, FieldDocument} from 'idai-components-2';
import {RelationsManager} from '../../core/model/relations-manager';
import {MoveUtility} from '../../core/resources/move-utility';
import {IndexFacade} from '../../core/datastore/index/index-facade';
import {Category} from '../../core/configuration/model/category';
import {ProjectConfiguration} from '../../core/configuration/project-configuration';
import {ViewFacade} from '../../core/resources/view/view-facade';
import {Messages} from '../messages/messages';
import {Constraint} from '../../core/datastore/model/constraint';
import {Loading} from '../widgets/loading';
import {SettingsProvider} from '../../core/settings/settings-provider';


@Component({
    selector: 'move-modal',
    templateUrl: './move-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    }
})
/**
 * @author Thomas Kleinke
 */
export class MoveModalComponent {

    public documents: Array<FieldDocument>;
    public filterOptions: Array<Category> = [];
    public constraints: Promise<{ [name: string]: Constraint }>;
    public showProjectOption: boolean = false;


    constructor(public activeModal: NgbActiveModal,
                private relationsManager: RelationsManager,
                private settingsProvider: SettingsProvider,
                private indexFacade: IndexFacade,
                private messages: Messages,
                private viewFacade: ViewFacade,
                private projectConfiguration: ProjectConfiguration,
                private loading: Loading) {}


    public isLoading = () => this.loading.isLoading('moveModal');


    public getConstraints = () => {

        if (!this.constraints) {
            this.constraints = MoveUtility.createConstraints(this.documents, this.indexFacade);
        }

        return this.constraints;
    };


    public initialize(documents: Array<FieldDocument>) {

        this.documents = documents;
        this.showProjectOption = MoveUtility.isProjectOptionAllowed(documents, this.viewFacade.isInOverview());
        this.filterOptions = MoveUtility.getAllowedTargetCategories(documents, this.projectConfiguration,
            this.viewFacade.isInOverview())
    }


    public onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && !this.isLoading()) this.activeModal.dismiss('cancel');
    }


    public async moveDocuments(newParent: FieldDocument) {

        if (this.isLoading()) return;
        this.loading.start('moveModal');

        for (let document of this.documents) {
            try {
                await MoveUtility.moveDocument(
                    document,
                    newParent,
                    this.relationsManager,
                    MoveUtility.getIsRecordedInTargetCategories(this.documents, this.projectConfiguration)
                );
            } catch (msgWithParams) {
                console.error(msgWithParams);
                this.messages.add(msgWithParams);
            }
        }

        this.loading.stop();
        this.activeModal.close();
    }
}

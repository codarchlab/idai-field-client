import {Component} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {ProjectCategoriesUtility} from '../../../core/configuration/project-categories-utility';
import {Category} from '../../../core/configuration/model/category';


@Component({
    selector: 'link-modal',
    templateUrl: './link-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    }
})
export class LinkModalComponent {

    public filterOptions: Array<Category> = [];


    constructor(public activeModal: NgbActiveModal,
                private projectCategories: ProjectCategoriesUtility) {}


    public onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') this.activeModal.dismiss('cancel');
    }


    public initializeFilterOptions() {

        this.filterOptions = this.projectCategories.getAllowedRelationDomainCategories(
            'isDepictedIn', 'Image'
        );
    }
}

import {Component} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'delete-modal',
    moduleId: module.id,
    templateUrl: './delete-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    }
})

/**
 * @author Thomas Kleinke
 */
export class DeleteModalComponent {

    public numberOfSelectedMediaResources: number;


    constructor(public activeModal: NgbActiveModal) {}


    public onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') this.activeModal.dismiss('cancel');
    }
}
import {Component} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'remove-link-modal',
    template: `
        <div class="modal-body">
            Bei den ausgewählten Medienressourcen werden sämtliche Verknüpfungen zu anderen Ressourcen entfernt.
        </div>
        <div class="modal-footer">
            <button type="button" id="remove-link-confirm" class="btn btn-danger" (click)="activeModal.close('close')">
                Verknüpfungen löschen
            </button>
            <button type="button" id="remove-link-cancel" class="btn btn-secondary" (click)="activeModal.dismiss('cancel')">
                Abbrechen
            </button>
        </div>
    `
})
export class RemoveLinkModalComponent {

    constructor(public activeModal: NgbActiveModal) {}
}
import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {FormsModule} from '@angular/forms';
import {IdaiDocumentsModule} from 'idai-components-2/documents';
import {DoceditComponent} from './docedit.component';
import {RouterModule} from '@angular/router';
import {IdaiWidgetsModule} from 'idai-components-2/widgets';
import {IdaiMessagesModule} from 'idai-components-2/messages';
import {WidgetsModule} from '../../widgets/widgets.module';
import {DoceditMediaTabComponent} from './mediatab/docedit-media-tab.component';
import {DoceditConflictsTabComponent} from './docedit-conflicts-tab.component';
import {ConflictDeletedModalComponent} from './conflict-deleted-modal.component';
import {EditSaveDialogComponent} from './edit-save-dialog.component';
import {TypeSwitcherButtonComponent} from './type-switcher-button.component';
import {MediaResourcePickerComponent} from './mediatab/media-resource-picker.component';
import {ImageGridModule} from "../imagegrid/image-grid.module";

@NgModule({
    imports: [
        BrowserModule,
        NgbModule,
        FormsModule,
        IdaiWidgetsModule,
        IdaiDocumentsModule,
        RouterModule,
        IdaiMessagesModule,
        WidgetsModule,
        ImageGridModule
    ],
    declarations: [
        ConflictDeletedModalComponent,
        DoceditComponent,
        EditSaveDialogComponent,
        DoceditMediaTabComponent,
        DoceditConflictsTabComponent,
        TypeSwitcherButtonComponent,
        MediaResourcePickerComponent
    ],
    exports: [
        EditSaveDialogComponent,
        DoceditComponent
    ],
    entryComponents: [
        DoceditComponent,
        ConflictDeletedModalComponent,
        MediaResourcePickerComponent
    ]
})

export class DoceditModule {}
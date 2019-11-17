import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {WidgetsModule} from '../../widgets/widgets.module';
import {Model3DViewerComponent} from './model-3d-viewer.component';
import {MeshOptionsMenuComponent} from './mesh-options-menu.component';
import {Core3DModule} from '../core-3d/core-3d.module';


@NgModule({
    imports: [
        BrowserModule,
        NgbModule,
        WidgetsModule,
        WidgetsModule,
        Core3DModule
    ],
    declarations: [
        Model3DViewerComponent,
        MeshOptionsMenuComponent
    ],
    exports: [
        Model3DViewerComponent
    ]
})

export class Model3DViewerModule {}
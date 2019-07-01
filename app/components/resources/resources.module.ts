import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule} from '@angular/forms';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {IdaiWidgetsModule, ProjectConfiguration} from 'idai-components-2';
import {ResourcesComponent} from './resources.component';
import {GeometryViewComponent} from './map/list/geometry-view.component';
import {EditableMapComponent} from './map/map/editable-map.component';
import {ResourcesMapComponent} from './map/resources-map.component';
import {ListComponent} from './list/list.component';
import {RowComponent} from './list/row.component';
import {PlusButtonComponent} from './plus-button.component';
import {WidgetsModule} from '../../widgets/widgets.module';
import {DoceditModule} from '../docedit/docedit.module';
import {ThumbnailViewComponent} from './map/list/thumbnail-view.component';
import {ImageGridModule} from '../imagegrid/image-grid.module';
import {RoutingService} from '../routing-service';
import {DoceditLauncher} from './service/docedit-launcher';
import {ViewFacade} from './view/view-facade';
import {SettingsService} from '../../core/settings/settings-service';
import {ImageLayerManager} from './map/map/image-layer-manager';
import {ImageLayerMenuComponent} from './map/map/image-layer-menu.component';
import {Map3DComponent} from './map/map-3d/map-3d.component';
import {PointGeometriesComponent} from './map/map-3d/geometries/point-geometries/point-geometries.component';
import {MeshGeometriesComponent} from './map/map-3d/geometries/mesh-geometries/mesh-geometries.component';
import {Layer3DMenuComponent} from './map/map-3d/layers/layers-3d/layer-3d-menu.component';
import {Layer3DManager} from './map/map-3d/layers/layers-3d/layer-3d-manager';
import {Layers3DComponent} from './map/map-3d/layers/layers-3d/layers-3d.component';
import {Core3DModule} from '../core-3d/core-3d.module';
import {ControlButtonsComponent} from './map/map-3d/control-buttons.component';
import {Layer3DMeshManager} from './map/map-3d/layers/layers-3d/layer-3d-mesh-manager';
import {Layers2DComponent} from './map/map-3d/layers/layers-2d/layers-2d.component';
import {Layer2DMeshManager} from './map/map-3d/layers/layers-2d/layer-2d-mesh-manager';
import {Layer2DMeshBuilder} from './map/map-3d/layers/layers-2d/layer-2d-mesh-builder';
import {SidebarListComponent} from './map/list/sidebar-list.component';
import {FieldDatastore} from '../../core/datastore/field/field-datastore';
import {LayerImageProvider} from './map/map/layer-image-provider';
import {RemoteChangesStream} from '../../core/datastore/core/remote-changes-stream';
import {NavigationComponent} from './navigation/navigation.component';
import {NavigationService} from './navigation/navigation-service';
import {ResourcesSearchBarComponent} from './searchbar/resources-search-bar.component';
import {SearchSuggestionsComponent} from './searchbar/search-suggestions.component';
import {StandardStateSerializer} from '../../common/standard-state-serializer';
import {StateSerializer} from '../../common/state-serializer';
import {Loading} from '../../widgets/loading';
import {ResourcesStateManager} from './view/resources-state-manager';
import {FieldReadDatastore} from '../../core/datastore/field/field-read-datastore';
import {LayerMapComponent} from './map/map/layer-map.component';
import {ResourcesSearchConstraintsComponent} from './searchbar/resources-search-constraints.component';
import {IndexFacade} from '../../core/datastore/index/index-facade';
import {MoveModalComponent} from './move-modal.component';
import {TypeUtility} from '../../core/model/type-utility';
import {ContextMenuComponent} from './map/context-menu.component';
import {ResourceDeletion} from './deletion/resource-deletion';
import {DeletionInProgressModalComponent} from './deletion/deletion-in-progress-modal.component';
import {TabManager} from '../tab-manager';
import {SidebarListButtonGroupComponent} from './map/list/sidebar-list-button-group.component';
import {ThumbnailComponent} from './map/list/thumbnail.component';
import {ChildrenViewComponent} from './map/list/children-view.component';

const remote = require('electron').remote;


@NgModule({
    imports: [
        BrowserModule,
        FormsModule,
        NgbModule,
        WidgetsModule,
        ImageGridModule,
        IdaiWidgetsModule,
        DoceditModule,
        Core3DModule
    ],
    declarations: [
        ResourcesComponent,
        GeometryViewComponent,
        LayerMapComponent,
        EditableMapComponent,
        ResourcesMapComponent,
        ImageLayerMenuComponent,
        ListComponent,
        RowComponent,
        PlusButtonComponent,
        ThumbnailViewComponent,
        SidebarListComponent,
        Map3DComponent,
        Layers2DComponent,
        Layers3DComponent,
        Layer3DMenuComponent,
        PointGeometriesComponent,
        MeshGeometriesComponent,
        ControlButtonsComponent,
        SidebarListButtonGroupComponent,
        NavigationComponent,
        ResourcesSearchBarComponent,
        ResourcesSearchConstraintsComponent,
        SearchSuggestionsComponent,
        ContextMenuComponent,
        MoveModalComponent,
        DeletionInProgressModalComponent,
        ThumbnailComponent,
        ChildrenViewComponent
    ],
    providers: [
        { provide: StateSerializer, useClass: StandardStateSerializer },
        NavigationService,
        RoutingService,
        DoceditLauncher,
        ImageLayerManager,
        Layer3DManager,
        Layer2DMeshManager,
        Layer3DMeshManager,
        LayerImageProvider,
        Layer2DMeshBuilder,
        ResourceDeletion,
        {
            provide: ResourcesStateManager,
            useFactory: (datastore: FieldReadDatastore,
                         indexFacade: IndexFacade,
                         stateSerializer: StateSerializer,
                         projectConfiguration: ProjectConfiguration,
                         settingsService: SettingsService,
                         typeUtility: TypeUtility,
                         tabManager: TabManager) => {

                const projectName = settingsService.getSelectedProject();
                if (!projectName) throw 'project not set';

                return new ResourcesStateManager(
                    datastore,
                    indexFacade,
                    stateSerializer,
                    typeUtility,
                    tabManager,
                    projectName,
                    remote.getGlobal('switches').suppress_map_load_for_test
                );
            },
            deps: [
                FieldReadDatastore, IndexFacade, StateSerializer, ProjectConfiguration, SettingsService,
                TypeUtility, TabManager
            ]
        },
        {
            provide: ViewFacade,
            useFactory: function(
                projectConfiguration: ProjectConfiguration,
                datastore: FieldDatastore,
                changesStream: RemoteChangesStream,
                resourcesStateManager: ResourcesStateManager,
                loading: Loading,
                indexFacade: IndexFacade
            ) {
                return new ViewFacade(
                    projectConfiguration,
                    datastore,
                    changesStream,
                    resourcesStateManager,
                    loading,
                    indexFacade
                );
            },
            deps: [
                ProjectConfiguration,
                FieldDatastore,
                RemoteChangesStream,
                ResourcesStateManager,
                Loading,
                IndexFacade
            ]
        }
    ],
    exports: [
        GeometryViewComponent
    ],
    entryComponents: [
        MoveModalComponent,
        DeletionInProgressModalComponent
    ]
})

export class ResourcesModule {}
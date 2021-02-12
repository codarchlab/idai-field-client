import {ChangeDetectorRef, Component, Input, NgZone, SimpleChanges} from '@angular/core';
import L from 'leaflet';
import {flatten} from 'tsfun';
import {ImageDocument, ImageGeoreference} from 'idai-components-2';
import {LayerGroup, LayerManager, ListDiffResult} from './layers/layer-manager';
import {LayerImageProvider} from './layers/layer-image-provider';
import {ProjectConfiguration} from '../../../../core/configuration/project-configuration';
import {MapComponent} from './map.component';
import {ImageContainer} from '../../../../core/images/imagestore/image-container';
import {Messages} from '../../../messages/messages';
import {SettingsProvider} from '../../../../core/settings/settings-provider';


const fs = typeof window !== 'undefined'
  ? window.require('fs')
  : require('fs');


@Component({
    selector: 'layer-map',
    templateUrl: './layer-map.html'
})
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class LayerMapComponent extends MapComponent {

    @Input() viewName: string;

    public layerGroups: Array<LayerGroup> = [];

    private panes: { [resourceId: string]: any } = {};
    private imageOverlays: { [resourceId: string]: L.ImageOverlay } = {};
    private layersUpdate: boolean = true;

    private tileLayer: L.TileLayer;


    constructor(projectConfiguration: ProjectConfiguration,
                private layerManager: LayerManager,
                private layerImageProvider: LayerImageProvider,
                protected messages: Messages,
                private settingsProvider: SettingsProvider,
                protected zone: NgZone,
                protected changeDetectorRef: ChangeDetectorRef) {

        super(projectConfiguration, zone);

        this.layerManager.reset();
    }


    async ngOnChanges(changes: SimpleChanges) {

        if (LayerMapComponent.isLayersUpdateNecessary(changes)) this.layersUpdate = true;

        await super.ngOnChanges(changes);
    }


    public async updateLayers(): Promise<void> {

        this.layerImageProvider.reset();

        const { layerGroups, activeLayersChange } = await this.layerManager.initializeLayers();

        this.layerGroups = layerGroups;
        this.initializePanes();
        this.updatePaneZIndices();
        this.handleActiveLayersChange(activeLayersChange);

        this.changeDetectorRef.detectChanges();
    }


    public async toggleLayer(layer: ImageDocument) {

        this.layerManager.toggleLayer(layer.resource.id as any);

        await this.zone.runOutsideAngular(async () => {
            if (this.layerManager.isActiveLayer(layer.resource.id as any)) {
                await this.addLayerToMap(layer.resource.id as any);
            } else {
                this.removeLayerFromMap(layer.resource.id as any);
            }
        });
    }


    public focusLayer(layer: ImageDocument) {

        this.zone.runOutsideAngular(() => {
            const georeference = layer.resource.georeference;
            const bounds = [] as any;

            bounds.push(L.latLng((georeference as any).topLeftCoordinates) as never);
            bounds.push(L.latLng((georeference as any).topRightCoordinates) as never);
            bounds.push(L.latLng((georeference as any).bottomLeftCoordinates) as never);

            this.map.fitBounds(bounds);
        });
    }


    public updatePaneZIndices() {

        this.getLayers().reverse().forEach((layer, index) => {
            this.panes[layer.resource.id].style.zIndex = String(index);
        })
    };


    /**
     * Called by MapComponent.ngOnChange
     */
    protected async updateMap(changes: SimpleChanges): Promise<any> {

        if (!this.update) return Promise.resolve();

        await super.updateMap(changes);

        if (this.settingsProvider.getSettings().selectedProject
            .toLowerCase()
            .startsWith('sudan-heritage')) {

            this.updateSudanTileLayer();
        }

        if (this.layersUpdate) {
            this.layersUpdate = false;
            return this.updateLayers();
        }
    }


    private handleActiveLayersChange(change: ListDiffResult) {

        change.removed.forEach(layerId => this.removeLayerFromMap(layerId));
        change.added.forEach(layerId => this.addLayerToMap(layerId));
    }


    private initializePanes() {

        this.getLayers().filter(layer => !this.panes[layer.resource.id as any])
            .forEach(layer => this.createPane(layer));
    }


    private createPane(layer: any) {

        const pane = this.map.createPane(layer.resource.id);
        this.panes[layer.resource.id] = pane;
    }


    private async addLayerToMap(resourceId: string) {

        const layerDocument: ImageDocument|undefined
            = this.getLayers().find(layer => layer.resource.id === resourceId);
        if (!layerDocument) return;

        const imageContainer: ImageContainer = await this.layerImageProvider.getImageContainer(resourceId);

        const georeference = layerDocument.resource.georeference as ImageGeoreference;
        this.imageOverlays[resourceId] = L.imageOverlay(
            imageContainer.imgSrc ? imageContainer.imgSrc : imageContainer.thumbSrc as any,
            [georeference.topLeftCoordinates,
            georeference.topRightCoordinates,
            georeference.bottomLeftCoordinates],
            { pane: layerDocument.resource.id }).addTo(this.map);
    }


    private removeLayerFromMap(resourceId: string) {

        const imageOverlay = this.imageOverlays[resourceId];
        if (!imageOverlay) {
            console.warn('Failed to remove image ' + resourceId + ' from map. Image overlay not found.');
            return;
        }

        this.map.removeLayer(imageOverlay);
    }


    private getLayers(): Array<ImageDocument> {

        return flatten(
            this.layerGroups.map(layerGroup => layerGroup.layers)
        );
    }


    private updateSudanTileLayer() {

        if (!this.tileLayer) {
            const tilesPath: string = this.settingsProvider.getSettings().imagestorePath + ''
                + this.settingsProvider.getSettings().selectedProject + '/tiles/Sudan';
            if (!fs.existsSync(tilesPath)) return;

            const southWest = L.latLng(3.2, 21.7);
            const northEast = L.latLng(22.1, 39.2);
            const bounds = L.latLngBounds(southWest, northEast);
            this.tileLayer = L.tileLayer(tilesPath + '/{z}/{x}/{y}.png', {
                bounds: bounds,
                minNativeZoom: 5,
                minZoom: 2,
                maxNativeZoom: 14,
                maxZoom: 30
            });
            this.tileLayer.addTo(this.map);
            this.map.setMinZoom(2);
        }
    }


    /**
     * Makes sure that layers are updated only once after switching to another view or main name document.
     * Triggering the update method more than once can lead to errors caused by resetting the layer image
     * provider while the images are still loading.
     */
    private static isLayersUpdateNecessary(changes: SimpleChanges): boolean {

        // Update layers after switching operation.
        // Update layers after switching to another view with an existing operation or coming from
        // a view with an existing operation.
        if (changes['viewName']
            && (changes['viewName'].currentValue || changes['viewName'].previousValue)) {
            return true;
        }

        // Update layers after switching from a view without operations to another view without
        // operations.
        return changes['documents']
            && changes['documents'].currentValue
            && changes['documents'].currentValue.length === 0;
    }
}

import * as fs from 'fs';
import {Component, Input, SimpleChanges} from '@angular/core';
import {Messages, ImageDocument, ImageGeoreference} from 'idai-components-2';
import {ImageContainer} from '../../../../core/imagestore/image-container';
import {ImageLayerManager} from './image-layer-manager';
import {ListDiffResult} from '../layer-manager';
import {LayerImageProvider} from './layer-image-provider';
import {SettingsService} from '../../../../core/settings/settings-service';
import {ProjectConfiguration} from '../../../../core/configuration/project-configuration';
import {MapComponent} from './map.component';


@Component({
    moduleId: module.id,
    selector: 'layer-map',
    templateUrl: './layer-map.html'
})
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class LayerMapComponent extends MapComponent {

    @Input() viewName: string;

    public layers: Array<ImageDocument> = [];

    private panes: { [resourceId: string]: any } = {};
    private imageOverlays: { [resourceId: string]: L.ImageOverlay } = {};
    private layersUpdate: boolean = true;

    private tileLayer: L.TileLayer;


    constructor(private layerManager: ImageLayerManager,
                private layerImageProvider: LayerImageProvider,
                protected messages: Messages,
                projectConfiguration: ProjectConfiguration,
                private settingsService: SettingsService) {

        super(projectConfiguration);

        this.layerManager.reset();
    }


    async ngOnChanges(changes: SimpleChanges) {

        if (LayerMapComponent.isLayersUpdateNecessary(changes)) this.layersUpdate = true;

        await super.ngOnChanges(changes);
    }


    public async toggleLayer(layer: ImageDocument) {

        this.layerManager.toggleLayer(layer.resource.id as any);

        if (this.layerManager.isActiveLayer(layer.resource.id as any)) {
            await this.addLayerToMap(layer.resource.id as any);
        } else {
            this.removeLayerFromMap(layer.resource.id as any);
        }
    }


    public focusLayer(layer: ImageDocument) {

        const georeference = layer.resource.georeference;
        const bounds = [] as any;

        bounds.push(L.latLng((georeference as any).topLeftCoordinates) as never);
        bounds.push(L.latLng((georeference as any).topRightCoordinates) as never);
        bounds.push(L.latLng((georeference as any).bottomLeftCoordinates) as never);

        this.map.fitBounds(bounds);
    }


    /**
     * Called by MapComponent.ngOnChange
     */
    protected async updateMap(changes: SimpleChanges): Promise<any> {

        if (!this.update) return Promise.resolve();

        await super.updateMap(changes);

        if (this.settingsService.getSelectedProject().toLowerCase().startsWith('sudan-heritage')) {
            this.updateSudanTileLayer();
        }

        if (this.layersUpdate) {
            this.layersUpdate = false;
            return this.updateLayers();
        }
    }


    private async updateLayers(): Promise<any> {

        this.layerImageProvider.reset();

        const { layers, activeLayersChange } = await this.layerManager.initializeLayers();

        this.layers = layers;
        this.initializePanes();
        this.handleActiveLayersChange(activeLayersChange);
    }


    private handleActiveLayersChange(change: ListDiffResult) {

        change.removed.forEach(layerId => this.removeLayerFromMap(layerId));
        change.added.forEach(layerId => this.addLayerToMap(layerId));
    }


    private initializePanes() {

        this.layers
            .filter(layer => !this.panes[layer.resource.id as any])
            .reduce((zIndex, layer) => this.createPane(zIndex, layer), 1);
    }


    private createPane(zIndex: any, layer: any) {

        const pane = this.map.createPane(layer.resource.id);
        pane.style.zIndex = String(zIndex);
        this.panes[layer.resource.id] = pane;
        return zIndex + 1;
    }


    private async addLayerToMap(resourceId: string) {

        const layerDocument: ImageDocument|undefined
            = this.layers.find(layer => layer.resource.id === resourceId);
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


    private updateSudanTileLayer() {

        if (!this.tileLayer) {
            const tilesPath: string = this.settingsService.getSettings().imagestorePath + ''
                + this.settingsService.getSelectedProject() + '/tiles/Sudan';
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
     * Makes sure that layers are updated only once after switching to another view or main type document.
     * Triggering the update method more than once can lead to errors caused by resetting the layer image
     * provider while the images are still loading.
     */
    private static isLayersUpdateNecessary(changes: SimpleChanges): boolean {

        // Update layers after switching main type document.
        // Update layers after switching to another view with an existing main type document or coming from
        // a view with an existing main type document.
        if (changes['viewName']
            && (changes['viewName'].currentValue || changes['viewName'].previousValue)) {
            return true;
        }

        // Update layers after switching from a view without main type documents to another view without
        // main type documents.
        return (changes['documents'] && changes['documents'].currentValue
            && changes['documents'].currentValue.length === 0);
    }
}

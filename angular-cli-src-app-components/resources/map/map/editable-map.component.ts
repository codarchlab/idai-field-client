import {Component, SimpleChanges, Input, Output, EventEmitter, HostListener} from '@angular/core';
import {FieldDocument, FieldGeometry} from 'idai-components-2';
import {LayerMapComponent} from './layer-map.component';
import {GeometryHelper} from './geometry-helper';
import {FieldPolygon} from './field-polygon';
import {FieldPolyline} from './field-polyline';
import {FieldMarker} from './field-marker';
import L from 'leaflet';

const remote = require('electron').remote;

declare global { namespace L { namespace PM { namespace Draw { interface Line { _finishShape(): void
                     _layer: any } }
     interface Draw { Line: L.PM.Draw.Line } } }
}

@Component({
    moduleId: module.id,
    selector: 'editable-map',
    templateUrl: './editable-map.html'
})
/**
 * @author Thomas Kleinke
 */
export class EditableMapComponent extends LayerMapComponent {

    @Input() isEditing: boolean;

    @Output() onQuitEditing: EventEmitter<FieldGeometry> =
        new EventEmitter<FieldGeometry>();

    public mousePositionCoordinates: string[]|undefined;

    private editableMarkers: Array<L.Marker>;
    public selectedMarker: L.Marker;

    private editablePolylines: Array<L.Polyline>;
    public selectedPolyline: L.Polyline;

    private editablePolygons: Array<L.Polygon>;
    public selectedPolygon: L.Polygon;

    private drawMode: string = 'None';


    public getLocale = () => remote.getGlobal('config').locale;

    public addPolygon = () => this.addPolyLayer('Poly');

    public addPolyline = () => this.addPolyLayer('Line');


    @HostListener('document:keyup', ['$event'])
    public handleKeyEvent(event: KeyboardEvent) {

        if (event.key == 'Escape') this.finishDrawing();
    }


    public abortEditing() {

        this.fadeInMapElements();
        this.resetEditing();

        this.onQuitEditing.emit(undefined as any);
    }


    public finishEditing() {

        if (this.drawMode !== 'None') this.finishDrawing();

        let geometry: FieldGeometry|undefined|null = { type: '', coordinates: [] };

        if (this.editablePolygons.length === 1) {
            geometry.type = 'Polygon';
            geometry.coordinates = GeometryHelper.getCoordinatesFromPolygon(this.editablePolygons[0]);
        } else if (this.editablePolygons.length > 1) {
            geometry.type = 'MultiPolygon';
            geometry.coordinates = GeometryHelper.getCoordinatesFromPolygons(this.editablePolygons);
        } else if (this.editablePolylines.length === 1) {
            geometry.type = 'LineString';
            geometry.coordinates = GeometryHelper.getCoordinatesFromPolyline(this.editablePolylines[0]);
        } else if (this.editablePolylines.length > 1) {
            geometry.type = 'MultiLineString';
            geometry.coordinates = GeometryHelper.getCoordinatesFromPolylines(this.editablePolylines);
        } else if (this.editableMarkers.length === 1) {
            geometry.type = 'Point';
            geometry.coordinates = GeometryHelper.getCoordinatesFromMarker(this.editableMarkers[0]);
        } else if (this.editableMarkers.length > 1) {
            geometry.type = 'MultiPoint';
            geometry.coordinates = GeometryHelper.getCoordinatesFromMarkers(this.editableMarkers);
        } else {
            geometry = null;
        }

        this.fadeInMapElements();
        this.resetEditing();

        this.onQuitEditing.emit(geometry as any);
    }


    public addMarker() {

        const marker: L.Marker = this.createEditableMarker(this.map.getCenter());
        this.setSelectedMarker(marker);
    }


    public getEditorType(): string|undefined {

        if (!this.isEditing || !this.selectedDocument || !this.selectedDocument.resource
            || !this.selectedDocument.resource.geometry) {
            return 'none';
        }

        switch(this.selectedDocument.resource.geometry.type) {
            case 'Polygon':
            case 'MultiPolygon':
                return 'polygon';

            case 'LineString':
            case 'MultiLineString':
                return 'polyline';

            case 'Point':
            case 'MultiPoint':
                return 'point';
        }
    }


    public deleteGeometry() {

        if (this.getEditorType() === 'polygon' && this.selectedPolygon) {
            this.removePolygon(this.selectedPolygon);
            if (this.editablePolygons.length > 0) {
                this.setSelectedPolygon(this.editablePolygons[0]);
            } else {
                this.selectedPolygon = undefined as any;
                this.addPolygon();
            }
        } else if (this.getEditorType() === 'polyline' && this.selectedPolyline) {
            this.removePolyline(this.selectedPolyline);
            if (this.editablePolylines.length > 0) {
                this.setSelectedPolyline(this.editablePolylines[0]);
            } else {
                this.selectedPolyline = undefined as any;
                this.addPolyline();
            }
        } else if (this.getEditorType() === 'point' && this.selectedMarker) {
            this.removeMarker(this.selectedMarker);
            if (this.editableMarkers.length > 0) {
                this.setSelectedMarker(this.editableMarkers[0]);
            } else {
                this.selectedMarker = undefined as any;
            }
        }
    }


    private finishDrawing() {

        if (this.drawMode == 'Line' && (this.map.pm.Draw).Line._layer.getLatLngs().length >= 2) {
            ((this.map.pm.Draw).Line)._finishShape();
        } else if (this.drawMode != 'None') {
            this.map.pm.disableDraw(this.drawMode);
        }

        this.drawMode = 'None';
    }


    private createEditableMarker(position: L.LatLng): L.Marker {

        const color: string = this.categoryColors[this.selectedDocument.resource.category];
        const editableMarker: L.Marker = L.marker(position, {
            icon: EditableMapComponent.generateMarkerIcon(color, 'active'),
            draggable: true,
            zIndexOffset: 1000
        });
        this.setupMarkerEvents(editableMarker);
        editableMarker.addTo(this.map);
        this.editableMarkers.push(editableMarker);

        return editableMarker;
    }


    private setSelectedMarkerPosition(position: L.LatLng) {

        if (this.selectedMarker) this.selectedMarker.setLatLng(position);
    }


    private addPolyLayer(drawMode: string) {

        if (this.drawMode != 'None') this.finishDrawing();

        let className = drawMode == 'Poly' ? 'polygon' : 'polyline';
        className += ' active';

        const drawOptions = {
            templineStyle: { className: 'templine' },
            hintlineStyle: { className: 'hintline' },
            pathOptions: {
                className: className,
                color: this.categoryColors[this.selectedDocument.resource.category]
            }
        };

        this.map.pm.enableDraw(drawMode, drawOptions);
        this.drawMode = drawMode;
    }


    private resetEditing() {

        if (this.editablePolygons) {
            this.editablePolygons.forEach(polygon => {
                polygon.pm.disable();
                this.map.removeLayer(polygon);
            });
        }

        if (this.editablePolylines) {
            this.editablePolylines.forEach(polyline => {
                polyline.pm.disable();
                this.map.removeLayer(polyline);
            });
        }

        if (this.editableMarkers) {
            this.editableMarkers.forEach(marker => this.map.removeLayer(marker));
        }

        this.editablePolygons = [];
        this.editablePolylines = [];
        this.editableMarkers = [];

        if (this.drawMode != 'None') this.map.pm.disableDraw(this.drawMode);
        this.drawMode = 'None';

        this.map.off('pm:create');
        this.hideMousePositionCoordinates();
    }


    private fadeOutMapElements() {

        if (!this.selectedDocument) return;

        this.callForUnselected(this.polygons, (polygon: FieldPolygon) => {
            EditableMapComponent.addClass(polygon, 'faded-out');
        });

        this.callForUnselected(this.polylines, (polyline: FieldPolyline) => {
            EditableMapComponent.addClass(polyline, 'faded-out');
        });

        this.callForUnselected(this.markers, (marker: FieldMarker) => {
            marker.setOpacity(0.5);
            EditableMapComponent.removeClass(marker, 'leaflet-interactive');
        });
    }


    private fadeInMapElements() {

        this.callForUnselected(this.polygons, (polygon: FieldPolygon) => {
            EditableMapComponent.removeClass(polygon, 'faded-out');
        });

        this.callForUnselected(this.polylines, (polyline: FieldPolyline) => {
            EditableMapComponent.removeClass(polyline, 'faded-out');
        });

        this.callForUnselected(this.markers, (marker: FieldMarker) => {
            marker.setOpacity(1);
            EditableMapComponent.addClass(marker, 'leaflet-interactive');
        });
    }


    private callForUnselected(geometryMap: { [resourceId: string]: Array<L.Layer> },
                               funct: (geometry: L.Layer) => void) {

        Object.values(geometryMap || {}).forEach(
            (geometries: Array<L.Layer>) => {
                geometries.filter((geometry: any) => this.isUnselected(geometry))
                    .forEach((geometry: any) => funct(geometry));
            }
        );
    }


    private isUnselected(element: FieldPolygon|FieldPolyline|FieldMarker) {

        return element.document && element.document.resource.id !== this.selectedDocument.resource.id;
    }


    protected async updateMap(changes: SimpleChanges): Promise<void> {

        if (!this.update) return Promise.resolve();

        if (!changes['isEditing'] || !this.isEditing
                || EditableMapComponent.hasGeometry(this.selectedDocument)) {
            await super.updateMap(changes);
        }

        this.resetEditing();

        if (this.isEditing) {
            this.map.doubleClickZoom.disable();
            this.showMousePositionCoordinates();

            if ((this.selectedDocument.resource.geometry as any).coordinates) {
                this.fadeOutMapElements();
                this.editExistingGeometry();
            } else {
                switch (this.getEditorType()) {
                    case 'polygon':
                        this.fadeOutMapElements();
                        this.startPolygonCreation();
                        break;
                    case 'polyline':
                        this.fadeOutMapElements();
                        this.startPolylineCreation();
                        break;
                    case 'point':
                        this.fadeOutMapElements();
                        this.startPointCreation();
                        break;
                }
            }
        } else {
            this.map.doubleClickZoom.enable();
            this.hideMousePositionCoordinates();
        }
    }


    protected clickOnMap(clickPosition: L.LatLng) {

        if (!this.selectedDocument) return;

        switch(this.getEditorType()) {
            case 'point':
                this.setSelectedMarkerPosition(clickPosition);
                break;
            case 'none':
                this.deselect();
                break;
        }
    }


    protected select(document: FieldDocument): boolean {

        return this.isEditing
            ? false
            : super.select(document);
    }


    protected deselect() {

        if (!this.isEditing) super.deselect();
    }


    private editExistingGeometry() {

        switch (this.getEditorType()) {
            case 'polygon':
                this.startPolygonEditing();
                break;
            case 'polyline':
                this.startPolylineEditing();
                break;
            case 'point':
                this.startPointEditing();
                break;
        }
    }


    private startPolygonCreation() {

        this.setupPolygonCreation();
        this.addPolygon();
    }


    private startPolygonEditing() {  

        this.setupPolygonCreation();

        this.editablePolygons = this.polygons[this.selectedDocument.resource.id as any];

        if (!this.editablePolygons) return;

        for (let polygon of this.editablePolygons) { 
            polygon.unbindTooltip();
            polygon.bringToFront();
            this.setupEditablePolygon(polygon);
        } 

        if (this.editablePolygons.length > 0) {
            this.setSelectedPolygon(this.editablePolygons[0]);
        }
    }  


    private setupPolygonCreation() {  

        const mapComponent = this;
        this.map.on('pm:create', function(event: L.LayerEvent) { 
            const polygon: L.Polygon = <L.Polygon> event.layer; 
            const latLngs: Array<any> = polygon.getLatLngs();
            if (latLngs.length == 1 && latLngs[0].length >= 3) {
                mapComponent.editablePolygons.push(polygon);
                mapComponent.setupEditablePolygon(polygon);
                mapComponent.setSelectedPolygon(polygon);
            } else {
                mapComponent.map.removeLayer(polygon);
                mapComponent.addPolygon();
            }
            mapComponent.drawMode = 'None';
        });
    }


    private setupEditablePolygon(polygon: L.Polygon) {

        const mapComponent = this;
        polygon.on('click', function() {
            mapComponent.setSelectedPolygon(this);
        });
    }


    private setSelectedPolygon(polygon: L.Polygon) {

        if (this.selectedPolygon) {
            this.selectedPolygon.pm.disable();
        }

        polygon.pm.enable({draggable: true, snappable: true, snapDistance: 30 });
        this.selectedPolygon = polygon;
    }


    private removePolygon(polygon: L.Polygon) {

        polygon.pm.disable();
        this.map.removeLayer(polygon);
        EditableMapComponent.removeElement(polygon, this.editablePolygons);
    }


    private startPolylineCreation() {

        this.setupPolylineCreation();
        this.addPolyline();
    }


    private startPolylineEditing() {

        this.setupPolylineCreation();

        this.editablePolylines = this.polylines[this.selectedDocument.resource.id as any];

        for (let polyline of this.editablePolylines) {
            polyline.unbindTooltip();
            polyline.bringToFront();
            this.setupEditablePolyline(polyline);
        }

        if (this.editablePolylines.length > 0) {
            this.setSelectedPolyline(this.editablePolylines[0]);
        }
    }


    private setupPolylineCreation() {

        const mapComponent = this;
        this.map.on('pm:create', function(event: L.LayerEvent) {
            let polyline: L.Polyline = <L.Polyline> event.layer;
            if (polyline.getLatLngs().length >= 2) {
                mapComponent.editablePolylines.push(polyline);
                mapComponent.setupEditablePolyline(polyline);
                mapComponent.setSelectedPolyline(polyline);
            } else {
                mapComponent.map.removeLayer(polyline);
                mapComponent.addPolyline();
            }
            mapComponent.drawMode = 'None';
        });
    }


    private setupEditablePolyline(polyline: L.Polyline) {

        const mapComponent = this;
        polyline.on('click', function() {
            mapComponent.setSelectedPolyline(this);
        });
    }


    private setSelectedPolyline(polyline: L.Polyline) {

        if (this.selectedPolyline) {
            this.selectedPolyline.pm.disable();
        }

        polyline.pm.enable({ draggable: true, snappable: true, snapDistance: 30 });

        const mapComponent = this;
        polyline.on('pm:edit', function() {
            if (this.getLatLngs().length <= 1) mapComponent.deleteGeometry();
        });
        this.selectedPolyline = polyline;
    }


    private removePolyline(polyline: L.Polyline) {

        polyline.pm.disable();
        this.map.removeLayer(polyline);
        EditableMapComponent.removeElement(polyline, this.editablePolylines);
    }


    private startPointEditing() {

        this.editableMarkers = this.markers[this.selectedDocument.resource.id];
        const color: string = this.categoryColors[this.selectedDocument.resource.category];

        for (let editableMarker of this.editableMarkers) {
            editableMarker.setIcon(EditableMapComponent.generateMarkerIcon(color, ''));
            editableMarker.unbindTooltip();
            (editableMarker.dragging as any).enable();
            editableMarker.setZIndexOffset(1000);
            this.setupMarkerEvents(editableMarker);
        }

        if (this.editableMarkers.length > 0) {
            this.setSelectedMarker(this.editableMarkers[0]);
        }
    }


    private setupMarkerEvents(editableMarker: L.Marker) {

        editableMarker.on('mouseup', event => this.setSelectedMarker(event.target));
        editableMarker.on('dragend', event => this.setSelectedMarker(event.target));
    }


    private setSelectedMarker(marker: L.Marker) {

        const color: string = this.categoryColors[this.selectedDocument.resource.category];

        if (this.selectedMarker) {
            this.selectedMarker.setIcon(EditableMapComponent.generateMarkerIcon(color, ''));
        }

        marker.setIcon(EditableMapComponent.generateMarkerIcon(color, 'active'));
        this.selectedMarker = marker;
    }


    private startPointCreation() {

        this.addMarker();
    }


    private removeMarker(marker: L.Marker) {

        this.map.removeLayer(marker);
        EditableMapComponent.removeElement(marker, this.editableMarkers);
    }


    private showMousePositionCoordinates() {

        this.map.addEventListener('mousemove', (event: any) => this.updateMousePositionCoordinates(event['latlng']));
        this.map.addEventListener('mouseout', () => this.mousePositionCoordinates = undefined);
    }


    private hideMousePositionCoordinates() {

        this.map.off('mousemove');
        this.map.off('mouseout');
        this.mousePositionCoordinates = undefined;
    }


    private updateMousePositionCoordinates(latLng: L.LatLng) {

        this.mousePositionCoordinates = [latLng.lng.toFixed(7), latLng.lat.toFixed(7)];
    }


    private static removeElement(element: any, list: Array<any>) {

        for (let listElement of list) {
            if (element === listElement) {
                list.splice(list.indexOf(element), 1);
            }
        }
    }


    private static hasGeometry(document: FieldDocument): boolean {

        return document !== undefined && document.resource.geometry !== undefined
            && document.resource.geometry.coordinates !== undefined;
    }


    private static addClass(element: any, classToAdd: string) {

        this.getClassList(element).add(classToAdd);
    }


    private static removeClass(element: any, classToRemove: string) {

        this.getClassList(element).remove(classToRemove);
    }


    private static getClassList(element: any): DOMTokenList {

        return element._path ? element._path.classList : element._icon.classList;
    }
}

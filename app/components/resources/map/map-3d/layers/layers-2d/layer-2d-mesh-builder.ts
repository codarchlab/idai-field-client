import {Injectable} from '@angular/core';
import * as THREE from 'three';
import {ImageGeoreference} from 'idai-components-2'
import {SettingsService} from '../../../../../../core/settings/settings-service';
import {ImageReadDatastore} from '../../../../../../core/datastore/field/image-read-datastore';
import {IdaiFieldImageDocument} from '../../../../../../core/model/idai-field-image-document';;
import {MeshPreparationUtility} from '../../../../../core-3d/mesh-loading/mesh-preparation-utility';
import {getPointVector} from '../../../../../../util/util-3d';


@Injectable()
/**
 * @author Thomas Kleinke
 */
export class Layer2DMeshBuilder {

    constructor(private settingsService: SettingsService,
                private datastore: ImageReadDatastore) {}


    public async build(imageResourceId: string): Promise<THREE.Mesh> {

        const {georeference, height} = await this.getGeoreference(imageResourceId);
        const position: THREE.Vector3 = Layer2DMeshBuilder.getPosition(georeference, height);
        const offset: THREE.Vector3 = Layer2DMeshBuilder.getGeometryOffset(georeference);

        const geometry: THREE.BufferGeometry
            = await Layer2DMeshBuilder.createGeometry(georeference, offset);
        const material: THREE.Material = this.createMaterial(imageResourceId);

        return Layer2DMeshBuilder.createMesh(geometry, material, position);
    }


    private async getGeoreference(imageResourceId: string)
    : Promise<{ georeference: ImageGeoreference, height: number}> {

        const imageDocument: IdaiFieldImageDocument = await this.datastore.get(imageResourceId);
        return {
            georeference: imageDocument.resource.georeference as ImageGeoreference,
            height: imageDocument.resource.georeferenceHeight || 0
        };
    }


    private createMaterial(imageResourceId: string): THREE.Material {

        return new THREE.MeshLambertMaterial({
            color: 0xffffff,
            map: new THREE.TextureLoader().load(this.getFilePath(imageResourceId)),
            flatShading: true
        });
    }


    private getFilePath(imageResourceId: string): string {

        return this.settingsService.getSettings().imagestorePath
            + this.settingsService.getSelectedProject()
            + '/' + imageResourceId;
    }


    private static getPosition(georeference: ImageGeoreference, height: number): THREE.Vector3 {

        return Layer2DMeshBuilder.getVector(georeference.bottomLeftCoordinates, height);
    }


    private static getGeometryOffset(georeference: ImageGeoreference): THREE.Vector3 {

        return Layer2DMeshBuilder.getVector(georeference.bottomLeftCoordinates);
    }


    private static async createGeometry(georeference: ImageGeoreference,
                                        offset: THREE.Vector3): Promise<THREE.BufferGeometry> {

        const geometry: THREE.Geometry = new THREE.Geometry();

        geometry.vertices = await this.createVertices(georeference, offset);
        geometry.faces = this.createFaces();
        geometry.faceVertexUvs[0] = this.createFaceVertexUvs();

        geometry.computeFaceNormals();
        geometry.computeVertexNormals();

        return new THREE.BufferGeometry().fromGeometry(geometry);
    }


    private static createMesh(geometry: THREE.BufferGeometry, material: THREE.Material,
                              position: THREE.Vector3) {

        const mesh: THREE.Mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(position.x, position.y, position.z);

        MeshPreparationUtility.center(mesh);

        return mesh;
    }


    private static async createVertices(georeference: ImageGeoreference,
                                        offset: THREE.Vector3): Promise<Array<THREE.Vector3>> {

        const bottomLeft: THREE.Vector3
            = Layer2DMeshBuilder.getVector(georeference.bottomLeftCoordinates).sub(offset);
        const topLeft: THREE.Vector3
            = Layer2DMeshBuilder.getVector(georeference.topLeftCoordinates).sub(offset);
        const topRight: THREE.Vector3
            = Layer2DMeshBuilder.getVector(georeference.topRightCoordinates).sub(offset);
        const bottomRight: THREE.Vector3
            = Layer2DMeshBuilder.getBottomRightVector(bottomLeft, topLeft, topRight);

        return [bottomLeft, topLeft, topRight, bottomRight];
    }


    private static createFaces(): Array<THREE.Face3> {

        const faces: Array<THREE.Face3> = [];

        faces.push(new THREE.Face3(0, 2, 1));
        faces.push(new THREE.Face3(0, 3, 2));

        return faces;
    }


    private static createFaceVertexUvs(): Array<Array<THREE.Vector2>> {

        const faceVertexUvs: Array<Array<THREE.Vector2>> = [];

        faceVertexUvs.push([
            new THREE.Vector2(0, 0),
            new THREE.Vector2(1, 1),
            new THREE.Vector2(0, 1)
        ]);

        faceVertexUvs.push([
            new THREE.Vector2(0, 0),
            new THREE.Vector2(1, 0),
            new THREE.Vector2(1, 1)
        ]);

        return faceVertexUvs;
    }


    private static getVector(coordinates: number[], height: number = 0): THREE.Vector3 {

        return getPointVector([
            coordinates[1],
            coordinates[0],
            height
        ]);
    }


    private static getBottomRightVector(bottomLeft: THREE.Vector3, topLeft: THREE.Vector3,
                                        topRight: THREE.Vector3): THREE.Vector3 {

        const direction: THREE.Vector3 = new THREE.Vector3().subVectors(topRight, topLeft);

        return new THREE.Vector3().addVectors(bottomLeft, direction);
    }
}
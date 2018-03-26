import {Injectable} from '@angular/core';
import * as THREE from 'three';
import {MeshLoadingProgress} from '../../components/core-3d/mesh-loading-progress';


@Injectable()
/**
 * @author Thomas Kleinke
 */
export class MeshPreparationUtility {

    constructor(private meshLoadingProgress: MeshLoadingProgress) {}


    public performDefaultAdjustments(mesh: THREE.Mesh, scene: THREE.Scene): Promise<any> {

        return new Promise<any>(async resolve => {

            const position: THREE.Vector3 = MeshPreparationUtility.getPosition(mesh);

            const geometry: THREE.Geometry = await this.performAdjustment(1,
                MeshPreparationUtility.makeGeometryFromBufferGeometry.bind(MeshPreparationUtility),
                mesh, position);

            await this.performAdjustment(2,
                MeshPreparationUtility.prepareGeometry.bind(MeshPreparationUtility), mesh, geometry);

            const backSideMesh: THREE.Mesh = await this.performAdjustment(3,
                MeshPreparationUtility.createBackSideMesh.bind(MeshPreparationUtility), mesh, geometry);

            await this.performAdjustment(4,
                MeshPreparationUtility.applySceneMatrix.bind(MeshPreparationUtility), mesh, backSideMesh,
                position, scene);

            await this.performAdjustment(5,
                MeshPreparationUtility.centerGeometry.bind(MeshPreparationUtility), mesh);

            mesh.position.add(position);

            resolve();
        });
    }


    public static centerGeometry(mesh: THREE.Mesh) {

        mesh.geometry.computeBoundingSphere();
        mesh.geometry.computeBoundingBox();

        const center: THREE.Vector3 = mesh.geometry.boundingSphere.center.clone();
        mesh.position.add(center);

        mesh.geometry.translate(-center.x, -center.y, -center.z);

        for (let child of mesh.children) {
            if (child instanceof THREE.Mesh) child.geometry.translate(-center.x, -center.y, -center.z);
        }
    }


    private async performAdjustment(stepNumber: number, adjustmentFunction: Function, mesh: THREE.Mesh,
                                    parameter1?: any, parameter2?: any, parameter3?: any): Promise<any> {

        return new Promise<any>(resolve => {

            setTimeout(() => {
                const result: any = adjustmentFunction(mesh, parameter1, parameter2, parameter3);
                this.meshLoadingProgress.setAdjustingProgress(mesh.name, stepNumber, 5);
                resolve(result);
            });
        });
    }


    private static makeGeometryFromBufferGeometry(mesh: THREE.Mesh, offset: THREE.Vector3): THREE.Geometry {

        const bufferGeometry: THREE.BufferGeometry = mesh.geometry as THREE.BufferGeometry;

        const geometry = new THREE.Geometry();
        geometry.vertices = this.getVertices(bufferGeometry, offset);
        geometry.faces = this.getFaces(geometry.vertices);
        geometry.faceVertexUvs = this.getUV(bufferGeometry);
        geometry.uvsNeedUpdate = true;

        return geometry;
    }


    private static prepareGeometry(mesh: THREE.Mesh, geometry: THREE.Geometry) {

        geometry.computeFaceNormals();
        geometry.mergeVertices();
        geometry.computeVertexNormals();

        mesh.geometry = new THREE.BufferGeometry().fromGeometry(geometry);
    }


    private static createBackSideMesh(mesh: THREE.Mesh, geometry: THREE.Geometry): THREE.Mesh {

        this.flipNormals(geometry);

        const backSideMesh = new THREE.Mesh();
        backSideMesh.geometry = new THREE.BufferGeometry().fromGeometry(geometry);
        backSideMesh.material = new THREE.MeshPhongMaterial({
            color: new THREE.Color(0xffffff)
        });

        mesh.add(backSideMesh);

        return backSideMesh;
    }


    private static applySceneMatrix(mesh: THREE.Mesh, backSideMesh: THREE.Mesh, position: THREE.Vector3,
                                    scene: THREE.Scene) {

        scene.updateMatrix();

        mesh.geometry.applyMatrix(scene.matrix);
        backSideMesh.geometry.applyMatrix(scene.matrix);
        position.applyMatrix4(scene.matrix);
    }


    private static getVertices(bufferGeometry: THREE.BufferGeometry,
                               offset: THREE.Vector3): Array<THREE.Vector3> {

        const attribute = bufferGeometry.getAttribute('position');
        const vertices = attribute.array;

        const result: Array<THREE.Vector3> = [];

        for (let i = 0; i < vertices.length; i += 3) {
            const x: number = vertices[i] - offset.x;
            const y: number = vertices[i + 1] - offset.y;
            const z: number = vertices[i + 2] - offset.z;

            result.push(new THREE.Vector3(x, y, z));
        }

        return result;
    }


    private static getFaces(vertices: Array<THREE.Vector3>): Array<THREE.Face3> {

        const faces: Array<THREE.Face3> = [];

        for (let i = 0; i < vertices.length; i += 3) {
            faces.push(new THREE.Face3(i, i + 1, i + 2));
        }

        return faces;
    }


    private static getUV(bufferGeometry: THREE.BufferGeometry): Array<Array<Array<THREE.Vector2>>> {

        const attribute = bufferGeometry.getAttribute('uv');
        const uv = attribute.array;

        const result: Array<Array<Array<THREE.Vector2>>> = [[]];

        for (let i = 0; i < uv.length; i += 6) {
            result[0].push([
                new THREE.Vector2(uv[i], uv[i + 1]),
                new THREE.Vector2(uv[i + 2], uv[i + 3]),
                new THREE.Vector2(uv[i + 4], uv[i + 5])
            ]);
        }

        return result;
    }


    private static getPosition(mesh: THREE.Mesh): THREE.Vector3 {

        const vertices: any = (mesh.geometry as THREE.BufferGeometry).getAttribute('position').array;

        return new THREE.Vector3(vertices[0], vertices[1], vertices[2]);
    }


    private static flipNormals(geometry: THREE.Geometry) {

        for (let face of geometry.faces) {
            let a: number = face.a;
            face.a = face.c;
            face.c = a;
        }

        geometry.computeFaceNormals();
        geometry.computeVertexNormals();

        for (let faceUvs of geometry.faceVertexUvs[0]) {
            let firstUv: THREE.Vector2 = faceUvs[0];
            faceUvs[0] = faceUvs[2];
            faceUvs[2] = firstUv;
        }
    }
}
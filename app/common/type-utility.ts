import {Injectable} from '@angular/core';
import {ProjectConfiguration, IdaiType} from 'idai-components-2/configuration'


@Injectable()
/**
 * @author Thomas Kleinke
 * @author F.Z.
 * @author Daniel de Oliveira
 */
export class TypeUtility {


    constructor(private projectConfiguration: ProjectConfiguration) {}


    public isImageType(typeName: string): boolean {

        const type = this.projectConfiguration.getTypesMap()[typeName];
        if (!type) throw 'Unknown type "' + typeName + '"';
        return (type.name == 'Image' ||
            (type.parentType && type.parentType.name && type.parentType.name == 'Image'));
    }


    public is3DType(typeName: string): boolean {

        return typeName == 'Object3D';
    }


    public getProjectImageTypes(): any {

        const projectTypesTree: { [type: string]: IdaiType } = this.projectConfiguration.getTypesTree();
        let projectImageTypes: any = {};

        if (projectTypesTree['Image']) {
            projectImageTypes['Image'] = projectTypesTree['Image'];

            if (projectTypesTree['Image'].children) {
                for (let i = projectTypesTree['Image'].children.length - 1; i >= 0; i--) {
                    projectImageTypes[projectTypesTree['Image'].children[i].name]
                        = projectTypesTree['Image'].children[i];
                }
            }
        }

        return projectImageTypes;
    }


    public getResourceTypeNames(): string[] {

        return this.projectConfiguration.getTypesList()
            .filter(type => !this.isImageType(type.name) && !this.is3DType(type.name))
            .map(type => type.name);
    }


    public getImageTypeNames(): string[] {

        return Object.keys(this.getProjectImageTypes());
    }


    public get3DTypeNames(): string[] {

        return ['Object3D'];
    }
}
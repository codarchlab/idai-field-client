import {Injectable} from '@angular/core';
import {IdaiType, ProjectConfiguration} from 'idai-components-2';
import {to} from 'tsfun';


@Injectable()
/**
 * @author Thomas Kleinke
 * @author F.Z.
 * @author Daniel de Oliveira
 */
export class TypeUtility {

    constructor(private projectConfiguration: ProjectConfiguration) {}


    public isSubtype(typeName: string, superTypeName: string): boolean {

        const type = this.projectConfiguration.getTypesMap()[typeName];
        if (!type) throw 'Unknown type "' + typeName + '"';
        return (type.name === superTypeName)
            || (type.parentType && type.parentType.name && type.parentType.name == superTypeName);
    }


    public getSubtypes(superTypeName: string): any {

        const projectTypesTree: { [type: string]: IdaiType } = this.projectConfiguration.getTypesTree();
        let subtypes: any = {};

        if (projectTypesTree[superTypeName]) {
            subtypes[superTypeName] = projectTypesTree[superTypeName];

            if (projectTypesTree[superTypeName].children) {
                for (let i = projectTypesTree[superTypeName].children.length - 1; i >= 0; i--) {
                    subtypes[projectTypesTree[superTypeName].children[i].name]
                        = projectTypesTree[superTypeName].children[i];
                }
            }
        }

        return subtypes;
    }


    public getOverviewTopLevelTypes(): Array<IdaiType> {

        return this.projectConfiguration.getTypesList()
            .filter(type => type.name === 'Operation' || type.name === 'Place');
    }


    public getNonMediaTypes(): Array<IdaiType> {

        return this.projectConfiguration.getTypesList()
            .filter(type => !this.isSubtype(type.name, 'Image'))
            .filter(type => !this.isSubtype(type.name, 'Model3D'))
            .filter(type => !TypeUtility.isProjectType(type.name))
    }


    public getNonMediaTypeNames(): string[] {

        return this.getNonMediaTypes().map(type => type.name);
    }


    public getImageTypeNames(): string[] {

        return Object.keys(this.getSubtypes('Image'));
    }


    public getFeatureTypeNames(): string[] {

        return Object.keys(this.getSubtypes('Feature'));
    }


    public get3DTypeNames(): string[] {

        return Object.keys(this.getSubtypes('Model3D'));
    }


    public getMediaTypeNames(): string[] {

        return this.getImageTypeNames().concat(this.get3DTypeNames());
    }


    public getRegularTypeNames(): string[] {

        return this.projectConfiguration
            .getTypesList()
            .map(to('name'))
            .filter(typename => typename !== 'Place')
            .filter(typename => typename !== 'Project')
            .filter(typename => !this.isSubtype(typename, 'Operation'))
            .filter(typename => !this.isSubtype(typename, 'Image'))
            .filter(typename => !this.isSubtype(typename, 'Model3D'));
    }


    public getOverviewTypeNames(): string[] {

        return this.projectConfiguration
            .getTypesList()
            .map(to('name'))
            .filter(typename => this.isSubtype(typename, 'Operation'))
            .concat('Place');
    }


    private static isProjectType(typeName: string): boolean {

        return typeName === 'Project';
    }
}
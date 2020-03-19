import {FieldDefinition} from './field-definition';

export module Groups {

    export const STEM = 'stem';
    export const DIMENSION = 'dimension';
    export const TIME = 'time';
    export const POSITION = 'position';
    export const IDENTIFICATION = 'identification';
    export const PROPERTIES = 'properties';
    export const PARENT = 'parent';
    export const CHILD = 'child';
}


export const DEFAULT_GROUP_ORDER = [
    'stem',
    'identification',
    'parent',
    'child',
    'dimension',
    'position',
    'time'
];


export interface Group {

    name: string;
    fields: Array<FieldDefinition>;
    // TODO add relations, more fields?
}


export interface GroupDefinition { // TODO remove redundancy

    name: string;
    label: string;
    fields: any[];
    relations: any[];
    widget: string|undefined;
}


export module Group {

    const FIELDS = 'fields';
}
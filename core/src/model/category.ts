import { flatten, flow, map, to } from 'tsfun';
import { I18nString } from './i18n-string';
import { Name, Named } from '../tools/named';
import { FieldDefinition } from './field-definition';
import { Group } from './group';
import { LabelUtil } from '../tools/label-util';


export interface Category extends Named {
    
    // Note that that the name property given `extends Named`
    // may coincide with `categoryName`, depending on the given context.
    // 
    // It is used to identify an edit form.

    categoryName: Name, // Multiple Categories can share common semantics.
                        // Fields shared between categories with the same
                        // categoryName mean the same thing.

    source?: 'builtin'|'library'|'custom';
    children: Array<Category>;
    parentCategory: Category|undefined; //  = undefined;
    isAbstract: boolean;
    label: I18nString;
    description: I18nString;
    defaultLabel?: I18nString;
    defaultDescription?: I18nString;
    color?: string;
    defaultColor?: string;
    groups: Array<Group>;
    mustLieWithin: boolean|undefined; // = undefined;
    userDefinedSubcategoriesAllowed?: boolean
}


/**
 * @author F.Z.
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export module Category {

    export const COLOR = 'color';
    export const PARENT_CATEGORY = 'parentCategory';
    export const CHILDREN = 'children';
    export const DESCRIPTION = 'description';
    export const GROUPS = 'groups';


    export module Source {

        export const BUILTIN = 'builtin';
        export const LIBRARY = 'library';
        export const CUSTOM = 'custom';
    }


    export function getFields(category: Category): Array<FieldDefinition> {

        return flow(
            category.groups,
            Object.values,
            map(to<Array<FieldDefinition>>(Group.FIELDS)),
            flatten()
        );
    }


    export function getLabel(fieldName: string, fields: Array<any>): string {

        for (let field of fields) {
            if (field.name === fieldName) return LabelUtil.getLabel(field);
        }
        return fieldName;
    }


    export function getNamesOfCategoryAndSubcategories(category: Category): string[] {

        return [category.name].concat(category.children.map(to(Named.NAME)));
    }


    export function isBrightColor(color: string): boolean {

        color = color.substring(1); // strip #
        let rgb = parseInt(color, 16);   // convert rrggbb to decimal
        let r = (rgb >> 16) & 0xff;  // extract red
        let g = (rgb >>  8) & 0xff;  // extract green
        let b = (rgb >>  0) & 0xff;  // extract blue
        let luma = 0.2126 * r + 0.7152 * g + 0.0722 * b; // per ITU-R BT.709

        return luma > 200;
    }


    export function generateColorForCategory(categoryName: string): string {

        const hash = hashCode(categoryName);
        const r = (hash & 0xFF0000) >> 16;
        const g = (hash & 0x00FF00) >> 8;
        const b = hash & 0x0000FF;
        return '#' + ('0' + r.toString(16)).substr(-2)
            + ('0' + g.toString(16)).substr(-2) + ('0' + b.toString(16)).substr(-2);
    }


    function hashCode(string: any): number {

        let hash = 0, i, chr;
        if (string.length === 0) return hash;
        for (i = 0; i < string.length; i++) {
            chr   = string.charCodeAt(i);
            hash  = ((hash << 5) - hash) + chr;
            hash |= 0; // Convert to 32bit integer
        }
        return hash;
    }
}

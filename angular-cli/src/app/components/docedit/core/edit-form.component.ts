import {AfterViewInit, Component, ElementRef, Input, OnChanges, ViewChild} from '@angular/core';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {isUndefinedOrEmpty} from 'tsfun';
import {Document} from 'idai-components-2';
import {ProjectCategories} from '../../../core/configuration/project-categories';
import {FieldDefinition} from '../../../core/configuration/model/field-definition';
import {RelationDefinition} from '../../../core/configuration/model/relation-definition';
import {ProjectConfiguration} from '../../../core/configuration/project-configuration';
import {Group} from '../../../core/configuration/model/group';
import {TypeRelations} from '../../../core/model/relation-constants';
import {clone} from '../../../core/util/object-util';


@Component({
    moduleId: module.id,
    selector: 'edit-form',
    templateUrl: './edit-form.html'
})
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class EditFormComponent implements AfterViewInit, OnChanges {

    @ViewChild('editor', {static: false}) rootElement: ElementRef;

    @Input() document: any;
    @Input() fieldDefinitions: Array<FieldDefinition>;
    @Input() originalGroups: Array<Group>;
    @Input() inspectedRevisions: Document[];
    @Input() activeGroup: string;


    public categories: string[];

    public extraGroups: Array<Group> = [
        { name: 'images', label: this.i18n({ id: 'docedit.group.images', value: 'Bilder' }), fields: [], relations: [] },
        { name: 'conflicts', label: this.i18n({ id: 'docedit.group.conflicts', value: 'Konflikte' }), fields: [], relations: [] }];

    public groups: Array<Group> = [];

    constructor(private elementRef: ElementRef,
                private i18n: I18n,
                private projectConfiguration: ProjectConfiguration,
                private projectCategories: ProjectCategories) {}


    public activateGroup = (name: string) => this.activeGroup = name;


    public shouldShow(groupName: string) {

        return (groupName === 'images'
                && !this.projectCategories.getImageCategoryNames().includes(this.document.resource.category))
            || (groupName === 'conflicts' && this.document._conflicts)
            || this.getFieldDefinitions(groupName).filter(field => field.editable).length > 0
            || this.getRelationDefinitions(groupName).length > 0;
    }


    public getFieldDefinitions(groupName: string): Array<FieldDefinition> {

        return (this.groups.find((group: Group) => group.name === groupName) as any).fields;
    }


    public getRelationDefinitions(groupName: string): Array<RelationDefinition> {

        return (this.groups.find((group: Group) => group.name === groupName) as any).relations
            .filter((relation: RelationDefinition) => relation.name !== TypeRelations.INSTANCEOF);
    }


    ngAfterViewInit() {

        this.focusFirstInputElement();
    }


    ngOnChanges() {

        if (isUndefinedOrEmpty(this.originalGroups)) return;

        this.groups = [];
        for (let originalGroup of this.originalGroups) {
            const group = clone(originalGroup);
            this.groups.push(group as any);
        }
        this.groups = this.groups.concat(this.extraGroups);

        if (this.projectCategories.isGeometryCategory(this.document.resource.category)) {
            this.addGeometryField();
        }
    }


    private focusFirstInputElement() {

        const inputElements: Array<HTMLElement> = this.elementRef.nativeElement
            .getElementsByTagName('input');
        if (inputElements.length > 0) inputElements[0].focus();
    }


    private addGeometryField() {

        (this.groups.find(group => group.name === 'position') as Group).fields.unshift({
            name: 'geometry',
            label: this.i18n({ id: 'docedit.geometry', value: 'Geometrie' }),
            group: 'position',
            inputType: 'geometry',
            editable: true
        });
    }
}
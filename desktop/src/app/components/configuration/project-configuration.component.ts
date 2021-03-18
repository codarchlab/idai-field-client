import {Component} from '@angular/core';
import {to, on, is, isnt, includedIn, or, any, compose, map, Predicate, longerThan} from 'tsfun';
import {FieldResource} from 'idai-components-2';
import {ProjectConfiguration} from '../../core/configuration/project-configuration';
import {Category} from '../../core/configuration/model/category';
import {Group} from '../../core/configuration/model/group';
import {FieldDefinition} from '../../core/configuration/model/field-definition';
import {ValuelistDefinition} from '../../core/configuration/model/valuelist-definition';
import {ValuelistUtil} from '../../core/util/valuelist-util';
import {TabManager} from '../../core/tabs/tab-manager';
import {Named} from '../../core/util/named';
import {RelationDefinition} from '../../core/configuration/model/relation-definition';
import {TypeRelations} from '../../core/model/relation-constants';
import {MenuContext, MenuService} from '../menu-service';

const locale: string = typeof window !== 'undefined'
  ? window.require('electron').remote.getGlobal('config').locale
  : require('electron').remote.getGlobal('config').locale;


@Component({
    templateUrl: './project-configuration.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    }
})
/**
 * @author Sebastian Cuy
 */
export class ProjectConfigurationComponent {

    public toplevelCategoriesArray: Array<Category>;
    public selectedCategory: Category;
    public selectedGroup: string;

    private OVERRIDE_VISIBLE_FIELDS = [FieldResource.IDENTIFIER, FieldResource.SHORTDESCRIPTION];


    constructor(private projectConfiguration: ProjectConfiguration,
                private tabManager: TabManager,
                private menuService: MenuService) {

        this.toplevelCategoriesArray = projectConfiguration.getCategoriesArray()
            .filter(category => !category.parentCategory);
        this.selectCategory(this.toplevelCategoriesArray[0]);
    }


    public getValueLabel = (valuelist: ValuelistDefinition, valueId: string) =>
        ValuelistUtil.getValueLabel(valuelist, valueId);

    public getValues = (valuelist: ValuelistDefinition) => ValuelistUtil.getOrderedValues(valuelist);

    public getValuelistDescription = (valuelist: ValuelistDefinition) => valuelist.description?.[locale];

    public getCategoryDescription = (category: Category) => category.description?.[locale];


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && this.menuService.getContext() === MenuContext.DEFAULT) {
            await this.tabManager.openActiveTab();
        }
    }


    public selectCategory(category: Category) {

        this.selectedCategory = category;
        this.selectedGroup = this.getGroups(category)[0].name;
    }


    public getGroups(category: Category): Array<Group> {

        return category.groups.filter(
            or(
                on(Group.FIELDS, longerThan([])),
                on(Group.RELATIONS, longerThan([]))
            )
        );
    }


    public getVisibleFields(category: Category): Array<FieldDefinition> {

        return category.groups
            .find(on(Named.NAME, is(this.selectedGroup)))!
            .fields
            .filter(
                or(
                    on(FieldDefinition.VISIBLE, is(true)),
                    on(FieldDefinition.NAME, includedIn(this.OVERRIDE_VISIBLE_FIELDS))
                )
            );
    }


    public getRelations(category: Category): Array<RelationDefinition> {

        return category.groups
            .find(on(Named.NAME, is(this.selectedGroup)))!
            .relations
            .filter(on(Named.NAME, isnt(TypeRelations.INSTANCEOF)));
    }


    public hasCustomFields: Predicate<Group> = compose(
        to(Group.FIELDS),
        map(to(FieldDefinition.SOURCE)),
        any(is(FieldDefinition.Source.CUSTOM))
    );
}

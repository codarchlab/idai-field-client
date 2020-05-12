import {Component, Input, OnChanges} from '@angular/core';
import {Resource} from 'idai-components-2';
import {ValuelistUtil} from '../../../../core/util/valuelist-util';
import {DocumentReadDatastore} from '../../../../core/datastore/document-read-datastore';
import {HierarchyUtil} from '../../../../core/util/hierarchy-util';
import {ValuelistDefinition} from '../../../../core/configuration/model/valuelist-definition';

@Component({
    moduleId: module.id,
    selector: 'dai-checkboxes',
    templateUrl: './checkboxes.html'
})

/**
 * @author Fabian Z.
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class CheckboxesComponent implements OnChanges {

    @Input() resource: Resource;
    @Input() field: any;

    public valuelist: ValuelistDefinition;


    constructor(private datastore: DocumentReadDatastore) {}


    async ngOnChanges() {

        this.valuelist = ValuelistUtil.getValuelist(
            this.field,
            await this.datastore.get('project'),
            await HierarchyUtil.getParent(this.resource, this.datastore)
        );
    }


    public getValues = () => this.valuelist ? Object.keys(this.valuelist.values) : [];

    public getLabel = (valueId: string) => ValuelistUtil.getValueLabel(this.valuelist, valueId);


    public toggleCheckbox(item: string) {

        if (!this.resource[this.field.name]) this.resource[this.field.name] = [];
        if (!this.removeItem(item)) this.resource[this.field.name].push(item);
        if (this.resource[this.field.name].length === 0) delete this.resource[this.field.name];
    }


    public hasEmptyValuelist(): boolean {

        return this.valuelist && Object.keys(this.valuelist.values).length === 0
    }


    private removeItem(name: string): boolean {

        const index = this.resource[this.field.name].indexOf(name, 0);
        if (index !== -1) this.resource[this.field.name].splice(index, 1);
        return index !== -1;
    }
}
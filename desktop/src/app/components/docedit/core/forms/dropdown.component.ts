import {Component, Input, OnChanges} from '@angular/core';
import {ValuelistDefinition, FieldDefinition} from 'idai-field-core';
import {Resource} from 'idai-field-core';
import {ValuelistUtil} from '../../../../core/util/valuelist-util';
import {HierarchyUtil} from '../../../../core/util/hierarchy-util';
import {DocumentDatastore} from '../../../../core/datastore/document-datastore';


@Component({
    selector: 'dai-dropdown',
    templateUrl: './dropdown.html'
})
/**
 * @author Fabian Z.
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class DropdownComponent implements OnChanges {

    @Input() resource: Resource;
    @Input() field: FieldDefinition;

    public valuelist: ValuelistDefinition;


    constructor(private datastore: DocumentDatastore) {}


    public getValues = () => this.valuelist ? ValuelistUtil.getOrderedValues(this.valuelist) : [];

    public getLabel = (valueId: string) => ValuelistUtil.getValueLabel(this.valuelist, valueId);


    async ngOnChanges() {

        this.valuelist = ValuelistUtil.getValuelist(
            this.field,
            await this.datastore.get('project'),
            await HierarchyUtil.getParent(this.resource, this.datastore)
        );
    }


    public deleteIfEmpty(value: string) {

        if (value === '') delete this.resource[this.field.name];
    }


    public hasEmptyValuelist(): boolean {

        return this.valuelist && Object.keys(this.valuelist.values).length === 0;
    }
}

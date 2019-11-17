import {Component, Input, OnChanges} from '@angular/core';
import {Resource} from 'idai-components-2';
import {ValuelistUtil} from '../../../../core/util/valuelist-util';
import {HierarchyUtil} from '../../../../core/util/hierarchy-util';
import {DocumentReadDatastore} from '../../../../core/datastore/document-read-datastore';


@Component({
    moduleId: module.id,
    selector: 'dai-radio',
    templateUrl: `./radio.html`
})

/**
 * @author Fabian Z.
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class RadioComponent implements OnChanges {

    @Input() resource: Resource;
    @Input() field: any;

    public valuelist: string[];


    constructor(private datastore: DocumentReadDatastore) {}


    async ngOnChanges() {

        this.valuelist = ValuelistUtil.getValuelist(
            this.field,
            await this.datastore.get('project'),
            await HierarchyUtil.getParent(this.resource, this.datastore)
        );
    }
    

    public setValue(value: any) {
        
        this.resource[this.field.name] = value;
    }


    public resetValue() {
        
        delete this.resource[this.field.name];
    }


    public hasEmptyValuelist(): boolean {

        return this.valuelist && this.valuelist.length === 0
    }
}
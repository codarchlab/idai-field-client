import {Component, OnInit} from 'angular2/core';
import {DatastoreService} from '../services/datastore.service';
import {IdaiFieldObject} from '../model/idai-field-object';

@Component({
    templateUrl: 'templates/overview.html',
    providers: [DatastoreService]
})

export class OverviewComponent implements OnInit {

    public objects: IdaiFieldObject[];

    constructor(private _datastoreService: DatastoreService) {

    }

    ngOnInit() {

        this.objects = this._datastoreService.getObjects();
    }
}
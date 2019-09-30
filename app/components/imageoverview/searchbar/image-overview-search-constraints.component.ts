import {Component, Renderer2} from '@angular/core';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {SearchConstraintsComponent} from '../../../widgets/search-constraints.component';
import {ImageOverviewSearchBarComponent} from './image-overview-search-bar.component';
import {ImageOverviewFacade} from '../view/imageoverview-facade';
import {ProjectConfiguration} from '../../../core/configuration/project-configuration';
import {FieldDefinition} from '../../../core/configuration/model/field-definition';
import {SettingsService} from '../../../core/settings/settings-service';


@Component({
    moduleId: module.id,
    selector: 'image-overview-search-constraints',
    templateUrl: '../../../widgets/search-constraints.html',
    host: {
        '(document:click)': 'handleClick($event)',
    }
})
/**
 * @author Thomas Kleinke
 */
export class ImageOverviewSearchConstraintsComponent extends SearchConstraintsComponent {

    protected defaultFields: Array<FieldDefinition> = [
        {
            name: 'depicts',
            label: this.i18n({
                id: 'imageOverview.searchBar.constraints.linkedResources',
                value: 'Verknüpfte Ressourcen'
            }),
            inputType: 'default',
            constraintIndexed: true,
            group: ''
        }
    ];

    constructor(imageOverviewSearchBarComponent: ImageOverviewSearchBarComponent,
                projectConfiguration: ProjectConfiguration,
                settingsService: SettingsService,
                renderer: Renderer2,
                i18n: I18n,
                private imageOverviewFacade: ImageOverviewFacade) {

        super(imageOverviewSearchBarComponent, projectConfiguration, settingsService, renderer, i18n);
    }


    protected getCustomConstraints(): { [name: string]: string } {

        return this.imageOverviewFacade.getCustomConstraints();
    }


    protected async setCustomConstraints(constraints: { [name: string]: string }): Promise<void> {

        return this.imageOverviewFacade.setCustomConstraints(constraints);
    }
}
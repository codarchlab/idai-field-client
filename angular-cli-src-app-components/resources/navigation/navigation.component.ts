import {Component} from '@angular/core';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {FieldDocument} from 'idai-components-2';
import {Loading} from '../../widgets/loading';
import {ProjectConfiguration} from '../../../core/configuration/project-configuration';
import {NavigationPath} from '../../../core/resources/view/state/navigation-path';
import {ViewFacade} from '../../../core/resources/view/view-facade';
import {NavigationService} from '../../../core/resources/navigation/navigation-service';


type NavigationButtonLabelMap = { [id: string]: { text: string, fullText: string, shortened: boolean } };


@Component({
    moduleId: module.id,
    selector: 'navigation',
    templateUrl: './navigation.html'
})
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class NavigationComponent {

    public navigationPath: NavigationPath = NavigationPath.empty();
    public labels: NavigationButtonLabelMap = {};

    private static maxTotalLabelCharacters: number = 40;


    constructor(public viewFacade: ViewFacade,
                public projectConfiguration: ProjectConfiguration,
                private navigationService: NavigationService,
                private loading: Loading,
                private i18n: I18n) {

        this.viewFacade.navigationPathNotifications().subscribe(path => {
            this.navigationPath = path;
            this.labels = NavigationComponent.getLabels(this.navigationPath);
        });
    }


    public getNavigationButtonLabel = (id: string) => this.labels[id];

    public isInExtendedSearchMode = () => this.viewFacade.isInExtendedSearchMode();

    public moveInto = (document: FieldDocument|undefined) => this.navigationService.moveInto(document);

    public isSelectedSegment = (id: string) => id === this.navigationPath.selectedSegmentId;


    public getTooltip() {

        return this.viewFacade.isInExtendedSearchMode()
            ? this.i18n({
                id: 'resources.navigation.tooltips.deactivateExtendedSearchMode',
                value: 'Erweiterten Suchmodus deaktivieren'
            })
            : this.i18n({
                id: 'resources.navigation.tooltips.activateExtendedSearchMode',
                value: 'Erweiterten Suchmodus aktivieren'
            });
    }


    public async toggleDisplayHierarchy() {

        if (this.loading.isLoading()) return;

        await this.viewFacade.setExtendedSearchMode(!this.viewFacade.isInExtendedSearchMode());
    }


    public getSegments(): Array<FieldDocument> {

        return !this.viewFacade.isInExtendedSearchMode()
            ? this.navigationPath.segments.map(_ => _.document)
            : [];
    }


    private static getLabels(navigationPath: NavigationPath): NavigationButtonLabelMap {

        const labels: NavigationButtonLabelMap = {};

        navigationPath.segments.forEach(segment => {
            labels[segment.document.resource.id] = {
                text: segment.document.resource.identifier,
                fullText: segment.document.resource.identifier,
                shortened: false
            };
        });

        NavigationComponent.shortenLabelsIfNecessary(labels, navigationPath.selectedSegmentId);

        return labels;
    }


    private static shortenLabelsIfNecessary(labels: NavigationButtonLabelMap,
                                            selectedSegmentId: string|undefined) {

        const totalCharacters: number = this.getTotalLabelCharacterCount(labels);

        if (totalCharacters > this.maxTotalLabelCharacters) {
            const maxSingleLabelCharacters: number
                = this.computeMaxSingleLabelCharacters(labels, selectedSegmentId);

            Object.keys(labels).forEach(id => {
                if (labels[id].text.length > maxSingleLabelCharacters && id !== selectedSegmentId) {
                    labels[id].text = labels[id].text.substring(
                        0, Math.max(0, maxSingleLabelCharacters - 3)
                    ) + '...';
                    labels[id].shortened = true;
                }
            })
        }
    }


    private static getTotalLabelCharacterCount(labels: NavigationButtonLabelMap): number {

        let result: number = 0;
        Object.values(labels).forEach(label => result += label.text.length);

        return result;
    }


    private static computeMaxSingleLabelCharacters(labels: NavigationButtonLabelMap,
                                                   selectedSegmentId: string|undefined): number {

        let maxSingleLabelCharacters: number
            = this.maxTotalLabelCharacters - (selectedSegmentId ? labels[selectedSegmentId].text.length : 0);

        const labelCount: number = Object.keys(labels).length;
        if (labelCount > 1) maxSingleLabelCharacters /= selectedSegmentId ? labelCount - 1 : labelCount;

        return maxSingleLabelCharacters;
    }
}
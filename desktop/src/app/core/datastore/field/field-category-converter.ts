import { Injectable } from '@angular/core';
import { takeOrMake } from 'idai-field-core';
import { Document } from 'idai-field-core';
import { ProjectCategories } from '../../configuration/project-categories';
import { ProjectConfiguration } from '../../configuration/project-configuration';
import { CategoryConverter } from '../cached/category-converter';
import { Migrator } from './migrator';


@Injectable()
/**
 * @author Daniel de Oliveira
 */
export class FieldCategoryConverter extends CategoryConverter<Document> {

    constructor(private projectConfiguration: ProjectConfiguration) {

        super();
    }


    public assertCategoryToBeOfClass(category: string, categoryClass: string): void {

        if (categoryClass === 'ImageDocument') {
            if (!this.projectConfiguration.isSubcategory(category, 'Image')) throw 'Wrong category class: must be ImageDocument';
        } else if (categoryClass === 'FeatureDocument') {
            if (!this.projectConfiguration.isSubcategory(category, 'Feature')) throw 'Wrong category class: must be FeatureDocument';
        } else if (categoryClass === 'FieldDocument') {
            if (this.projectConfiguration.isSubcategory(category, 'Image')) throw 'Wrong category class: must not be ImageDocument';
            // feature documents are allowed to also be field documents
        }
    }


    public getCategoriesForClass(categoryClass: string): string[]|undefined {


        if (categoryClass === 'ImageDocument') {
            return ProjectCategories.getImageCategoryNames(this.projectConfiguration.getCategoryTreelist());
        } else if (categoryClass === 'FeatureDocument') {
            return ProjectCategories.getFeatureCategoryNames(this.projectConfiguration.getCategoryTreelist());
        } else if (categoryClass === 'FieldDocument') {
            return ProjectCategories.getFieldCategoryNames(this.projectConfiguration.getCategoryTreelist());
        } else {
            return undefined;
        }
    }


    public convert<T extends Document>(document: Document): T {

        const convertedDocument: T = Migrator.migrate(document) as T;

        if (this.projectConfiguration.isSubcategory(convertedDocument.resource.category, 'Image')) {
            takeOrMake(convertedDocument, ['resource','identifier'], '');
            takeOrMake(convertedDocument, ['resource','relations','depicts'], []);
        } else {
            takeOrMake(convertedDocument, ['resource','identifier'],'');
            takeOrMake(convertedDocument, ['resource','relations','isRecordedIn'], []);
        }

        return convertedDocument;
    }
}

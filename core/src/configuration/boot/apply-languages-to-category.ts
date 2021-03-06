import { I18nString } from '../../model';
import { LanguageConfiguration } from '../model/language-configuration';
import { LanguageConfigurations } from '../model/language-configurations';


export function applyLanguagesToCategory(languageConfigurations: LanguageConfigurations, 
                                         category: any, 
                                         categoryName: string) {

    category.label = LanguageConfiguration.getI18nString(
        languageConfigurations.complete,
        'categories', categoryName, 'label'
    );
    category.defaultLabel = LanguageConfiguration.getI18nString(
        languageConfigurations.default,
        'categories', categoryName, 'label'
    );
    category.description = LanguageConfiguration.getI18nString(
        languageConfigurations.complete,
        'categories', categoryName, 'description'
    );
    category.defaultDescription = LanguageConfiguration.getI18nString(
        languageConfigurations.default,
        'categories', categoryName, 'description'
    );

    for (const fieldName of Object.keys(category.fields)) {
        const field = category.fields[fieldName];

        field.label = I18nString.mergeI18nStrings(field.label, LanguageConfiguration.getI18nString(
            languageConfigurations.complete, 'commons', fieldName, 'label'
        ));
        field.label = I18nString.mergeI18nStrings(field.label, LanguageConfiguration.getI18nString(
            languageConfigurations.complete, 'categoriesFields', fieldName, 'label', categoryName
        ));
        field.description = I18nString.mergeI18nStrings(field.description, LanguageConfiguration.getI18nString(
            languageConfigurations.complete, 'commons', fieldName, 'description'
        ));
        field.description = I18nString.mergeI18nStrings(field.description, LanguageConfiguration.getI18nString(
            languageConfigurations.complete, 'categoriesFields', fieldName, 'description', categoryName
        ));
        field.defaultLabel = I18nString.mergeI18nStrings(field.defaultLabel, LanguageConfiguration.getI18nString(
            languageConfigurations.default, 'commons', fieldName, 'label'
        ));
        field.defaultLabel = I18nString.mergeI18nStrings(field.defaultLabel, LanguageConfiguration.getI18nString(
            languageConfigurations.default, 'categoriesFields', fieldName, 'label', categoryName
        ));
        field.defaultDescription = I18nString.mergeI18nStrings(field.defaultDescription, LanguageConfiguration.getI18nString(
            languageConfigurations.default, 'commons', fieldName, 'description'
        ));
        field.defaultDescription = I18nString.mergeI18nStrings(field.defaultDescription, LanguageConfiguration.getI18nString(
            languageConfigurations.default, 'categoriesFields', fieldName, 'description', categoryName
        ));
    }
}
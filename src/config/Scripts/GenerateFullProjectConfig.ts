import {to, zip} from 'tsfun';
import {clone} from 'tsfun/struct';
import {AppConfigurator} from '../../app/core/configuration/app-configurator';
import {ConfigLoader} from '../../app/core/configuration/boot/config-loader';
import {ProjectConfiguration} from '../../app/core/configuration/project-configuration';
import {mapTreeList, TreeList, zipTreeList} from '../../app/core/util/tree-list';
import {Category} from '../../app/core/configuration/model/category';
import {PROJECT_MAPPING} from '../../app/core/settings/settings-service';
import {Group} from '../../app/core/configuration/model/group';
import {FieldDefinition} from '../../app/core/configuration/model/field-definition';

const fs = require('fs');


const CONFIG_DIR_PATH = 'src/config';
const OUTPUT_DIR_PATH = 'release';
const LOCALES = ['de', 'en'];

if (!fs.existsSync(OUTPUT_DIR_PATH)) fs.mkdirSync(OUTPUT_DIR_PATH);
if (!fs.existsSync(OUTPUT_DIR_PATH + '/config')) fs.mkdirSync(OUTPUT_DIR_PATH + '/config');


class ConfigReader {

    public async read(path: string): Promise<any> {
        return Promise.resolve(JSON.parse(fs.readFileSync(path)));
    }
}


function writeProjectConfiguration(fullProjectConfiguration: any, project: string) {

    fs.writeFileSync(
        `${OUTPUT_DIR_PATH}/config/${project}.json`,
        JSON.stringify(fullProjectConfiguration,null, 2)
    );
}


function getTreeList(projectConfiguration: ProjectConfiguration) {

    return mapTreeList((category: Category) => {

        delete category.children;
        delete category.parentCategory;
        return category;
    }, projectConfiguration.getCategoryTreelist());
}


const mergeCategories = (locales: string[]) => (categories: Array<Category>) => {

    const result: any = clone(categories[0]);

    result.label = {};
    result.description = {};
    for (let i = 0; i < locales.length; i++) {
        result.label[locales[i]] = categories[i].label;
        if (categories[i].description) result.description[locales[i]] = categories[i].description;
    }

    result.groups = mergeLayer(mergeGroup, locales, categories.map(to('groups')));
    return result as Category;
};


function mergeLayer(merge: any, locales: string[], localizedItems: Array<any>) {

    // TODO Generalize
    return zip(localizedItems[0])(localizedItems[1]).map(item => merge(locales, item));
}


function mergeGroup(locales: string[], localizedGroups: Array<Group>) {

    const result: any = clone(localizedGroups[0]);

    result.label = {};
    for (let i = 0; i < locales.length; i++) {
        result.label[locales[i]] = localizedGroups[i].label;
    }

    result.fields = mergeLayer(mergeField, locales, localizedGroups.map(to('fields')));
    result.relations = mergeLayer(mergeField, locales, localizedGroups.map(to('relations')));

    return result as Group;
}


function mergeField(locales: string[], localizedFields: Array<any>) {

    const result: any = clone(localizedFields[0]);

    result.label = {};
    result.description = {};
    for (let i = 0; i < locales.length; i++) {
        result.label[locales[i]] = localizedFields[i].label;
        if (localizedFields[i].description) result.description[locales[i]] = localizedFields[i].description;
    }

    return result as FieldDefinition;
}


async function start() {

    for (const [projectName, configName] of Object.entries(PROJECT_MAPPING)) {
        console.log('');
        const localizedTreeLists: { [locale: string]: TreeList<Category>} = {};
        for (const locale of LOCALES) {
            const appConfigurator = new AppConfigurator(new ConfigLoader(new ConfigReader() as any));
            try {
                localizedTreeLists[locale] = getTreeList(await appConfigurator.go(CONFIG_DIR_PATH, configName, locale));
            } catch (err) {
                console.error(`Error while trying to generate full configuration for project ${projectName} and locale ${locale}:`, err);
            }
        }

        const fullConfiguration = zipTreeList(mergeCategories(LOCALES), Object.values(localizedTreeLists) as any);
        writeProjectConfiguration(fullConfiguration, projectName);
    }
}


start().then(() => {
    console.log('\nFinished generating configuration files.');
});
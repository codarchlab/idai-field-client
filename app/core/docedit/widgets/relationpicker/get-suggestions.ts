import {Document, Resource, ReadDatastore, Query, Constraint} from 'idai-components-2';
import {RelationDefinition} from '../../../configuration/model/relation-definition';

export const MAX_SUGGESTIONS: number = 5;


/**
 * @author Thomas Kleinke
 */
export async function getSuggestions(datastore: ReadDatastore, resource: Resource,
                                     relationDefinition: RelationDefinition,
                                     idSearchString?: string): Promise<Array<Document>> {

    return (await datastore.find(
        makeQuery(resource, relationDefinition, idSearchString)
    )).documents;
}


function makeQuery(resource: Resource, relationDefinition: RelationDefinition,
                   idSearchString?: string): Query {

    return {
        q: idSearchString ? idSearchString : '',
        types: relationDefinition.range,
        constraints: makeConstraints(resource, relationDefinition),
        limit: MAX_SUGGESTIONS,
        sort: { mode: 'exactMatchFirst' }
    };
}


function makeConstraints(resource: Resource,
                         relationDefinition: RelationDefinition): { [constraintName: string]: Constraint } {

    const constraints = {
        'id:match': {
            value: getForbiddenIds(resource, relationDefinition),
            type: 'subtract'
        }
    };

    if (relationDefinition.sameMainTypeResource
            && Resource.hasRelations(resource, 'isRecordedIn')) {
        (constraints as any)['isRecordedIn:contain'] = resource.relations['isRecordedIn'][0];
    }

    return constraints;
}


/**
 * Get ids of resources not suitable for suggestions:
 *      - The resource itself
 *      - Resources which are already targets of the relation
 *      - Resources which are targets of the inverse relation
 */
function getForbiddenIds(resource: Resource, relationDefinition: RelationDefinition): string[] {

    let ids: string[] = [resource.id]
        .concat(resource.relations[relationDefinition.name])
        .filter((id: string) => id && id.length > 0);

    if (relationDefinition.inverse && relationDefinition.name !== relationDefinition.inverse
            && Resource.hasRelations(resource, relationDefinition.inverse)) {
        ids = ids.concat(resource.relations[relationDefinition.inverse])
    }

    return ids;
}

import {assoc, union, dissoc, equal, takeRight, to, cond, is, isEmpty, getOnOr,
    flow, compose, len, val} from 'tsfun';
import {Resource} from 'idai-components-2';
import {withDissoc} from '../../import/util';
import {CAMPAIGNS, last, replaceLastPair, STAFF} from './helpers';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export module ProjectResourceConflictResolution {

    const constantProjectFields = ['id', 'relations', 'type', 'identifier'];


    /**
     * @param resources ordered by time ascending
     *   expected to be of at least length 2.
     *
     * @returns a resolved resource and the positions of the resources that have been used to do this.
     *
     */
    export function solveProjectResourceConflicts(resources: Array<Resource>): [Resource, number[]] {

        if (resources.length < 2) throw 'FATAL - illegal argument - resources must have length 2';

        const [collapsed, indicesOfUsedResources] = collapse(resources, []);
        return [collapsed[0], indicesOfUsedResources.reverse()];
    }


    function collapse(resources: Array<Resource>, indicesOfUsedResources: number[]): [Array<Resource>, number[]] {

        if (resources.length < 2) return [resources, indicesOfUsedResources];

        const ultimate = last(resources);
        const penultimate = getPenultimate(resources);

        const resolved = solveConflictBetween2ProjectDocuments(penultimate, ultimate);
        return resolved !== NONE
            ? replaceLastTwoThenCollapseRest(resources, resolved, indicesOfUsedResources.concat(resources.length - 2))
            : replaceLastTwoThenCollapseRest(resources, ultimate, indicesOfUsedResources);
    }


    function replaceLastTwoThenCollapseRest(resources: Array<Resource>, replacement: Resource, indices: number[]) {

        return collapse(replaceLastPair(resources, replacement), indices);
    }


    function solveConflictBetween2ProjectDocuments(left: Resource, right: Resource) {

        if (equal(left)(right)) return left;

        const l = withoutConstantProjectFields(left);
        const r = withoutConstantProjectFields(right);

        if      (isEmpty(l)) return right;
        else if (isEmpty(r)) return left;

        if (equal(withoutStaffAndCampaigns(l))(withoutStaffAndCampaigns(r))) {
            const lCampaigns = getOnOr(CAMPAIGNS, [])(l);
            const rCampaigns = getOnOr(CAMPAIGNS, [])(r);
            const lStaff = getOnOr(STAFF, [])(l);
            const rStaff = getOnOr(STAFF, [])(r);
            return flow(left,
                assoc(STAFF, union([lStaff, rStaff])),
                assoc(CAMPAIGNS, union([lCampaigns, rCampaigns])));
        }
        return NONE;
    }


    const withoutConstantProjectFields = (resource: Resource) => constantProjectFields.reduce(withDissoc, resource);


    const withoutStaffAndCampaigns = compose(dissoc(STAFF), dissoc(CAMPAIGNS));


    const lengthIs2 = compose(len, is(2));


    /**
     * Gets the penultimate of an Array of A's, if it exists.
     * @returns A|undefined
     */
    const getPenultimate = compose(
        takeRight(2),
        cond(
            lengthIs2,
            to('[0]'),
            val(undefined)));


    const NONE = undefined;
}
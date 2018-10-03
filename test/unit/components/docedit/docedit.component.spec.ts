/**
 * @author Daniel de Oliveira
 */
import {DoceditComponent} from '../../../../app/components/docedit/docedit.component';
import {DoceditActiveTabService} from '../../../../app/components/docedit/docedit-active-tab-service';

describe('DoceditComponent', () => {

    let activeTabService: any;
    let docedit: any;


    beforeEach(() => {

        const typeUtility = jasmine.createSpyObj('typeUtility', ['getSubtypes']);
        typeUtility.getSubtypes.and.returnValue({'Object':[]});
        const documentHolder = jasmine.createSpyObj('documentHolder', ['setClonedDocument', 'getClonedDocument']);
        const projectConfiguration = jasmine.createSpyObj('projectConfiguration', ['getFieldDefinitionLabel']);
        activeTabService = new DoceditActiveTabService();

        docedit = new DoceditComponent(
            undefined,
            undefined,
            documentHolder,
            undefined,
            undefined,
            typeUtility,
            activeTabService,
            projectConfiguration,
            undefined
        );
    });


    it('open last open tab', () => {

        activeTabService.setActiveTab('relations');

        docedit.setDocument({
            resource: {
                type: 'Object',
                id: '1',
                relations: {}
            }
        });

        expect(activeTabService.getActiveTab()).toEqual('relations');
    });


    it('open fields tab on new document', () => {

        activeTabService.setActiveTab('relations');

        docedit.setDocument({
            resource: {
                type: 'Object',
                // no id -> new
                relations: {}
            }
        });

        expect(activeTabService.getActiveTab()).toEqual('fields');
    });
});
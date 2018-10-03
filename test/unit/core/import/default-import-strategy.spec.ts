import {DefaultImportStrategy} from '../../../../app/core/import/default-import-strategy';

/**
 * @author Daniel de Oliveira
 */
describe('DefaultImportStrategy', () => {

    let mockDatastore;
    let mockValidator;
    let mockTypeUtility;
    let importStrategy: DefaultImportStrategy;


    beforeEach(() => {

        mockDatastore = jasmine.createSpyObj('datastore', ['create', 'update', 'get', 'find']);
        mockValidator = jasmine.createSpyObj('validator', ['validate']);
        mockTypeUtility = jasmine.createSpyObj('typeUtility', ['isSubtype']);

        mockValidator.validate.and.returnValue(Promise.resolve());
        mockDatastore.create.and.callFake((a) => Promise.resolve(a));
        mockDatastore.find.and.returnValue(Promise.resolve({ totalCount: 0 }));

        importStrategy = new DefaultImportStrategy(
            mockTypeUtility,
            mockValidator,
            mockDatastore,
            null,
            'user1');
    });


    it('should resolve on success', async done => {

        await importStrategy.importDoc(
            { resource: {type: undefined, id: undefined, relations: undefined } });

        expect(mockDatastore.create).toHaveBeenCalled();
        done();
    });


    it('merge if exists', async done => {

        mockValidator.validate.and.returnValue(Promise.resolve(undefined));
        mockDatastore.find.and.returnValue(Promise.resolve({
            totalCount: 1,
            documents: [{resource: {identifier: '123', id: '1'}}]
        }));

        await new DefaultImportStrategy(
            mockTypeUtility,
            mockValidator,
            mockDatastore,
            null,
            'user1',
            true).importDoc(
            { resource: {type: undefined, id: '1', relations: undefined } });

        expect(mockDatastore.create).not.toHaveBeenCalled();
        expect(mockDatastore.update).toHaveBeenCalled();
        done();
    });


    it('does not overwrite if exists', async done => {

        mockDatastore.get.and.returnValue(Promise.resolve({}));

        await new DefaultImportStrategy(
            mockTypeUtility,
            mockValidator,
            mockDatastore,
            null,
            'user1',
            false).importDoc(
            { resource: {type: undefined, id: undefined, relations: undefined } });

        expect(mockDatastore.create).toHaveBeenCalled();
        expect(mockDatastore.update).not.toHaveBeenCalled();
        done();
    });



    it('should reject on err in validator', async done => {

        mockValidator.validate.and.returnValue(Promise.reject(['abc']));

        try {
            await importStrategy.importDoc(
                {resource: {type: undefined, id: undefined, relations: undefined}});
            fail();
        } catch (err) {
            expect(err[0]).toBe('abc');
        }
        done();
    });


    it('should reject on err in datastore', async done => {

        mockDatastore.create.and.returnValue(Promise.reject(['abc']));

        try {
            await importStrategy.importDoc(
                {resource: {type: undefined, id: undefined, relations: undefined}});
            fail();
        } catch (err) {
            expect(err[0]).toBe('abc');
        }
        done();
    });
});
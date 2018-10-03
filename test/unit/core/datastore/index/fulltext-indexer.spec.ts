import {FulltextIndexer} from '../../../../../app/core/datastore/index/fulltext-indexer';
import {IndexItem} from '../../../../../app/core/datastore/index/index-item';
import {Static} from '../../../static';

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('FulltextIndexer', () => {

    let fi;
    let projectConfiguration;


    function doc(id, identifier, type, shortDescription = 'short') {

        const doc = Static.doc(shortDescription, identifier, type, id);
        doc.created = { date: '2017-12-31' } as any;
        doc.modified = [{ date: '2018-01-01' }] as any;
        return doc;
    }


    function indexItem(id, identifier?): IndexItem {

        if (!identifier) identifier = 'identifier' + id;
        return {
            id: id,
            date: ('2018-01-01' as any),
            identifier: identifier
        };
    }


    beforeAll(() => {

        projectConfiguration = jasmine.createSpyObj('projectConfiguration',
            ['getTypesMap']);
    });


    beforeEach(() => {

        fi = new FulltextIndexer(projectConfiguration, false);

        const defaultTypeConfiguration = {
            fields: [
                { name: 'identifier' },
                { name: 'shortDescription' }
            ]
        };

        projectConfiguration.getTypesMap.and.returnValue({
            type: defaultTypeConfiguration,
            type1: defaultTypeConfiguration,
            type2: defaultTypeConfiguration,
            type3: defaultTypeConfiguration
        });
    });


    it('match one with different search terms', () => {

        fi.put(doc('1', 'identifier1', 'type'));
        expect(fi.get('identifier1', ['type'])).toEqual([indexItem('1')]);
        expect(fi.get('ide', ['type'])).toEqual([indexItem('1')]);
    });


    it('match two with the same search term', () => {

        fi.put(doc('1', 'identifier1', 'type'));
        fi.put(doc('2', 'identifier2', 'type'));
        expect(fi.get('identifier', ['type'])).toEqual([indexItem('1'), indexItem('2')]);
    });


    it('match in all types', () => {

        fi.put(doc('1', 'identifier1', 'type'));
        expect(fi.get('identifier', undefined)).toEqual([indexItem('1')]);
    });


    it('index short description', () => {

        const d = doc('1', 'identifier1', 'type', 'short');

        fi.put(d);
        expect(fi.get('short', undefined)).toEqual([indexItem('1')]);
    });


    it('do not index if no identifier', () => { // tests interaction with IndexItem

        const d = doc('1', 'identifier1', 'type', 'short');
        delete d.resource.identifier;

        fi.put(d);
        expect(fi.get('short', undefined)).toEqual([]);
    });


    it('do not index if no created and modified', () => { // tests interaction with IndexItem

        const d = doc('1', 'identifier1', 'type', 'short');
        delete d.modified;
        delete d.created;

        fi.put(d);
        expect(fi.get('short', undefined)).toEqual([]);
    });


    it('match in multiple selected types', () => {

        fi.put(doc('1', 'identifier1', 'type1'));
        fi.put(doc('2', 'identifier2', 'type2'));
        fi.put(doc('3', 'identifier3', 'type3'));
        expect(fi.get('identifier', ['type1', 'type2'])).toEqual([indexItem('1'), indexItem('2')]);
    });


    it('do not match search term', () => {

        fi.put(doc('1', 'iden', 'type'));
        expect(fi.get('identifier', ['type'])).toEqual([]);
    });


    it('do not match search in type', () => {

        fi.put(doc('1', 'iden', 'type1'));
        expect(fi.get('identifier', ['type2'])).toEqual([]);
    });


    it('match one with two search terms', () => {

        fi.put(doc('1', 'identifier1', 'type', 'a short description'));
        expect(fi.get('short description', ['type'])).toEqual([indexItem('1')]);
        expect(fi.get('a description', ['type'])).toEqual([indexItem('1')]);
    });


    it('ignore additional spaces and hyphens', () => {

        fi.put(doc('1', 'identifier1', 'type', 'a short description'));
        expect(fi.get(' a    short  description  ', ['type'])).toEqual([indexItem('1')]);
        expect(fi.get('-a----short--description--', ['type'])).toEqual([indexItem('1')]);
    });


    it('no types present', () => {

        expect(fi.get('identifier', ['type'])).toEqual([]);
    });


    it('clear', () => {

        fi.put(doc('1', 'identifier1', 'type'));
        fi.clear();
        expect(fi.get('identifier', ['type'])).toEqual([]);
    });


    it('remove', () => {

        const d = doc('1', 'identifier1', 'type');
        fi.put(d);
        fi.remove(d);
        expect(fi.get('identifier', ['type'])).toEqual([]);
    });


    it('search *', () => {

        fi.put(doc('1', 'identifier1', 'type'));
        expect(fi.get('*', ['type'])).toEqual([indexItem('1')]);
    });


    it('index other field', () => {

        const d = doc('1', 'identifier1', 'type');
        fi.put(d);
        expect(fi.get('short', ['type'])).toEqual([indexItem('1')]);
    });


    it('tokenize fields', () => {

        fi.put(doc('1', 'hello token', 'type'));
        fi.put(doc('2', 'another-one', 'type'));
        expect(fi.get('hello', ['type'])).toEqual([indexItem('1','hello token')]);
        expect(fi.get('token', ['type'])).toEqual([indexItem('1','hello token')]);
        expect(fi.get('another', ['type'])).toEqual([indexItem('2','another-one')]);
        expect(fi.get('one', ['type'])).toEqual([indexItem('2','another-one')]);
    });


    it('find case insensitive', () => {

        fi.put(doc('1', 'Hello', 'type'));
        fi.put(doc('2', 'something', 'type'));
        expect(fi.get('hello', ['type'])).toEqual([indexItem('1','Hello')]);
        expect(fi.get('Something', ['type'])).toEqual([indexItem('2','something')]);
    });


    it('put overwrite', () => {

        const d = doc('1', 'identifier1', 'type');
        fi.put(d);
        d['resource']['identifier'] = 'identifier2';
        fi.put(d);
        expect(fi.get('identifier1', ['type'])).toEqual([]);
        expect(fi.get('identifier2', ['type'])).toEqual([indexItem('1','identifier2')]);
    });


    it('shortDescription empty', () => {

        const d = doc('1', 'identifier1', 'type');
        d['resource']['shortDescription'] = '';
        expect(fi.get('short', ['type'])).toEqual([]);
        fi.put(d);
        d['resource']['shortDescription'] = undefined;
        fi.put(d);
        expect(fi.get('short', ['type'])).toEqual([]);
        delete d['resource']['shortDescription'];
        fi.put(d);
        expect(fi.get('short', ['type'])).toEqual([]);
    });


    it('do a placeholder search', () => {

        fi.put(doc('1', 'Hello-A-0033', 'type'));
        fi.put(doc('2', 'Hello-A-0021', 'type'));
        fi.put(doc('3', 'Hello-A-0059', 'type'));

        const results = fi.get('Hello-A-00[23]', ['type']).map(result => result.identifier);
        expect(results.length).toBe(2);

        expect(results).toContain('Hello-A-0033');
        expect(results).toContain('Hello-A-0021');
    });


    it('index field specified in search configuration', () => {

       projectConfiguration.getTypesMap.and.returnValue({
            type: {
                fields: [
                    { name: 'identifier' },
                    { name: 'shortDescription' },
                    { name: 'customField', fulltextIndexed: true }
                ]
            }
        });

        const document = doc('1', 'identifier1', 'type');
        document.resource.customField = 'testValue';
        fi.put(document);

        const results = fi.get('testValue', ['type']).map(result => result.identifier);
        expect(results.length).toBe(1);
        expect(results[0]).toEqual('identifier1');
    });
});
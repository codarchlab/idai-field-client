import {Observable, Observer} from 'rxjs';
import {Document} from 'idai-components-2';
import {ParserErrors} from './parser-errors';
// import * as Papa from 'papaparse'; this does not work in production, fixes only unit test

/**
 * @author Daniel de Oliveira
 */
export module MeninxFindCsvParser {

    export function parse(content: string): Observable<Document> {

        return Observable.create((observer: Observer<Document>) => {

            let errorCallback = (e: any) => observer.error([ParserErrors.CSV_INVALID, e.row]);

            let completeCallback = (result: any) => {
                result.errors.forEach( (e: any) => errorCallback(e) );
                result.data.forEach( (object: any, i:any) => {


                    if (object.se
                        && object.se.length === 4
                        && object.id) {

                        observer.next({
                            resource: {
                                identifier: object.se + '-' + object.id,
                                shortDescription: object.category,
                                vesselForm: object.form,
                                typeNumber: object.type,
                                sherdTypeCheck: object.state,
                                amount: object.nbr,
                                decorationTechnique: object.Decor,
                                comment: object.comment,
                                provenance: object.provenience,
                                type: 'Pottery',
                                relations: {
                                    liesWithin: [
                                        object.se
                                    ]
                                }
                            }
                        } as any);

                    } else {/* skip doc with no id (or no se) */}

                });
                observer.complete();
            };

            try {
                Papa.parse(content, {
                    header: true,
                    skipEmptyLines: true,
                    worker: true,
                    error: errorCallback,
                    complete: completeCallback
                });
            } catch (e) {
                observer.error([ParserErrors.CSV_GENERIC]);
            }
        });
    }
}

import {Injectable} from "@angular/core";
import {Observable} from "rxjs/Observable";
import {Parser, ParserResult} from "./parser";
import {JsonlParser} from "./jsonl-parser";

@Injectable()
/**
 * @author Sebastian Cuy
 * @author Jan G. Wieners
 */
export class NativeJsonlParser extends JsonlParser implements Parser {

    public parse(content: string): Observable<ParserResult> {

        return Observable.create(observer => {
            JsonlParser.parseContent(content,observer,NativeJsonlParser.makeDoc);
            observer.complete();
        });
    }

    private static makeDoc(line) {
        let resource = JSON.parse(line);
        if (!resource.relations) resource.relations = {};
        return {
            document: {resource: resource},
            messages: []
        };
    }
}
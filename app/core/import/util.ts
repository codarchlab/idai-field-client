import {ObjectCollection, reduce, dissoc, getOn} from 'tsfun';


/**
 * @author Daniel de Oliveira
 */
export const makeLookup = (path: string) => {

    return <A>(as: Array<A>): ObjectCollection<A> => {

        return reduce((amap: {[_:string]: A}, a: A) => {

            amap[getOn(path)(a)] = a;
            return amap;

        }, {})(as);
    }
};


export function withDissoc(struct: any, path: string) {

   return dissoc(path)(struct);
}
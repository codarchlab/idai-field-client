import {Mapping, Predicate, isFunction, first, isNumber, rest, isObject, isArray, Pair, to, Path, is} from 'tsfun';
import {Comparator} from 'tsfun/by';
import {Named} from './named';


export type Tree<T = any> = {
    item: T,
    trees: Treelist<T>
}

export type Treelist<T = any> = Array<Tree<T>>;

export module Tree {

    export const ITEM = 'item';
    export const TREES = 'trees';
}

export const ITEMPATH: Path = [Tree.ITEM];

export const ITEMNAMEPATH: Path = [Tree.ITEM, Named.NAME];

export const toTreeItem = to(ITEMPATH);

// Implementation note:
// Technically it would be no problem to have only a function mapTree
// (making mapTreelist superfluous) which maps both Tree and Treelist.
// But the two argument list version would then return Mapping<Tree|Treelist>
// which would then lead to the problem that we needed to disambiguate typewise
// in flows, which we want to avoid  (same consideration which in tsfun led
// to having various packages containing various functions versions).

export function mapTreelist<A,B>(f: Mapping<A,B>, t: Treelist<A>): Treelist<B>;
export function mapTreelist<A,B>(f: Mapping<A,B>): Mapping<Treelist<A>,Treelist<B>>;
export function mapTreelist(...args: any[]): any {

    const $ = (f: any) => (treelist: any) => {

        const replacement = [];
        for (let { item: t, trees: tree} of treelist) {
            replacement.push({ item: f(t), trees: mapTreelist(f, tree)});
        }
        return replacement;
    }

    return args.length === 2
        ? $(args[0])(args[1])
        : $(args[0])
}


export function mapTree<A,B>(f: Mapping<A,B>, t: Tree<A>): Tree<B>;
export function mapTree<A,B>(f: Mapping<A,B>): Mapping<Tree<A>,Tree<B>>;
export function mapTree(...args: any[]): any {

    const $ = (f: any) => (tree: any) => {

        return {
            item: f(tree.item),
            trees: mapTreelist(f, tree.trees)
        };
    }

    return args.length === 2
        ? $(args[0])(args[1])
        : $(args[0])
}


export function accessTree<T>(t: Treelist<T>|Tree<T>, ...path: number[]): T {

    function _accessTree<T>(t: Tree<T>, path: number[]): T {

        const segment = first(path);
        if (segment === undefined) return t.item;
        else if (isNumber(segment)) return _accessTree(t.trees[segment], rest(path));
        return _accessTreelist(t.trees, path);
    }

    function _accessTreelist<T>(t: Treelist<T>, path: number[]) {

        const segment = first(path);
        if (!isNumber(segment)) return t[0] as any;
        return _accessTree(t[segment], rest(path));
    }

    return (isObject(t)
        ? _accessTree
        : _accessTreelist as any)(t as Tree<T>, path);
}


export function mapTrees<T>(f: Mapping<Treelist<T>>, t: Treelist<T>): Treelist<T> {

    return f(t).map(({ item: t, trees: children }) => ({ item: t, trees: mapTrees(f, children)}));
}


export function flattenTree<A>(t: Tree<A>|Treelist<A>): Array<A> {

    const reduced = ((isArray(t) ? t : (t as Tree<A>).trees) as Treelist<A>)
        .reduce((as, { item: a, trees: children }) => as.concat([a]).concat(flattenTree(children)), []);

    return (isArray(t) ? [] : [(t as Tree<A>).item]).concat(reduced);
}


export function findInTree<T>(t: Treelist<T>|Tree<T>,
                              match: T|Predicate<T>,
                              comparator?: Comparator): Tree<T>|undefined {

    if (isObject(t)) return findInTree([t as any], match, comparator);

    for (let node of t) {
        const { item: t, trees: trees } = node;

        const matches: Predicate<T> = buildMatches(match, comparator);
        if (matches(t)) return node;

        const findResult = findInTree(trees, match, comparator);
        if (findResult) return findResult;
    }
    return undefined;
}


function buildMatches<T>(match: T|Predicate<T>, comparator?: Comparator): Predicate<T> {

    return comparator !== undefined
        ? comparator(match)
        : isFunction(match)
            ? (match as Predicate<T>)
            : is(match);
}


// ArrayTree and ArrayTreelist data structures //////
//
// In contrast to our Tree and Treelist data structures
// this structure does not allow for distinguishing trees and
// treelists on the javascript level by virtue of them being either
// objects or arrays.
// However, this version reads much nicer and we use it to instantiate
// our trees in all tests. The builder functions also provides an indirection
// which protects the test code from possible changes to the tree data structure.

export type Node<ITEM,TREES> = Pair<ITEM,TREES>;

export type ArrayTree<T = any> = Node<T, ArrayTreelist<T>>;

export type ArrayTreelist<T = any> = Array<ArrayTree<T>>;

export function buildTreelist<T>(t: ArrayTreelist<T>): Treelist<T> {

    return t.map(([t,trees]) => ({ item: t, trees: buildTreelist(trees)}));
}

export function buildTree<T>([item, children]: ArrayTree<T>): Tree<T> {

    return {
        item: item,
        trees: children.map(([t,trees]) => ({ item: t, trees: buildTreelist(trees)}))
    };
}
import { Document, ProjectCategories, ProjectConfiguration, Query } from 'idai-field-core';
import { useEffect, useState } from 'react';
import { dropRight, last } from 'tsfun';
import { DocumentRepository } from '../repositories/document-repository';
import useSearch from './use-search';


interface ProjectData {
    documents: Document[];
    hierarchyPath: Document[];
    pushToHierarchy: (doc: Document) => void;
    popFromHierarchy: () => void;
    isInOverview: () => boolean;
}


const useProjectData = (
    config: ProjectConfiguration,
    repository: DocumentRepository,
    q: string
): ProjectData => {

    const [query, setQuery] = useState<Query>({
        categories: ProjectCategories.getOperationCategoryNames(config.getCategoryForest()),
        constraints: {}
    });
    const documents = useSearch(repository, query);
    const [hierarchyPath, setHierarchyPath] = useState<Document[]>([]);

    const pushToHierarchy = (doc: Document) => setHierarchyPath(old => [...old, doc]);
    const popFromHierarchy = () => setHierarchyPath(old => dropRight(1, old));
    const isInOverview = () => !hierarchyPath.length;

    useEffect(() => {

        const operationCategories = ProjectCategories.getOperationCategoryNames(config.getCategoryForest());
        const concreteCategories = ProjectCategories.getConcreteFieldCategoryNames(config.getCategoryForest());
        
        if (q) {
            setQuery({ q, categories: concreteCategories });
        } else {
            const currentParent = last(hierarchyPath);
            if (currentParent) {
                if (operationCategories.includes(currentParent.resource.category)) {
                    setQuery({ constraints: {
                        'isRecordedIn:contain': currentParent.resource.id,
                        'liesWithin:exist': 'UNKNOWN'
                    } });
                } else {
                    setQuery({ constraints: { 'liesWithin:contain': currentParent.resource.id } });
                }
            } else {
                setQuery({ categories: operationCategories });
            }
        }
    }, [config, q, hierarchyPath]);

    return {
        documents,
        hierarchyPath,
        pushToHierarchy,
        popFromHierarchy,
        isInOverview
    };
};

export default useProjectData;

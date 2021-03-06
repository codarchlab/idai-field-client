import { PouchdbManager, ProjectConfiguration } from 'idai-field-core';
import { useEffect, useState } from 'react';
import loadConfiguration from '../services/config/load-configuration';

const useConfiguration = (
    project: string,
    languages: string[],
    username: string,
    pouchdbManager: PouchdbManager | undefined,
): ProjectConfiguration | undefined => {

    const [config, setConfig] = useState<ProjectConfiguration>();

    useEffect(() => {

        if (!pouchdbManager || !pouchdbManager.open || !project) return;
        
        loadConfiguration(pouchdbManager, project, languages, username)
            .then(setConfig);
    }, [pouchdbManager, pouchdbManager?.open, project, languages, username]);

    return config;
};

export default useConfiguration;

export interface SyncTarget {

    address: string;
    password: string;
}


export interface Settings {

    locale: string;
    isAutoUpdateActive: boolean;
    isSyncActive: boolean;
    remoteSites: Array<string>;
    hostPassword: string;
    syncTarget: SyncTarget;
    username: string;
    dbs: Array<string>;
    imagestorePath: string;
}
import {Injectable} from '@angular/core';
import {FieldDocument, ImageDocument} from 'idai-components-2';
import {ImageOverviewFacade} from '../view/imageoverview-facade';
import {PersistenceManager} from '../../../../core/model/persistence-manager';
import {UsernameProvider} from '../../../../core/settings/username-provider';
import {M} from '../../../m';
import {clone} from '../../../../core/util/object-util';
import {Imagestore} from '../../../../core/images/imagestore/imagestore';


@Injectable()
/**
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 */
export class PersistenceHelper {

    constructor(
        private imageOverviewFacade: ImageOverviewFacade,
        private persistenceManager: PersistenceManager,
        private usernameProvider: UsernameProvider,
        private imagestore: Imagestore
    ) {}


    public async deleteSelectedImageDocuments() {

        if (!this.imagestore.getPath()) throw [M.IMAGESTORE_ERROR_INVALID_PATH_DELETE];

        for (let document of this.imageOverviewFacade.getSelected()) {
            if (!document.resource.id) continue;
            const resourceId: string = document.resource.id;

            try {
                await this.imagestore.remove(resourceId);
            } catch (err) {
                throw [M.IMAGESTORE_ERROR_DELETE, document.resource.identifier];
            }

            await this.persistenceManager.remove(document, this.usernameProvider.getUsername());
            this.imageOverviewFacade.remove(document);
        }
    }


    public async addDepictsRelationsToSelectedDocuments(targetDocument: FieldDocument) {

        for (let imageDocument of this.imageOverviewFacade.getSelected()) {
            const oldVersion: ImageDocument = clone(imageDocument);
            const depictsRelations: string[] = imageDocument.resource.relations.depicts;

            if (depictsRelations.indexOf(targetDocument.resource.id) === -1) {
                depictsRelations.push(targetDocument.resource.id);
            }

            await this.persistenceManager.persist(
                imageDocument, this.usernameProvider.getUsername(), oldVersion
            );
        }
    }


    public async removeDepictsRelationsOnSelectedDocuments() {

        for (let document of this.imageOverviewFacade.getSelected()) {
            const oldVersion: ImageDocument = clone(document);
            document.resource.relations.depicts = [];

            await this.persistenceManager.persist(
                document, this.usernameProvider.getUsername(), oldVersion
            );
        }
    }
}
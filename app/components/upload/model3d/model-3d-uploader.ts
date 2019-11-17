import {Injectable} from '@angular/core';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {Document} from 'idai-components-2';
import {SettingsService} from '../../../core/settings/settings-service';
import {UploadStatus} from '../upload-status';
import {PersistenceManager} from '../../../core/model/persistence-manager';
import {DocumentReadDatastore} from '../../../core/datastore/document-read-datastore';
import {Uploader} from '../uploader';
import {IdaiField3DDocument} from '../../../core/model/idai-field-3d-document';
import {Model3DThumbnailCreatorModalComponent} from './model-3d-thumbnail-creator-modal.component';
import {Model3DStore} from '../../core-3d/model-3d-store';
import {ProjectConfiguration} from '../../../core/configuration/project-configuration';
import {IdaiType} from '../../../core/configuration/model/idai-type';


@Injectable()
/**
 * @author Thomas Kleinke
 */
export class Model3DUploader extends Uploader {

    public static readonly supportedFileTypes: Array<string> = ['dae'];


    public constructor(
        private model3DStore: Model3DStore,
        private persistenceManager: PersistenceManager,
        private projectConfiguration: ProjectConfiguration,
        private settingsService: SettingsService,
        modalService: NgbModal,
        datastore: DocumentReadDatastore,
        uploadStatus: UploadStatus
    ) {
        super(modalService, datastore, uploadStatus);
    }


    protected async determineType(fileCount: number, relationTarget?: Document): Promise<IdaiType> {

        return this.projectConfiguration.getTypesMap()['Model3D'];
    }


    protected async uploadFile(file: File, type: IdaiType, relationTarget?: Document): Promise<any> {

        const document: IdaiField3DDocument = await this.create3DDocument(file, type);
        await this.model3DStore.save(file, document);

        const {blob, width, height} = await this.createThumbnail(document);
        const updatedDocument: IdaiField3DDocument = await this.complete(document, width, height,
            relationTarget);
        await this.model3DStore.saveThumbnail(updatedDocument, blob);
        await this.datastore.get(updatedDocument.resource.id);
    }


    private createThumbnail(document: IdaiField3DDocument)
            : Promise<{ blob: Blob|null, width: number, height: number }> {

        const modal: NgbModalRef = this.modalService.open(Model3DThumbnailCreatorModalComponent,
            {
                backdrop: 'static',
                keyboard: false,
                size: 'lg',
                windowClass: 'thumbnail-creator-modal'
            }
        );

        modal.componentInstance.document = document;

        return modal.result.then(
            result => Promise.resolve(result),
            closeReason => Promise.resolve({})
        );
    }


    private async create3DDocument(file: File, type: IdaiType): Promise<IdaiField3DDocument> {

        const document: any = {
            resource: {
                identifier: this.getIdentifier(file.name),
                shortDescription: '',
                type: type.name,
                georeferenced: false,
                originalFilename: file.name,
                thumbnailWidth: 0,
                thumbnailHeight: 0,
                relations: {
                    depicts: []
                }
            }
        };

        return this.persistenceManager.persist(document, this.settingsService.getUsername(), document) as any;
    }


    private async complete(document: IdaiField3DDocument, width: number, height: number,
                           relationTarget?: Document): Promise<any> {

        document.resource.thumbnailWidth = width;
        document.resource.thumbnailHeight = height;

        if (relationTarget && relationTarget.resource.id) {
            document.resource.relations.depicts = [relationTarget.resource.id];
        }

        return this.persistenceManager.persist(document, this.settingsService.getUsername(), document);
    }


    protected getIdentifier(filename: string): string {

        const fileName: string[] = filename.split('.');
        fileName.pop();

        return fileName.join('');
    }
}
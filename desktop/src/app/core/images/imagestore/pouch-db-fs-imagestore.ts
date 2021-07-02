import { to } from 'tsfun';
import { Settings } from '../../settings/settings';
import { BlobMaker } from './blob-maker';
import { ImageConverter } from './image-converter';
import { Imagestore } from './imagestore';
import { ImagestoreErrors } from './imagestore-errors';

const fs = typeof window !== 'undefined' ? window.require('fs') : require('fs');


/**
 * A hybrid image store that uses the file system to store the original images
 * but keeps thumbnails as PouchDB attachments in order to be able to sync them.
 *
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 */
export class PouchDbFsImagestore implements Imagestore {

    private projectPath: string|undefined = undefined;

    private thumbBlobUrls: { [key: string]: string } = {};
    private originalBlobUrls: { [key: string]: string } = {};


    constructor(
        private converter: ImageConverter,
        private blobMaker: BlobMaker,
        private db: PouchDB.Database) {
    }

    public setDb = (db: PouchDB.Database) => this.db = db;

    public getPath = (): string|undefined => this.projectPath;

    /**  necessary to detect broken thumbs after restoring backup */
    public isThumbBroken = (data: Blob|any|undefined) => data === undefined || data.size == 0 || data.size == 2;


    public init(settings: Settings): Promise<void> {

        return new Promise<void>((resolve, reject) => {

            if (!fs.existsSync(settings.imagestorePath)) {
                try {
                    fs.mkdirSync(settings.imagestorePath);
                } catch(error) {
                    this.projectPath = undefined;
                    return reject([ImagestoreErrors.INVALID_PATH]);
                }
            }

            this.projectPath = settings.imagestorePath + settings.selectedProject + '/';

            if (!fs.existsSync(this.projectPath)) {
                try {
                    fs.mkdirSync(this.projectPath);
                } catch(error) {
                    this.projectPath = undefined;
                    return reject([ImagestoreErrors.INVALID_PATH]);
                }
            }

            resolve();
        });
    }


    /**
     * @param key the identifier for the data
     * @param data the binary data to be stored
     * @param documentExists
     */
    public create(key: string, data: ArrayBuffer, documentExists: boolean = false): Promise<void> {

        return this.write(key, data, false, documentExists);
    }


    /**
     * Implements {@link ReadImagestore#read}
     *
     * @param key
     * @param sanitizeAfter
     * @param asThumb image will be loaded as thumb, default: true
     *
     *   File not found errors are not thrown when an original is requested
     *   (thumb == false) because missing files in the filesystem can be a
     *   normal result of syncing.
     */
    public read(key: string, asThumb: boolean = true): Promise<string> {

        const readFun = asThumb ? this.readThumb.bind(this) : this.readOriginal.bind(this);
        const blobUrls = asThumb ? this.thumbBlobUrls : this.originalBlobUrls;

        if (blobUrls[key]) return Promise.resolve(blobUrls[key]);

        return readFun(key).then((data: any) => {

            if (data == undefined) {
                console.error('data read was undefined for', key, 'thumbnails was', asThumb);
                return Promise.reject([ImagestoreErrors.EMPTY]);
            }

            if (asThumb && this.isThumbBroken(data)) return Promise.reject('thumb broken');

            blobUrls[key] = this.blobMaker.makeBlobUrl(data);

            return blobUrls[key];

        }).catch((err: any) => {

            if (!asThumb) return Promise.resolve(''); // handle missing files by showing black placeholder

            return this.createThumbnail(key).then(() => this.read(key))
                .catch(() => {
                    return Promise.reject([ImagestoreErrors.NOT_FOUND]); // both thumb and original
                });
        });
    }


    public async readThumbnails(imageIds: string[]): Promise<{ [imageId: string]: string }> {

        const options = {
            keys: imageIds,
            include_docs: true,
            attachments: true,
            binary: true
        };

        const imageDocuments = (await this.db.allDocs(options)).rows.map(to('doc'));

        const result: { [imageId: string]: string } = {};

        for (let imageDocument of imageDocuments) {
            if (imageDocument._attachments?.thumb && !this.isThumbBroken(imageDocument._attachments.thumb.data)) {
                result[imageDocument.resource.id] = this.blobMaker.makeBlobUrl(imageDocument._attachments.thumb.data);
            } else {
                try {
                    await this.createThumbnail(imageDocument.resource.id);
                    result[imageDocument.resource.id] = this.blobMaker.makeBlobUrl(await this.readThumb(imageDocument.resource.id));
                } catch(err) {
                    console.error('Failed to recreate thumbnail for image: ' + imageDocument.resource.id, err);
                }
            }
        }

        return result;
    }


    public revoke(key: string, thumb: boolean) {

        const blobUrls = thumb ? this.thumbBlobUrls : this.originalBlobUrls;

        if (!blobUrls[key]) return;

        BlobMaker.revokeBlobUrl(blobUrls[key]);
        delete blobUrls[key];
    }


    public revokeAll() {

        for (let key of Object.keys(this.originalBlobUrls)) {
            this.revoke(key, false);
        }

        for (let key of Object.keys(this.thumbBlobUrls)) {
            this.revoke(key, true);
        }
    }


    /**
     * @param key the identifier for the data
     * @param data the binary data to be stored
     */
    public update(key: string, data: ArrayBuffer): Promise<void> {

        return this.write(key, data, true, true);
    }


    /**
     * @param key the identifier for the data to be removed
     * @param options
     */
    public async remove(key: string, options?: { fs?: true } /* TODO review */): Promise<void> {

        if (options?.fs === true) {
            if (fs.existsSync(this.projectPath + key)) {
                fs.unlinkSync(this.projectPath + key);
            }
            return;
        }

        return new Promise((resolve, reject) => {
            fs.unlink(this.projectPath + key, () => {
                // errors are ignored on purpose, original file may be missing due to syncing
                this.db.get(key)
                    .then((result: any) => result._rev)
                    .then((rev: any) => this.db.removeAttachment(key, 'thumb', rev))
                    .then(() => resolve())
                    .catch((err: any) => {
                        console.error(err);
                        console.error(key);
                        return reject([ImagestoreErrors.GENERIC_ERROR])
                    });
            });
        });
    }


    private write(key: any, data: any, update: any, documentExists: any): Promise<void> {

        let flag = update ? 'w' : 'wx';

        return new Promise((resolve, reject) => {
            fs.writeFile(this.projectPath + key, Buffer.from(data), { flag: flag }, err => {
                if (err) {
                    console.error(err);
                    console.error(key);
                    reject([ImagestoreErrors.GENERIC_ERROR]);
                }
                else {
                    this.putAttachment(data, key, documentExists)
                        .then(() => resolve()
                    ).catch((warning: any) => {
                        console.warn(warning);
                        resolve();
                    });
                }
            });
        });
    }


    private async putAttachment(data: any, key: any, documentExists: boolean) {

        const buffer: Buffer|undefined = await this.converter.convert(data);

        if (!buffer) {
            return Promise.reject('Failed to create thumbnail for image document ' + key);
        }

        let blob: any;
        if (typeof Blob !== 'undefined') {
            blob = new Blob([buffer]);  // electron runtime environment
        } else {
            blob = Buffer.from(buffer); // jasmine node tests
        }

        let promise;
        if (documentExists) {
            promise = this.db.get(key).then((doc: any) => doc._rev);
        } else {
            promise = Promise.resolve();
        }

        return promise.then((rev: any) => {
            return this.db.putAttachment(key, 'thumb', rev, blob, 'image/jpeg');
        });
    }


    private readOriginal(key: string): Promise<any> {

        let path = this.projectPath + key;
        return new Promise((resolve, reject) => {
            fs.readFile(path, (err, data) => {
                if (err) reject(err);
                else resolve(data);
            });
        });
    }


    private readThumb(key: string): Promise<Blob> {

        return this.db.getAttachment(key, 'thumb') as Promise<Blob>;
    }


    private async createThumbnail(key: string): Promise<any> {

        console.debug('Recreating thumbnail for image:', key);

        const originalImageData = await this.readOriginal(key);
        return await this.putAttachment(originalImageData, key, true);
    }
}

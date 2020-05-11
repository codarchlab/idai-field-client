import {SafeResourceUrl} from '@angular/platform-browser';


/**
 * The interface for general media stores supporting
 * the storage of general binary data
 *
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 *
 * The errors with which the methods reject, like NOT_FOUND,
 * are constants of {@link ImagestoreErrors}, so NOT_FOUND really
 * is ImagestoreErrors.NOT_FOUND. The brackets [] are array indicators,
 * so [NOT_FOUND] is an array containing one element, which is the string
 * corresponding to NOT_FOUND.
 */
export abstract class ReadImagestore {

    /**
     * Loads an image from the mediastore and generates a blob. Returns an url through which it is accessible.
     *
     * @param key must be an identifier of an existing file in the mediastore.
     * @param sanitizeAfter
     * @param thumb image will be loaded as thumb
     * @returns {Promise<string>} Promise that returns the blob url.
     *   Rejects with
     *     [NOT_FOUND] - in case image is missing
     *     [EMPTY] - in case the retrieved image data is undefined
     */
    abstract read(key: string, sanitizeAfter?: boolean, thumb?: boolean): Promise<string|SafeResourceUrl>;


    /**
     * Revokes an image blob url which was previously created by calling read.
     * Should be called as soon as the image is no longer displayed to allow the garbage collector to remove
     * the image data from memory.
     * @param key must be an identifier of an existing file in the mediastore
     * @param thumb If true, the blob url of the thumb image will be revoked (instead of the original image).
     *              References to thumb & original image blobs are stored separately.
     */
    abstract revoke(key: string, thumb: boolean): void;


    /**
     * Revokes all image blob urls of both thumb & original images.
     */
    abstract revokeAll(): void;
}
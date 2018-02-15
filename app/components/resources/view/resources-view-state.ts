/**
 * @author Thomas Kleinke
 */
export interface ResourcesViewState {

    mainTypeDocumentId?: string;
    types?: string[];
    q?: string;
    mode?: string;
    layerIds?: { [mainTypeDocumentId: string]: string[] };
    layer3DIds?: { [mainTypeDocumentId: string]: string[] };
}

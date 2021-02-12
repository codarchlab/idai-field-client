import {ImageDocument} from 'idai-components-2';


export module LayerUtility {

    export const getLayerLabel = (layer: ImageDocument): string => {

        let label = layer.resource.shortDescription && layer.resource.shortDescription != '' ?
            layer.resource.shortDescription :
            layer.resource.identifier;

        if (label.length > 48) label = label.substring(0, 45) + '...';

        return label;
    }
}

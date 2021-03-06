import { TFunction } from 'i18next';
import React, { CSSProperties, ReactElement } from 'react';
import { Card, Col, Row } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { ResultDocument } from '../../api/result';
import DocumentThumbnail from '../document/DocumentThumbnail';


const MAX_IMG_WIDTH = 230;
const MAX_IMG_HEIGHT = 230;


interface DocumentGridProps {
    documents: ResultDocument[];
    getLinkUrl: (document: ResultDocument) => string;
}


export default function DocumentGrid({ documents, getLinkUrl }: DocumentGridProps): ReactElement {
    
    const { t } = useTranslation();
    
    return (documents?.length > 0) ? renderDocuments(documents, getLinkUrl) : renderEmptyResult(t);

}


const renderDocuments = (documents: ResultDocument[], getLinkUrl: (document: ResultDocument) => string): ReactElement =>
    <div className="d-flex flex-wrap my-3">
        { documents.map((document) => renderDocument(document, getLinkUrl)) }
    </div>;


const renderDocument = (document: ResultDocument, getLinkUrl: (document: ResultDocument) => string): ReactElement =>
    <div key={ document.resource.id } style={ documentBoxStyle } className="p-1 mr-2 mb-2">
        <DocumentThumbnail
            document={ document }
            linkUrl={ getLinkUrl(document) }
            maxWidth={ MAX_IMG_WIDTH }
            maxHeight={ MAX_IMG_HEIGHT } />
    </div>;


const renderEmptyResult = (t: TFunction): ReactElement =>
    <Row>
        <Col>
            <Card>
                <div className="text-center mt-sm-5 mb-sm-5"><em>{ t('project.noResults') }</em></div>
            </Card>
        </Col>
    </Row>;


const documentBoxStyle: CSSProperties = {
    width: `${MAX_IMG_WIDTH}px`,
    height: `${MAX_IMG_HEIGHT}px`,
    backgroundColor: '#fff'
};

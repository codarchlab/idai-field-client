import { Ionicons } from '@expo/vector-icons';
import { BarCodeScanner } from 'expo-barcode-scanner';
import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet } from 'react-native';
import Button from '../common/Button';

interface ScanBarcodeButtonProps {
    onBarCodeScanned: (docId: string) => void
}


const ScanBarcodeButton: React.FC<ScanBarcodeButtonProps> = ({ onBarCodeScanned }) => {

    const [hasPermission, setHasPermission] = useState(false);
    const [scannerActive, setScannerActive] = useState(false);

    useEffect(() => {
        
        BarCodeScanner.requestPermissionsAsync()
            .then(({ status }: { status: string }) => setHasPermission(status === 'granted'));
    }, []);


    const handleBarCodeScanned = ({ data }: { data: string }) => {
        
        setScannerActive(false);
        onBarCodeScanned(data);
    };

    return hasPermission
        ? scannerActive
            ? renderBarcodeScanner(handleBarCodeScanned, setScannerActive)
            : renderButton(setScannerActive)
        : null;
};


const renderBarcodeScanner = (
    handleBarCodeScanned: ({ data }: { data: string }) => void,
    setScannerActive: (active: boolean) => void
) =>
        <Modal onRequestClose={ () => setScannerActive(false) }>
            <BarCodeScanner
                style={ [StyleSheet.absoluteFillObject, styles.scannerContainer] }
                onBarCodeScanned={ handleBarCodeScanned }
            />
            <Button
                icon={ <Ionicons name="close" size={ 25 } /> }
                onPress={ () => setScannerActive(false) }
                style={ styles.fab }
            />
        </Modal>;


const renderButton = (setScannerActive: (active: boolean) => void) =>
    <Button
        variant="transparent"
        icon={ <Ionicons name="qr-code" size={ 18 } /> }
        onPress={ () => setScannerActive(true) }
    />;


const styles = StyleSheet.create({
    scannerContainer: {
        backgroundColor: 'black',
        flex: 1,
        elevation: 6,
    },
    fab: {
        bottom: 15,
        right: 15,
        height: 50,
        width: 50,
        borderRadius: 25,
        elevation: 10,
        justifyContent: 'center'
    }
});


export default ScanBarcodeButton;

import React, { useState } from 'react';
import { Button, Center, Input, Stack, Text } from 'native-base';
import { Keyboard, StyleSheet } from 'react-native';

interface ConnectPouchFormProps {
    dbSetupHandler: (dbName: string, remotePassword: string) => void;
}

const ConnectPouchForm: React.FC<ConnectPouchFormProps> = ({ dbSetupHandler }) => {

    const [password, setPassword] = useState<string>('Celt1!wedged');
    const [dbName, setDbName] = useState<string>('test467');

    const connectionHandler = () => {
        setPassword('');
        setDbName('');
        Keyboard.dismiss();
        dbSetupHandler(dbName, password);
    };

    return (
        <Center>
            <Text>Connect to project</Text>
            <Stack>
                <Input placeholder="Project"
                    value={ dbName }
                    onChange={ e => setDbName(e.nativeEvent.text) }
                    autoCapitalize="none"
                    autoCorrect={ false }
                />
                <Input placeholder="Password"
                    value={ password }
                    onChange={ e => setPassword(e.nativeEvent.text) }
                    autoCapitalize="none"
                    autoCorrect={ false }
                />
                <Button info onPress={ connectionHandler } style={ styles.connectBtn }>
                    <Text>Connect</Text>
                </Button>
        </Stack>
        </Center>
    );
};

const styles = StyleSheet.create({
    header: {
        justifyContent: 'center',
    },
    connectBtnContainer: {
        justifyContent: 'center',
        margin: 20,
    },
    connectBtn: {
        width: '80%',
        justifyContent: 'center'
    }

});

export default ConnectPouchForm;
'use strict';

const electron = require('electron');
const fs = require('fs');
const os = require('os');
const autoUpdate = require('./auto-update.js');

// needed to fix notifications in win 10
// see https://github.com/electron/electron/issues/10864
electron.app.setAppUserModelId('org.dainst.field');

// Copy config file to appData if no config file exists in appData
const copyConfigFile = (destPath, appDataPath) => {

    if (!fs.existsSync(appDataPath)) fs.mkdirSync(appDataPath);

    if (!fs.existsSync(destPath)) {
        console.log('Create config.json at ' + destPath);
        fs.writeFileSync(destPath, JSON.stringify({ 'dbs': ['test'] }));
    }
};


global.setConfigDefaults = config => {

    if (!config.syncTarget) config.syncTarget = {};
    if (!config.remoteSites) config.remoteSites = [];
    if (config.isAutoUpdateActive === undefined) config.isAutoUpdateActive = true;
    if (!config.locale) config.locale = electron.app.getLocale().includes('de') || global.mode === 'test' ? 'de' : 'en';
    if (os.type() === 'Linux') config.isAutoUpdateActive = false;

    return config;
};


global.updateConfig = config => {

    const oldLocale = global.config.locale;
    global.config = config;
    if (global.config.locale !== oldLocale) createMenu();
};


// CONFIGURATION ---

let env = undefined;
if (process.argv && process.argv.length > 2) {
    env = process.argv[2];
}

if (env) { // is environment 'dev' (npm start) or 'test' (npm run e2e)
    global.configurationDirPath = 'config';
}

if (!env) {
    // Packaged app
    global.mode = 'production';
} else if (env === 'test') {
    // npm run e2e
    global.mode = 'test';
} else {
    // npm start
    global.mode = 'development';
}


if (['production', 'development'].includes(global.mode)) {
    global.appDataPath = electron.app.getPath('appData') + '/' + electron.app.getName();
    copyConfigFile(global.appDataPath + '/config.json', global.appDataPath);
    global.configPath = global.appDataPath + '/config.json';

    if (global.mode === 'production') global.configurationDirPath = '../config';
} else {
    global.configPath = 'config/config.test.json';
    global.appDataPath = 'test/test-temp';
}

// -- CONFIGURATION


// OTHER GLOBALS --

global.switches = {
    prevent_reload: false,
    destroy_before_create: false,
    messages_timeout: 3500,
    suppress_map_load_for_test: false,
    provide_reset: false
};

if (global.mode === 'test') {
    global.switches.messages_timeout = undefined;
    global.switches.prevent_reload = true;
    global.switches.destroy_before_create = true;
    global.switches.suppress_map_load_for_test = true;
    global.switches.provide_reset = true;
}

global.toolsPath = global.mode === 'production' ?
    electron.app.getAppPath().replace('app.asar', '') + 'tools'
    : 'tools';

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = true;


// -- OTHER GLOBALS

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;


const createWindow = () => {

    const screenWidth = electron.screen.getPrimaryDisplay().workAreaSize.width;
    const screenHeight = electron.screen.getPrimaryDisplay().workAreaSize.height;

    mainWindow = new electron.BrowserWindow({
        width: screenWidth >= 1680 ? 1680 : 1280,
        height: screenHeight >= 1050 ? 1050 : 800,
        minWidth: 1220, // to allow for displaying project names like 'mmmmmmmmmmmmmmmmmm'
        minHeight: 600,
        webPreferences: {
            nodeIntegration: true,
            webSecurity: global.mode !== 'test'
        },
        titleBarStyle: 'hiddenInset'
    });

    // and load the index.html of the app.
    mainWindow.loadURL('file://' + __dirname + '/index.html');

    // Open the DevTools.
    // mainWindow.webContents.openDevTools();

    // Emitted when the window is closed.
    mainWindow.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });

    return mainWindow;
};


const loadConfig = () => {

    global.config = global.setConfigDefaults(
        JSON.parse(fs.readFileSync(global.configPath, 'utf-8'))
    );
};


const createMenu = () => {

    const menu = electron.Menu.buildFromTemplate(require('./menu.js')());
    electron.Menu.setApplicationMenu(menu);
};


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
electron.app.on('ready', () => {
    const mainWindow = createWindow();
    loadConfig();
    createMenu();

    if (global.config.isAutoUpdateActive) autoUpdate.setUp(mainWindow);

    electron.ipcMain.on('settingsChanged', (event, settings) => {
        if (settings.isAutoUpdateActive) autoUpdate.setUp(mainWindow);
    });
});

electron.app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
    }
});

// Quit when all windows are closed.
electron.app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        electron.app.quit();
    }
});

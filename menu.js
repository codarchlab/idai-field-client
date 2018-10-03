const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

var name = app.getName();

const template = [{
    label: name,
    submenu: [{
        label: 'Über ' + name,
        role: 'about'
    }, {
        type: 'separator'
    }]
},{
    label: 'Datei',
    submenu: [
        {
            label: 'Beenden',
            accelerator: 'CmdOrCtrl+Q',
            click: function () {
                app.quit()
            }
        }]
}, {
    label: 'Bearbeiten',
    submenu: [{
        label: 'Rückgängig',
        accelerator: 'CmdOrCtrl+Z',
        role: 'undo'
    }, {
        label: 'Wiederholen',
        accelerator: 'Shift+CmdOrCtrl+Z',
        role: 'redo'
    }, {
        type: 'separator'
    }, {
        label: 'Ausschneiden',
        accelerator: 'CmdOrCtrl+X',
        role: 'cut'
    }, {
        label: 'Kopieren',
        accelerator: 'CmdOrCtrl+C',
        role: 'copy'
    }, {
        label: 'Einfügen',
        accelerator: 'CmdOrCtrl+V',
        role: 'paste'
    }, {
        label: 'Alle auswählen',
        accelerator: 'CmdOrCtrl+A',
        role: 'selectall'
    }]
}, {
    label: 'Anzeige',
    submenu: [{
        label: 'Neu laden',
        accelerator: 'CmdOrCtrl+R',
        click: function (item, focusedWindow) {
            if (focusedWindow) focusedWindow.reload();
        }
    }, {
        label: 'Vollbild An/Aus',
        accelerator: (function () {
            if (process.platform === 'darwin') {
                return 'Ctrl+Command+F'
            } else {
                return 'F11'
            }
        })(),
        click: function (item, focusedWindow) {
            if (focusedWindow) {
                focusedWindow.setFullScreen(!focusedWindow.isFullScreen())
            }
        }
    }, {
        label: 'Developer Tools an-/ausschalten',
        accelerator: (function () {
            if (process.platform === 'darwin') {
                return 'Alt+Command+I'
            } else {
                return 'Ctrl+Shift+I'
            }
        })(),
        click: function (item, focusedWindow) {
            if (focusedWindow) {
                focusedWindow.toggleDevTools()
            }
        }
    }]
}, {
    label: 'Fenster',
    role: 'window',
    submenu: [{
        label: 'Minimieren',
        accelerator: 'CmdOrCtrl+M',
        role: 'minimize'
    }]
}, {
    label: 'Hilfe',
    role: 'help',
    submenu: [{
        label: 'Über ' + name,
        click: function createInfoWindow() {
            var infoWindow = new BrowserWindow({
                width: 300,
                height: 350,
                frame: false,
                parent: BrowserWindow.getFocusedWindow(),
                modal: true,
                show: false,
                webPreferences: { nodeIntegration: true }
            });

            infoWindow.once('ready-to-show', function() {
                infoWindow.show();
            });

            infoWindow.loadURL('file://' + __dirname + '/app/desktop/info-window.html');
        }
    }]
}];

if (process.platform !== 'darwin') {
    template.splice(0, 1);
}

module.exports = template;
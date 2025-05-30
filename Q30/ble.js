const ble = {
    buffer: [],
    timer: null,
    printing: false,
    data2string: (data, s) => {
        if (!data) return '';
        let str = '';
        for (let i = s; i < data.length; i++) str = str + String.fromCharCode(data[i]);
        return str;
    },
    data2dots: (data, s) => {
        if (!data) return '';
        let str = '';
        for (let i = s; i < data.length; i++) {
            str = str + data[i];
            if (i < data.length - 1) str = str + '.';
        }
        return str;
    },
    close: () => {
        if (config.ble.device) config.ble.device.gatt.disconnect();
        config.ble.device = null;
        config.ble.server = null;
        config.ble.service = null;
        config.ble.ch2 = null;
        config.ble.ch3 = null;
        config.ble.printer = 0;
        ui.message('BLE device disconnected', true);
    },
    open: () => {
        if (config.ble.device) return;
        if (!config.ble.services) return;
        if (!config.ble.optional) return;
        navigator.bluetooth.requestDevice({
            filters: [{ services: config.ble.services }],
            optionalServices: config.ble.optional
        }).then((device) => {
            ui.message('BLE device selected');
            config.ble.device = device;
            config.ble.device.addEventListener('gattserverdisconnected', () => {
                ble.close();
                return;
            });
            return config.ble.device.gatt.connect();
        }).then((server) => {
            ui.message('BLE device connected');
            config.ble.server = server;
            return config.ble.server.getPrimaryService(config.ble.optional[0]);
        }).then((service) => {
            ui.message('BLE service found');
            config.ble.service = service;
            return config.ble.service.getCharacteristic(config.ble.characteristic2);
        }).then((characteristic) => {
            ui.message('BLE characteristic 2 found');
            config.ble.ch2 = characteristic;
            if (config.ble.ch2.properties.write) ui.message('BLE characteristic 2 has write');
            return config.ble.service.getCharacteristic(config.ble.characteristic3);
        }).then((characteristic) => {
            ui.message('BLE characteristic 3 found');
            config.ble.ch3 = characteristic;
            if (config.ble.ch3.properties.notify) ui.message('BLE characteristic 3 has notify');
            return config.ble.ch3.startNotifications();
        }).then(() => {
            config.ble.ch3.addEventListener('characteristicvaluechanged', (ev) => {
                if (!ev) return;
                if (!ev.target) return;
                if (!ev.target.value) return;
                const data = new Uint8Array(ev.target.value.buffer);
                if (config.log.ble.read) console.log('[BLE <<<]', data.toString());
                ble.notification(data);
                ui.text('busy', '0');
            });
        }, (err) => {
            ui.message('BLE connect failed', true);
            ui.message(err, true);
            ble.close();
        });
    },
    notification: (data) => {
        if (!data) return;
        if (data.length === 2 && data[0] === 0x01) { protocol.in('!RESULT ' + data[1] + '\n'); ble.result(); }
        if (data.length === 3 && data[0] === 0x02) {
            config.ble.printer = data[1];
            protocol.in('!PRINTER ' + config.ble.printer + '\n');
        }
        if (data[0] != 0x1A) return;
        switch (data[1]) {
            case 0x03:
                if (data[2] === 0xA9) { protocol.in('!HOT -1\n'); break; }
                if (data[2] === 0xA8) { protocol.in('!HOT 0\n'); break; }
                protocol.in('!HOT 1\n');
                break;
            case 0x04:
                if (data[2] == 0xA4) { protocol.in('!BATTERY ' + 0 + '\n'); break; }
                if (data[2] == 0xA3) { protocol.in('!BATTERY ' + 3 + '\n'); break; }
                if (data[2] == 0xA2) { protocol.in('!BATTERY ' + 5 + '\n'); break; }
                if (data[2] == 0xA1) { protocol.in('!BATTERY ' + 10 + '\n'); break; }
                protocol.in('!BATTERY ' + data[2] + '\n');
                break;
            case 0x05:
                if (data[2] === 0x98) { protocol.in('!COVER 1\n'); break; }
                if (data[2] === 0x99) { protocol.in('!COVER 0\n'); break; }
                protocol.in('!COVER -1\n');
                break;
            case 0x06:
                if (data[2] === 0x88) { protocol.in('!PAPER 0\n'); break; }
                protocol.in('!PAPER 1\n');
                break;
            case 0x07:
                protocol.in('!FIRMWARE ' + ble.data2dots(data, 2) + '\n');
                break;
            case 0x08:
                protocol.in('!SERIAL ' + ble.data2string(data, 2) + '\n');
                break;
            case 0x09:
                protocol.in('!POWER ' + data[2] + '\n');
                break;
            case 0x0B:
                if (data[2] === 0xB8) { protocol.in('!PRINT -1\n'); break; }
                protocol.in('!PRINT ' + data[2] + '\n');
                break;
            case 0x0C:
                if (data[2] === 0x0B) { protocol.in('!LABEL 0\n'); break; }
                if (data[2] === 0x26) { protocol.in('!LABEL 3\n'); break; }
                protocol.in('!LABEL 2\n');
                break;
            case 0x0D:
                protocol.in('!MAC ' + ble.data2string(data, 2) + '\n');
                break;
            case 0x0F:
                if (data[2] === 0x0C) { protocol.in('!PRINT 1\n'); break; }
                protocol.in('!PRINT ' + data[2] + '\n');
                break;
            case 0x11:
                protocol.in('!VERSION ' + ble.data2dots(data, 2) + '\n');
                break;
            case 0x17:
                protocol.in('!CHIP ' + data[2] + '\n');
                break;
        }
    },
    write: (text) => {
        if (!text) return;
        if (!config.ble.ch2) return;
        let v = null;
        text = text.replace(/[\n]/g, '');
        const cmd = text.replace(/ .*$/, '');
        switch (cmd) {
            case 'hi':
                protocol.in('!HO\n');
                protocol.in('!PRINTER ' + config.ble.printer + '\n');
                break;
            case 'mac':
                v = [31, 17, 32];
                break;
            case 'version':
                v = [31, 17, 51];
                break;
            case 'serial':
                v = [31, 17, 9];
                break;
            case 'cover':
                v = [31, 17, 18];
                break;
            case 'chip':
                v = [31, 17, 56];
                break;
            case 'firmware':
                v = [31, 17, 7];
                break;
            case 'hot':
                v = [31, 17, 19];
                break;
            case 'busy':
                v = [31, 17, 84];
                break;
            case 'battery':
                v = [31, 17, 8];
                break;
            case 'power':
                v = [31, 17, 14];
                break;
            case 'label':
                v = [31, 17, 25];
                break;
            case 'paper':
                v = [31, 17, 17];
                break;
            case 'print':
                ble.print();
                break;
        }
        if (!v) return;
        ble.buffer.push(new Uint8Array(v));
        ble.send();
    },
    send: () => {
        if (ble.buffer.length === 0) {
            ui.text('busy', '0');
            return;
        }
        if (ble.timer) return;
        ui.text('busy', '1');
        ble.timer = setTimeout(() => {
            ble.timer = null;
            if (!config.ble.ch2) return;
            const v = ble.buffer.shift();
            if (config.log.ble.write) console.log('[BLE >>>] ' + v.length + ' bytes', v.toString());
            config.ble.ch2.writeValueWithoutResponse(v).then(nop, nop);
            if (!ble.printing) ble.send();
        }, config.ble.interval);
    },
    print: () => {
        let v = [27, 64];
        ble.buffer.push(new Uint8Array(v));
        ble.send();

        ble.printing = true;
        v = [29, 118, 48, 0];
        const width = config.label.width;
        const length = config.dots.length / config.label.width
        v.push(width % 256);
        v.push(Math.trunc(width / 256));
        v.push(length % 256);
        v.push(Math.trunc(length / 256));
        for (let i = 0; i < config.dots.length; i++) {
            v.push(config.dots[i]);
            if (v.length >= config.ble.mtu) {
                ble.buffer.push(new Uint8Array(v));
                v = [];
            }
        }
        if (v.length > 0) ble.buffer.push(new Uint8Array(v));
        ble.send();
    },
    result: () => {
        if (!ble.printing) return;
        if (ble.buffer.length === 0) ble.printing = false;
        ble.send();
    }
};

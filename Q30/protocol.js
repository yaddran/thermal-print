const protocol = {
    buffer: '',

    hi: () => { protocol.out('hi'); },
    mac: () => { protocol.out('mac'); },
    version: () => { protocol.out('version'); },
    serial: () => { protocol.out('serial'); },
    cover: () => { protocol.out('cover'); },
    chip: () => { protocol.out('chip'); },
    firmware: () => { protocol.out('firmware'); },
    hot: () => { protocol.out('hot'); },
    busy: () => { protocol.out('busy'); },
    battery: () => { protocol.out('battery'); },
    power: () => { protocol.out('power'); },
    label: () => { protocol.out('label'); },
    paper: () => { protocol.out('paper'); },
    image: (pixels) => { protocol.out('image ' + pixels); },
    d: (dot) => { protocol.out('d ' + dot); },
    clear: () => { protocol.out('clear'); },
    print: () => { protocol.out('print'); },

    onimage: null,
    ond: null,

    info: () => {
        ui.message('Printer found, asking for info...');
        protocol.mac();
        protocol.version();
        protocol.serial();
        protocol.cover();
        protocol.chip();
        protocol.firmware();
        protocol.hot();
        protocol.busy();
        protocol.battery();
        protocol.power();
        protocol.label();
        protocol.paper();
    },

    log: (text) => {
        if (config.log.protocol.adapter) console.log('[adapter] ' + text);
    },

    next: (text) => {
        text = text || '';
        protocol.buffer = protocol.buffer + text;
        const p = protocol.buffer.indexOf('\n');
        if (p < 0) return '';
        const line = protocol.buffer.substring(0, p);
        protocol.buffer = protocol.buffer.substring(p + 1);
        return line;
    },

    in: (text) => {
        let line = protocol.next(text);
        while (line) {
            if (!line.startsWith('!'))
                protocol.log(line);
            else {
                if (config.log.protocol.in) console.log('[protocol <<<]', line);
                const parts = line.split(' ');
                const cmd = parts[0].substring(1).toLowerCase();
                ui.text(cmd, parts[1]);
                if (cmd === 'ho') ui.message('Printer found');
                if (cmd === 'image' && protocol.onimage) protocol.onimage(parseInt(parts[1], 10) || 0);
                if (cmd === 'd' && protocol.onimage) protocol.ond(parseInt(parts[1], 10) || 0);
                if (cmd === 'printer' && parts[1] !== '0') protocol.info();
                if (cmd === 'printer' && parts[1] === '0') ui.message('Printer gone', true);
                if (cmd === 'buffer') ui.show('printit', parts[1] !== '0');
                if (cmd === 'print' && parts[1] === '-1') ui.message('Printing failed', true);
                if (cmd === 'print' && parts[1] === '1') ui.message('Print done', true);
                if (cmd === 'bt' && parts[1] === '-1') ui.message('Bluetooth send failed', true);
                if (cmd === 'bt' && parts[1] === '0') ui.message('Bluetooth send retry', true);
            }
            line = protocol.next('');
        }
    },

    out: (text) => {
        if (config.log.protocol.out) console.log('[protocol >>>]', text);
        ble.write(text + '\n');
    }
};

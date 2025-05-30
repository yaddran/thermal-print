const nop = () => { };

const config = {
    label: {
        width: 12,
        length: 50,
        density: 8
    },
    image: {
        width: 0,
        height: 0
    },
    canvas: document.querySelector('#canvas'),
    view: document.querySelector('#view'),
    pixel: document.querySelector('#view').getContext('2d').createImageData(1, 1),
    dots: [],
    ble: {
        services: [0xAF30],
        optional: [0xFF00],
        characteristic1: 0xFF01,
        characteristic2: 0xFF02,
        characteristic3: 0xFF03,
        device: null,
        server: null,
        service: null,
        ch2: null,
        ch3: null,
        printer: 0,
        interval: 13,
        mtu: 200
    },
    log: {
        max_messages: 20,
        ble: {
            read: false,
            write: false
        },
        protocol: {
            in: false,
            out: false,
            adapter: false
        }
    }
};

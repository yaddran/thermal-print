const handle = {
    image: {
        resize: () => {
            if (!config.label.length) return;
            ui.resolutionInfo();

            let root = document.documentElement;
            root.style.setProperty('--label-length', config.label.length * config.label.density + 'px');
        },
        drop: (event) => {
            protocol.clear();
            const reader = new FileReader();
            reader.readAsDataURL(event.dataTransfer.files[0]);
            reader.onload = () => {
                const image = new Image();
                image.src = reader.result;
                image.onload = () => {
                    config.image.width = image.width;
                    config.image.height = image.height;
                    config.canvas.width = config.label.length * config.label.density;
                    config.canvas.height = config.label.width * config.label.density;
                    let context = config.canvas.getContext('2d', { willReadFrequently: true });
                    context.rect(0, 0, config.canvas.width, config.canvas.height);
                    context.fillStyle = "white";
                    context.fill();
                    context.drawImage(image, 0, 0);
                    ui.message('Image loaded ' + image.width + 'x' + image.height);
                    setTimeout(handle.image.prepare, 1);
                    ui.resolutionInfo();
                }
            };
        },
        prepare: () => {
            config.dots = [];
            const pixels = config.canvas.getContext('2d').getImageData(0, 0, config.canvas.width, config.canvas.height).data;
            for (let i = 0; i < pixels.length; i += 4) {
                const c = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
                config.dots.push(c < 128 ? 1 : 0);
            }

            config.view.width = config.canvas.height;
            config.view.height = config.canvas.width;
            const context = config.view.getContext('2d');

            for (let x = 0; x < config.canvas.width; x++)
                for (let y = 0; y < config.canvas.height; y++) {
                    const i = x + y * config.canvas.width;
                    const c = config.dots[i] ? 0 : 255;
                    config.pixel.data[0] = c;
                    config.pixel.data[1] = c;
                    config.pixel.data[2] = c;
                    config.pixel.data[3] = 255;
                    context.putImageData(config.pixel, y, config.view.height - x - 1);
                }

            const bytes = [];
            let c = 0;
            let b = 0;
            for (let x = 0; x < config.canvas.width; x++)
                for (let y = config.canvas.height - 1; y >= 0; y--) {
                    const i = x + y * config.canvas.width;
                    b = b << 1 | config.dots[i];
                    c++;
                    if (c < 8) continue;
                    bytes.push(b);
                    b = 0;
                    c = 0;
                }
            config.dots = bytes;

            ui.show('center', true);
        }
    },
    printer: {
        print: () => {
            protocol.print();
        }
    },
    ble: {
        open: () => {
            ble.open();
        }
    }
};

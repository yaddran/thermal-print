const ui = {
    mac: document.querySelector('#mac'),
    version: document.querySelector('#version'),
    serial: document.querySelector('#serial'),
    cover: document.querySelector('#cover'),
    chip: document.querySelector('#chip'),
    firmware: document.querySelector('#firmware'),
    hot: document.querySelector('#hot'),
    busy: document.querySelector('#busy'),
    battery: document.querySelector('#battery'),
    power: document.querySelector('#power'),
    label: document.querySelector('#label'),
    paper: document.querySelector('#paper'),
    messages: document.querySelector('#messages'),

    center: document.querySelector('#center'),
    resolution: document.querySelector('#resolution'),
    printit: document.querySelector('#printit'),

    text: (field, text) => {
        if (!ui[field]) return;
        ui[field].innerText = text;
    },

    show: (field, visible) => {
        if (!ui[field]) return;
        if (visible) {
            ui[field].classList.remove('hidden');
            return;
        }
        ui[field].classList.add('hidden');
    },

    attention: (field, visible) => {
        if (!ui[field]) return;
        if (visible) {
            ui[field].classList.add('attention');
            return;
        }
        ui[field].classList.remove('attention');
    },

    message: (text, attention) => {
        while (ui.messages.childElementCount >= config.log.max_messages) ui.messages.removeChild(ui.messages.firstChild);
        const message = document.createElement('div');
        message.innerText = text;
        if (attention) message.classList.add('attention');
        ui.messages.prepend(message);
    },

    resolutionInfo: () => {
        const needw = config.label.length * config.label.density;
        const needh = config.label.width * config.label.density;
        if ((!config.image.width || !config.image.height) || (config.image.width == needw && config.image.height == needh)) {
            ui.text('resolution', '(' + needw + 'px x ' + needh + 'px)');
            ui.attention('resolution', false);
            return;
        }
        ui.text('resolution', '(' + config.image.width + 'px x ' + config.image.height + 'px) but expected (' + needw + 'px x ' + needh + 'px)');
        ui.attention('resolution', true);
    }
};

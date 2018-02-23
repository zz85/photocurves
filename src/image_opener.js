function opener(callback) {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = () => {
        const file = input.files[0];
        read_file(file, callback);
    };

    return input;
}

function read_file(file, callback) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
        callback && callback(reader.result);
    }
    reader.readAsDataURL(file);
}

function add_opener(callback) {
    const input = opener(callback);

    const button = document.createElement('button')
    button.innerText = 'Open'

    button.onclick = () => {
        console.log('click')
        input.click()
    }

    handle_drop(document.body, callback)
    return button;
}

function handle_drop(target, callback) {
    target.onpaste = (e) => {
        const items = e.clipboardData.items;
        console.log('handle paste', e, items, e.clipboardData.files);

        [...e.clipboardData.files].forEach(file => {
            read_file(file, callback)
        })

        ;[...items].forEach(i => {
            console.log('type', i.type, i.kind);
            i.getAsString((x) => {
                console.log('got', x);
            })
            // i.getAsFile()
        })
    }

    const handleDragOver = (e) => {
        e.dataTransfer.dropEffect = 'copy';
        e.stopPropagation();
        e.preventDefault();
    }

    function stopDefault(e) {
        e.preventDefault();
        return false;
    }

    function dropBehavior(e) {
        e.stopPropagation();
        e.preventDefault();

        var files = e.dataTransfer.files;
        if (files.length) {
            read_file(files[0], callback);
        }
    }

    target.addEventListener('dragover', handleDragOver);
    target.addEventListener('dragenter', stopDefault);
    target.addEventListener('dragexit', stopDefault);
    target.addEventListener('drop', dropBehavior);
}


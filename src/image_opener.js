function opener(callback) {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = () => {
        const file = input.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            callback && callback(reader.result);
        }
        reader.readAsDataURL(file);
    };

    return input;
}

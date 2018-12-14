const fs = require('fs');
const {createCanvas, registerFont} = require('canvas');

const FONT_FAMILY = 'customed';

module.exports = function font2img(options) {
    console.log('working', options);

    let {
        fontPath, output, text, color, fontSize,
        canvasWidth, canvasHeight, dpr, offsetX, offsetY
    } = options;
    console.log(options);

    output = output || './output.png';
    color = color || 'black';
    fontSize = fontSize || '12px';
    canvasWidth = canvasWidth;
    canvasHeight = canvasHeight;
    offsetX = offsetX || 0;
    offsetY = offsetY || 0;

    dpr = parseInt(dpr, 10) || 1;
    if (dpr !== 1) {
        const unitIndex = fontSize.match(/\D/).index;
        const unit = fontSize.substr(unitIndex);
        fontSize = parseInt(fontSize, 10) * 2 + unit;
    }

    const boundingBox = getBoundingBox(fontPath, fontSize, text);
    console.log(boundingBox);

    const canvas = createCanvas(
        canvasWidth || boundingBox.width,
        canvasHeight || boundingBox.height
    );
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = color;

    registerFont(fontPath, {
        family: FONT_FAMILY
    });
    ctx.font = fontSize + ' ' + FONT_FAMILY;

    ctx.fillText(text, offsetX, boundingBox.height + offsetY);
    const base64 = canvas.toDataURL('image/png');

    const data = base64.replace(/^data:image\/\w+;base64,/, '');
    const buf = Buffer.from(data, 'base64');
    fs.writeFileSync(output, buf);
}

function getBoundingBox(fontPath, fontSize, text) {
    const canvas = createCanvas(1, 1);
    const ctx = canvas.getContext('2d');

    registerFont(fontPath, {
        family: FONT_FAMILY
    });
    ctx.font = fontSize + ' ' + FONT_FAMILY;

    const measure = ctx.measureText(text);

    return {
        width: Math.floor(measure.width),
        height: Math.floor(measure.actualBoundingBoxAscent)
    };
}

const fs = require('fs');
const {createCanvas, registerFont} = require('canvas');

const FONT_FAMILY = 'customed';

module.exports = function font2img(options) {
    let fontPath = options.fontPath;
    if (fs.lstatSync(fontPath).isDirectory()) {
        fontPath = getFileDirectoryName(fontPath);

        let outputPath = options.output || 'output';
        if (fs.existsSync(outputPath)
            && !fs.lstatSync(outputPath).isDirectory())
        {
            // If output is not dir, remove it
            fs.unlinkSync(outputPath);
            fs.mkdirSync(outputPath);
        }
        else if (!fs.existsSync(outputPath)) {
            fs.mkdirSync(outputPath);
        }
        outputPath = getFileDirectoryName(outputPath);

        fs.readdirSync(fontPath).forEach(file => {
            const suffixId = file.lastIndexOf('.');
            const outputName = suffixId ? file.substr(0, suffixId) : file;

            options.output = outputPath + outputName;
            options.fontPath = fontPath + file;
            convertOneFont(options);
        });
    }
    else {
        convertOneFont(options);
    }
};

function convertOneFont (options) {
    console.log('Working on', options.fontPath);

    let {
        fontPath, output, text, color, fontSize,
        canvasWidth, canvasHeight, dpr, offsetX, offsetY
    } = options;

    if (fontPath.indexOf('.ttf') < 0) {
        console.error('[Error]: Font path should be end with *.ttf.');
        return;
    }

    output = output || './output.png';
    if (output.lastIndexOf('.png') !== output.length - '.png'.length) {
        output += '.png';
    }

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

/**
 * Append '/' to the end of directory name, if not exists
 *
 * @param {string} dir directory name in the form of xxx or xxx/
 * @return {string} directory name in the form of xxx/
 */
function getFileDirectoryName(dir) {
    if (!dir) {
        return dir;
    }

    if (dir[dir.length - 1] !== '/') {
        return dir + '/';
    }
    else {
        return dir;
    }
}

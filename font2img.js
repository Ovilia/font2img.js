const fs = require('fs');
const {createCanvas, registerFont} = require('canvas');
const opentype = require('opentype.js');

module.exports = function font2img(options) {
    if (options.font.indexOf('.ttf') < 0 && options.font.indexOf('.otf') < 0) {
        convertOneFont(options);
        return;
    }

    let fontPath = options.font;
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
        options.fontPath = options.font;
        convertOneFont(options);
    }
};

function convertOneFont (options) {
    console.log('Working on', options.fontPath || options.font);

    let {
        fontPath, font, output, text, color, fontSize, lineHeight,
        canvasWidth, canvasHeight, dpr, maxWidth, offsetX, offsetY, bleeding
    } = options;

    if (fontPath && fontPath.indexOf('.ttf') < 0 && fontPath.indexOf('.otf') < 0) {
        console.warn('[Warn]: Font path should be end with *.ttf or *.otf. This file is ignored.');
        return;
    }

    output = output || './output.png';
    if (output.lastIndexOf('.png') !== output.length - '.png'.length) {
        output += '.png';
    }

    color = color || 'black';

    fontSize = fontSize || '12px';
    if (fontSize.indexOf('px') < 0) {
        throw new Error('font size should be in px.');
    }

    canvasWidth = +canvasWidth;
    canvasHeight = +canvasHeight;
    offsetX = +offsetX || 0;
    offsetY = +offsetY || 0;
    bleeding = bleeding == null ? 0.2 : +bleeding;
    lineHeight = parseFloat(lineHeight) || 1;

    dpr = parseInt(dpr, 10) || 1;
    if (dpr !== 1) {
        const unitIndex = fontSize.match(/\D/).index;
        const unit = fontSize.substr(unitIndex);
        fontSize = parseInt(fontSize, 10) * dpr + unit;

        if (maxWidth) {
            maxWidth = parseInt(maxWidth) * dpr;
        }
    }

    let fontObj;
    let fontName;
    if (fontPath) {
        fontObj = opentype.loadSync(fontPath);
        fontName = 'custom-' + new Date().getTime();
        registerFont(fontPath, {
            family: fontName
        });
    }
    else {
        fontName = font;
    }

    const boundingBox = getBoundingBox(fontName, fontSize, text, dpr);

    const canvasSize = getCanvasSize(text, canvasWidth, canvasHeight, boundingBox, maxWidth, lineHeight);

    const canvas = createCanvas(
        canvasSize.width * (1 + bleeding * 2),
        (canvasSize.height || boundingBox.height) * (1 + bleeding * 2)
    );
    const ctx = canvas.getContext('2d');

    const textArr = [];
    let currentLine = '';
    ctx.font = fontSize + ' "' + fontName + '"';
    if (maxWidth && boundingBox.width > maxWidth || text.indexOf('#') > -1) {
        // Multi lines
        for (let i = 0; i < text.length; ++i) {
            if (text[i] === '#') {
                // Split for new line
                textArr.push(currentLine);
                currentLine = '';
            }
            else {
                currentLine += text[i];
                const lineMeasure = ctx.measureText(currentLine);
                if (lineMeasure.width > maxWidth) {
                    textArr.push(currentLine);
                    currentLine = '';
                }
            }
        }
        if (currentLine) {
            textArr.push(currentLine);
        }
    }
    else {
        textArr.push(text);
    }

    for (let i = 0; i < textArr.length; ++i) {
        const textLeft = Math.ceil(canvasSize.width * bleeding + offsetX);
        const textTop = Math.ceil(canvasSize.height * bleeding + offsetY
            + boundingBox.height * (i + 1) * lineHeight);

        if (fontObj) {
            const path = fontObj.getPath(textArr[i], textLeft, Math.min(canvas.height, textTop),
                parseInt(fontSize, 10));
            path.fill = color;
            path.draw(ctx);
        }
        else {
            console.log('Using font ', ctx.font);
            ctx.fillStyle = color;
            ctx.fillText(textArr[i], textLeft, textTop);
        }
    }
    // console.log(ctx.fillStyle);

    const trimedCanvas = trimCanvas(canvas);
    const base64 = trimedCanvas.toDataURL('image/png');
    const data = base64.replace(/^data:image\/\w+;base64,/, '');
    const buf = Buffer.from(data, 'base64');
    // console.log('Writing to file', output);
    fs.writeFileSync(output, buf);
}

function getBoundingBox(fontName, fontSize, text, dpr) {
    const canvas = createCanvas(1, 1);
    const ctx = canvas.getContext('2d');
    ctx.font = fontSize + ' ' + fontName;

    const measure = ctx.measureText(text);
    measure.height = Math.ceil(measure.emHeightAscent);

    for (let attr in measure) {
        measure[attr] *= dpr;
    }
    // console.log(measure);

    return measure;
}

function getCanvasSize(text, canvasWidth, canvasHeight, boundingBox, maxWidth, lineHeight) {
    const splitLines = (text.match(/#/g) || []).length;
    if (!maxWidth || canvasWidth || canvasHeight) {
        return {
            width: canvasWidth || boundingBox.width,
            height: canvasHeight || boundingBox.height * (1 + splitLines)
        };
    }

    let lines = Math.ceil(boundingBox.width / maxWidth);
    if (text.indexOf('#') > -1) {
        lines += splitLines;
    }
    return {
        width: maxWidth,
        height: Math.ceil(boundingBox.height * lines) * lineHeight
    };
}

/**
 * Trim empty borders in canvas
 * Code from: https://gist.github.com/timdown/021d9c8f2aabc7092df564996f5afbbf
 */
function trimCanvas(canvas) {
    function rowBlank(imageData, width, y) {
        for (var x = 0; x < width; ++x) {
            if (imageData.data[y * width * 4 + x * 4 + 3] !== 0) return false;
        }
        return true;
    }

    function columnBlank(imageData, width, x, top, bottom) {
        for (var y = top; y < bottom; ++y) {
            if (imageData.data[y * width * 4 + x * 4 + 3] !== 0) return false;
        }
        return true;
    }

    var ctx = canvas.getContext('2d');
    var width = canvas.width;
    var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    var top = 0, bottom = imageData.height, left = 0, right = imageData.width;

    while (top < bottom && rowBlank(imageData, width, top)) ++top;
    while (bottom - 1 > top && rowBlank(imageData, width, bottom - 1)) --bottom;
    while (left < right && columnBlank(imageData, width, left, top, bottom)) ++left;
    while (right - 1 > left && columnBlank(imageData, width, right - 1, top, bottom)) --right;

    var trimmed = ctx.getImageData(left, top, right - left, bottom - top);
    var copy = createCanvas(trimmed.width, trimmed.height);
    var copyCtx = copy.getContext('2d');
    copy.width = trimmed.width;
    copy.height = trimmed.height;
    copyCtx.putImageData(trimmed, 0, 0);

    return copy;
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

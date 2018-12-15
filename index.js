#!/usr/bin/env node
const program = require('commander');
const font2img = require('./font2img');

program
    // .arguments('<file>')
    .option('-f, --font-path <path>', 'The TTF font path')
    .option('-o, --output <path>', 'The output image path')
    .option('-t, --text <text>', 'Text')
    .option('-c, --color <color>', 'Text color, which Canvas setFillStyle supports')
    .option('-s, --font-size <size>', 'Font size, can be "12px" or other forms that Canvas supports')
    .option('-cw, --canvas-width <number>', 'Canvas width, in pixels')
    .option('-ch, --canvas-height <number>', 'Canvas height, in pixels')
    .option('--dpr <number>', 'Canvas DPR, output scales')
    .option('--max-width <number>', 'Wrap into new lines if larger than this width')
    .option('--line-height <number>', 'Percentage of line height, 1 for default')
    .option('-x, --offset-x <number>', 'Text horizontal offset')
    .option('-y, --offset-y <number>', 'Text vertical offset')
    .option('-b, --bleeding <number>', 'Bleeding pixels')
    .action(function(file) {
        font2img({
            fontPath: program.fontPath,
            output: program.output,
            text: program.text,
            color: program.color,
            fontSize: program.fontSize,
            canvasWidth: program.canvasWidth,
            canvasHeight: program.canvasHeight,
            dpr: program.dpr,
            maxWidth: program.maxWidth,
            lineHeight: program.lineHeight,
            offsetX: program.offsetX,
            offsetY: program.offsetY,
            bleeding: program.bleeding
        });
    })
    .parse(process.argv);

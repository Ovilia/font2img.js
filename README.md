# font2img.js

Command line tool to generate images from TTF files

## Usage

```bash
$ font2img --help
Usage: font2img [options]

Options:
  -f, --font-path <path>        The TTF font path
  -o, --output <path>           The output image path
  -t, --text <text>             Text
  -c, --color <color>           Text color, which Canvas setFillStyle supports
  -s, --font-size <size>        Font size, can be "12px" or other forms that Canvas supports
  -w, --canvas-width <number>   Canvas width, in pixels
  -h, --canvas-height <number>  Canvas height, in pixels
  --dpr <number>                Canvas DPR, output scales
  -x, --offset-x <number>       Text horizontal offset
  -y, --offset-y <number>       Text vertical offset
  -b, --bleeding <number>       Bleeding pixels
  -h, --help                    output usage information
```

const { createCanvas } = require('canvas')

function generateSignatureImage(sigPairs) {
    // console.log(sigPairs)
    const width = 4500;
    const height = 400;
    const margin = 50;

    const noOfSigs = sigPairs.length;
    const noOfGaps = noOfSigs - 1;
    
    const canvas = createCanvas(width, height)
    const context = canvas.getContext('2d')

    context.fillStyle = '#fff'
    context.fillRect(0, 0, width, height)

    context.font = '80pt Arabic Typesetting'
    context.textAlign = 'center'
    context.textBaseline = 'top'
    context.fillStyle = '#000'

    // 2*margin + [4*SigWidth] + noOfGaps*gap = width
    var tWidth = 0;
    for(s of sigPairs){
        // console.log(s)
        tWidth += Math.max(context.measureText(s.Name).width, context.measureText(s.Position).width); 
    }

    gap = Math.round((width - tWidth - 2*margin) / noOfGaps);

    var tW = 0;

    for(n in sigPairs){
        var s = sigPairs[n];
        x_w1 = context.measureText(s.Name).width; 
        x_w2 = context.measureText(s.Position).width;
        x_wm = Math.max(x_w1, x_w2); 

        var x = width - (margin +  tW + gap*(n));
        context.fillText(s.Name, x - x_wm/2, 0.2*height);
        context.fillText(s.Position, x - x_wm/2, 0.55*height);

        tW += x_wm;
    }

    const buffer = canvas.toBuffer('image/png')
    return buffer;
}
module.exports = generateSignatureImage;
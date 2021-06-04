var imageLoader = document.getElementById('imageLoader');
    imageLoader.addEventListener('change', handleImage, false);
var flagLoader = document.getElementById('flagLoader');
    flagLoader.addEventListener('change', handleFlag, false);
var insetSpinner = document.getElementById('insetSpinner');
    insetSpinner.addEventListener('change', changeInset, false);
var flagSelector = document.getElementById('flagSelector');
    flagSelector.addEventListener('change', changeFlag, false);
var themeSelector = document.getElementById('themeSelector');
    themeSelector.addEventListener('change', changeTheme, false);
var savePrompt = document.getElementById("savePrompt");
var canvas0 = document.getElementById('fgCanvas');
var canvas1 = document.getElementById('imageCanvas');
var canvas2 = document.getElementById('previewCanvas');

function cleanupPixels() {
    var ctx = canvas0.getContext('2d');
    var imageData = ctx.getImageData(0, 0, canvas0.width, canvas0.height);
    let transparent = [0, 0, 0, 0];

    let pixelIndex = function(x, y) {
        return y * 4 * canvas0.width + (x * 4);
    }

    let getPixel = function(x, y) {
        let i = pixelIndex(x, y);
        return [ imageData.data[i], imageData.data[i + 1], imageData.data[i + 2], imageData.data[i + 3] ];
    }

    let setPixel = function(x, y, colorData) {
        let i = pixelIndex(x, y);
        imageData.data[i] = colorData[0];
        imageData.data[i + 1] = colorData[1];
        imageData.data[i + 2] = colorData[2];
        imageData.data[i + 3] = colorData[3];
    }

    let comparePixel = function(a, b) {
        return a[0] == b[0] && a[1] == b[1] && a[2] == b[2] && a[3] == b[3];
    }

    let selected = [];

    let coord2string = function(x, y) {
        return `${x},${y}`;
    }

    let string2coord = function(s) {
        return s.split(",").map(i => parseInt(i));
    }

    let maxIter = 128 * 128;
    for (var cy = 0; cy < canvas0.height; cy++) {    
        for (var cx = 0; cx < canvas0.width; cx++) {
            let cp = getPixel(cx, cy);
            let sxy = coord2string(cx, cy);
            let isMatch = comparePixel(transparent, cp);
            if (selected[sxy] === undefined) {
                selected[sxy] = isMatch;
            }
            if (isMatch) {
                // queue adjacent pixels
                [ `${cx-1},${cy}`, `${cx+1},${cy}`, `${cx},${cy-1}`, `${cx},${cy+1}` ]
                    .filter(s => {
                        let [sx, sy] = string2coord(s);
                        return sx >= 0 && sy >= 0 && sx < canvas0.width && sy < canvas0.height;
                    })
                    .forEach(s => selected[s] = true);
                // console.log(cx, cy, clickedPixel, cp);
            }
        }
    }
    console.log(`selected ${selected.length} pixels`);

    Object.keys(selected).forEach(s => {
        if (selected[s]) {
            let [cx, cy] = string2coord(s);
            setPixel(cx, cy, transparent);
        }
    });

    ctx.putImageData(imageData, 0, 0);
    modifiedImg.src = canvas0.toDataURL();
}

var clickx = -1000, clicky = -1000, clickpix = [0,0,0,0];
var dragdistance = 64;
var mouseDown = false;

function removePixels(x, y) {

    var ctx = canvas0.getContext('2d');
    var imageData = ctx.getImageData(0, 0, canvas0.width, canvas0.height);

    let transparent = [0, 0, 0, 0];

    let pixelIndex = function(x, y) {
        return y * 4 * canvas0.width + (x * 4);
    }

    let getPixel = function(x, y) {
        let i = pixelIndex(x, y);
        return [ imageData.data[i], imageData.data[i + 1], imageData.data[i + 2], imageData.data[i + 3] ];
    }

    let setPixel = function(x, y, colorData) {
        let i = pixelIndex(x, y);
        imageData.data[i] = colorData[0];
        imageData.data[i + 1] = colorData[1];
        imageData.data[i + 2] = colorData[2];
        imageData.data[i + 3] = colorData[3];
    }

    let comparePixel = function(a, b) {
        return a[0] == b[0] && a[1] == b[1] && a[2] == b[2] && a[3] == b[3];
    }

    let clickedPixel = getPixel(x, y);


    if (Math.pow(x - clickx, 2) + Math.pow(y - clicky, 2) >= Math.pow(dragdistance, 2) || (!comparePixel(clickedPixel, transparent) && !comparePixel(clickedPixel, clickpix))) {
        clickx = x;
        clicky = y;
        clickpix = clickedPixel; 

        let selected = [];
        let testQueue = [ `${x},${y}` ];

        let coord2string = function(x, y) {
            return `${x},${y}`;
        }

        let string2coord = function(s) {
            return s.split(",").map(i => parseInt(i));
        }

        let maxIter = 128 * 128;

        while (testQueue.length > 0 && maxIter-- > 0) {
            let [cx, cy] = string2coord(testQueue.pop());
            let cp = getPixel(cx, cy);
            let sxy = coord2string(cx, cy);
            let isMatch = comparePixel(clickedPixel, cp);
            selected[sxy] = isMatch; // mark as selected
            if (isMatch) {
                // queue adjacent pixels
                [ `${cx-1},${cy}`, `${cx+1},${cy}`, `${cx},${cy-1}`, `${cx},${cy+1}` ]
                    .filter(s => {
                        let [sx, sy] = string2coord(s);
                        return sx >= 0 && sy >= 0 && sx < canvas0.width && sy < canvas0.height;
                    })
                    .filter(s => selected[s] === undefined && !testQueue.includes(s))
                    .forEach(s => testQueue.unshift(s));
                // console.log(cx, cy, clickedPixel, cp);
            }
        }
        console.log(`selected ${selected.length} pixels`);
        console.log(selected);

        Object.keys(selected).forEach(s => {
            if (selected[s]) {
                let [cx, cy] = string2coord(s);
                setPixel(cx, cy, transparent);
            }
        });

        ctx.putImageData(imageData, 0, 0);
        modifiedImg.src = canvas0.toDataURL();
    }
}

function onClickFG(event) {
    let elem = canvas0;
    var elemLeft = elem.offsetLeft + elem.clientLeft,
        elemTop = elem.offsetTop + elem.clientTop;
    var pos = event.target.getClientRects()[0];
    var left = pos.left;
    var top = pos.top;
    var x = Math.floor((event.pageX - left - elem.clientLeft - window.pageXOffset) * (customImg.width / canvas0.width)),
        y = Math.floor((event.pageY - top - elem.clientTop - window.pageYOffset) * (customImg.height / canvas0.height));

    console.log(x, y);
    removePixels(x, y);
}

canvas0.addEventListener('mousedown', function(event) {
    canvas0.getContext('2d').save();
    onClickFG(event);
    mouseDown = true;
}, false);
window.addEventListener('mouseup', function(event) {
    mouseDown = false;
    clickx = -1000;
    clicky = -1000;
}, false);
canvas0.addEventListener('mousemove', function(event) {
    if (mouseDown) {
        onClickFG(event);
    }
}, false);

// var ctx = new CanvasRenderingContext2D();

let outputDiv = document.getElementById('outputDiv');

var customImg = null;
var prideImg = null;
var inset = 0;
var modifiedImg = new Image();

modifiedImg.onload = function() {
    if (prideImg != null) {
        renderAll();
    }
}

themeSelector.value = window.location.hash ? window.location.hash : "#dark";
changeTheme();

changeFlag();

function changeTheme() {
    let theme = themeSelector.value;
    document.body.setAttribute("theme", theme);
    history.replaceState(undefined, undefined, theme);
    //window.location.hash = theme;
}

function changeFlag() {
    let flag = flagSelector.value;
    if (flag !== 'custom') {
        prideImg = new Image();
        prideImg.onload = onPrideImageLoad;
        prideImg.src = flag;
        document.getElementById("prideImg").src = prideImg.src;
    }
}

function changeInset(event) {
    inset = insetSpinner.value;
    if (customImg != null && prideImg != null) {
        renderAll();
    }
}

function drawShadow(ctx) {
    ctx.shadowColor = "black";
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
}

function renderPreview(canvas) {
    canvas.width = customImg.width;
    canvas.height = customImg.height;
    var ctx = canvas.getContext('2d');
    let radius = Math.ceil(Math.min(customImg.width, customImg.height) / 2);

    // Create circular clipping region
    ctx.beginPath();
    ctx.arc(radius, radius, radius, 0, Math.PI * 2);
    ctx.clip();
    
    ctx.drawImage(prideImg,0,0,customImg.width,customImg.height);

    // Create circular clipping region
    ctx.beginPath();
    ctx.arc(radius, radius, radius - (inset * 2), 0, Math.PI * 2);
    ctx.clip();

    drawShadow(ctx);

    ctx.drawImage(modifiedImg,inset, inset, customImg.width - (inset * 2), customImg.height - (inset * 2));
}

function renderPfp(canvas) {
    canvas.width = customImg.width;
    canvas.height = customImg.height;
    let ctx = canvas.getContext('2d');
    let radius = Math.min(customImg.width, customImg.height) / 2;

    ctx.drawImage(prideImg,0,0,customImg.width,customImg.height);

    // Create circular clipping region
    ctx.beginPath();
    ctx.arc(radius, radius, radius - (inset * 2), 0, Math.PI * 2);
    ctx.clip();

    drawShadow(ctx);

    ctx.drawImage(modifiedImg,inset, inset, customImg.width - (inset * 2), customImg.height - (inset * 2));
}

function renderForeground(canvas) {
    canvas.width = customImg.width;
    canvas.height = customImg.height;
    let ctx = canvas.getContext('2d');

    ctx.drawImage(customImg,inset, inset, customImg.width - (inset * 2), customImg.height - (inset * 2));
    modifiedImg.src = canvas0.toDataURL();
}

function renderAll() {
    savePrompt.classList.remove("hidden");
    if (customImg != null && prideImg != null) {
        renderPfp(canvas1);
        renderPreview(canvas2);
    }
}

function onPrideImageLoad() {
    if (modifiedImg != null) {
        renderAll();
    }
}

function onCustomImageLoad() {
    insetSpinner.max = Math.floor(customImg.width / 4);
    renderForeground(canvas0);
}

function handleFlag(e){
    var reader = new FileReader();
    reader.onload = function(event){
        flagSelector.value = 'custom';
        prideImg = new Image();
        prideImg.onload = onPrideImageLoad;
        prideImg.src = event.target.result;
        document.getElementById("prideImg").src = prideImg.src;
    }
    reader.readAsDataURL(e.target.files[0]);     
}

function handleImage(e){
    var reader = new FileReader();
    reader.onload = function(event){
        customImg = new Image();
        customImg.onload = onCustomImageLoad;
        customImg.src = event.target.result;
        document.getElementById("customImg").src = customImg.src;
    }
    reader.readAsDataURL(e.target.files[0]);     
}
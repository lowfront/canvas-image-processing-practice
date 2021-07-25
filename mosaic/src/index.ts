const CELL_WIDTH = 10;
const CELL_HEIGHT = 10;
const REPEAT_PIXEL = 100;

function* imageDataLoop(imageData: ImageData) {
  for (let i = 0; i < imageData.data.length; i += 4) {
    const r = imageData.data[i];
    const g = imageData.data[i + 1];
    const b = imageData.data[i + 2];
    const a = imageData.data[i + 3];

    yield { i, r, g, b, a };
  }
}

function* mosaicLoop(ctx: CanvasRenderingContext2D, cellWidth: number, cellHeight: number, width: number, height: number) {
  const cols = Math.ceil(width / cellWidth);
  const rows = Math.ceil(height / cellHeight);

  for (let i = 0; i < cols * rows; i++) {
    const x = i % cols;
    const y = Math.floor(i / cols);
    const imageDataWidth =
      x === cols - 1 ? width % cellWidth || cellWidth : cellWidth;
    const imageDataHeight =
      y === rows - 1 ? height % cellHeight || cellHeight : cellHeight;
    const imageData = ctx.getImageData(
      x * cellWidth,
      y * cellHeight,
      imageDataWidth,
      imageDataHeight
    );

    let mergedR = 0;
    let mergedG = 0;
    let mergedB = 0;
    for (const { r, g, b } of imageDataLoop(imageData)) {
      mergedR += r;
      mergedG += g;
      mergedB += b;
    }
    mergedR = Math.floor(mergedR / (imageDataWidth * imageDataHeight));
    mergedG = Math.floor(mergedG / (imageDataWidth * imageDataHeight));
    mergedB = Math.floor(mergedB / (imageDataWidth * imageDataHeight));

    yield {
      x: x * cellWidth,
      y: y * cellHeight,
      width: imageDataWidth,
      height: imageDataHeight,
      r: mergedR,
      g: mergedG,
      b: mergedB
    };
  }
}

const main = async () => {
  const color = document.getElementById('color');
  const hex = document.getElementById('hex');
  const ocolor = document.getElementById('ocolor');
  const ohex = document.getElementById('ohex');
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  document.body.append(canvas);

  const img = new Image();
  await new Promise((res) => {
    img.crossOrigin = 'anonymous';
    img.onload = res;
    img.src = 'https://picsum.photos/800/400';
  });

  canvas.width = img.width;
  canvas.height = img.height * 2;

  ctx.drawImage(img, 0, 0);
  ctx.drawImage(img, 0, img.height);

  const imageData = ctx.getImageData(0, 0, img.width, img.height);

  const iterator = mosaicLoop(
    ctx,
    CELL_WIDTH,
    CELL_HEIGHT,
    img.width,
    img.height
  );
  const result = [];
  requestAnimationFrame(function draw() {
    Array.from({ length: REPEAT_PIXEL }, () => {
      const target = iterator.next();
      const pixelData = target.value;
      if (target.done) return;
      else if (pixelData){
        const { x, y, width, height, r, g, b } = pixelData;
        result.push({ x, y, width, height, r, g, b });
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(x, y, width, height);
      }
    });

    requestAnimationFrame(draw);
  });
  canvas.onpointermove = (ev: PointerEvent) => {
    const { layerX, layerY } = ev as unknown as {layerX: number, layerY: number};
    const cursorX = layerX;
    const cursorY = layerY % img.height;

    const target = result.find(({ x, y, width, height }) => {
      return (
        x <= cursorX &&
        cursorX <= x + width &&
        y <= cursorY &&
        cursorY <= y + height
      );
    });

    const index = (cursorX + cursorY * img.width) * 4;
    const or = imageData.data[index];
    const og = imageData.data[index + 1];
    const ob = imageData.data[index + 2];

    if (!target) return;
    const { r, g, b } = target;
    color.style.background = `rgb(${r}, ${g}, ${b})`;
    ocolor.style.background = `rgb(${or}, ${og}, ${ob})`;
    hex.innerText = `Cell:rgb(${r}, ${g}, ${b})`;
    ohex.innerText = `Origin:rgb(${or},${og},${ob})`;
  };
};

main();

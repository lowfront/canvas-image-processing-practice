import './index.css';

const MAX_PIXEL = 500;

function* imageDataLoop(imageData) {
  for (let i = 0; i < imageData.data.length; i += 4) {
    const r = imageData.data[i];
    const g = imageData.data[i + 1];
    const b = imageData.data[i + 2];
    const a = imageData.data[i + 3];

    yield [i, r, g, b, a];
  }
}

const main = async () => {
  const colorRgb = document.getElementById('colorRgb');
  const color = document.getElementById('color');
  const colorGray = document.getElementById('colorGray');
  const grayColor = document.getElementById('grayColor');
  const mc1 = document.getElementById('mc1');
  const mc2 = document.getElementById('mc2');
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d');

  const img = new Image();
  await new Promise((res) => {
    img.onload = res;
    img.crossOrigin = 'anonymous';
    img.src = 'https://picsum.photos/800/400';
  });
  canvas.width = img.width;
  canvas.height = img.height * 2;
  ctx.drawImage(img, 0, 0);
  ctx.drawImage(img, 0, img.height);
  const imageData = ctx.getImageData(
    0,
    img.height,
    canvas.width,
    canvas.height
  );
  const iterator = imageDataLoop(imageData);

  canvas.onpointermove = (ev: PointerEvent) => {
    const { layerX, layerY } = ev as unknown as {layerX: number, layerY: number};
    const x = layerX;
    const y = layerY % img.height;
    const i = (x + y * img.width) * 4;
    const r = imageData.data[i];
    const g = imageData.data[i + 1];
    const b = imageData.data[i + 2];
    const a = imageData.data[i + 3];
    const gray = Math.floor((r + g + b) / 3);
    mc1.style.background = color.style.background = colorRgb.innerText = `rgba(${r}, ${g}, ${b}, ${a})`;
    mc2.style.background = grayColor.style.background = colorGray.innerText = `rgba(${gray}, ${gray}, ${gray}, ${a})`;
    mc1.style.left = x + 'px';
    mc1.style.top = y + 'px';
    mc2.style.left = x + 'px';
    mc2.style.top = img.height + y + 'px';
  };

  let target;
  requestAnimationFrame(function draw() {
    Array.from({ length: MAX_PIXEL }, () => {
      target = iterator.next();
      if (!target.value) return;
      const [i, r, g, b, a] = target.value;
      const c = Math.floor((r + g + b) / 3);
      const index = Math.floor(i / 4);
      const x = index % canvas.width;
      const y = Math.floor(index / canvas.width);
      ctx.fillStyle = `rgb(${c}, ${c}, ${c})`;
      ctx.fillRect(x, img.height + y, 1, 1);
    });

    if (!target.done) requestAnimationFrame(draw);
  });
};

main();

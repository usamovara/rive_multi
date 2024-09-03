import "./styles.css";
import RiveCanvas from "@rive-app/canvas-advanced-single";

async function main() {
  console.clear();

  const rive = await RiveCanvas();

  const riveFileBytes = await (
    await fetch(new URL("./moving_things_001.riv", import.meta.url))
  ).arrayBuffer();

  const riveFile = await rive.load(new Uint8Array(riveFileBytes));

  let tileArray = [];
  let scrollPosition = 0;
  const columns = 3;
  const totalAnimations = 37;
  const margin = 20; // Margin between animations and from edges

  const canvas = document.querySelector("canvas");
  let renderer;
  let ctx; // 2D context for debug drawing

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    if (renderer) {
      renderer.delete();
    }
    renderer = rive.makeRenderer(canvas);
    ctx = canvas.getContext('2d'); // Get 2D context for debug drawing
    
    createAnimations();
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  function createAnimations() {
    tileArray = [];
    const availableWidth = canvas.width - margin * (columns + 1);
    const cellWidth = availableWidth / columns;
    const cellHeight = cellWidth; // Make cells square

    const rows = Math.ceil(totalAnimations / columns);
    const totalHeight = rows * (cellHeight + margin) + margin;

    for (let i = 0; i < totalAnimations; i++) {
      const col = i % columns;
      const row = Math.floor(i / columns);
      const x = margin + col * (cellWidth + margin);
      const y = margin + row * (cellHeight + margin);

      const tile = riveFile.artboardByName("Tile_Art1");
      tile.x = x;
      tile.y = y;
      tile.width = cellWidth;
      tile.height = cellHeight;

      tile.stateMachine = new rive.StateMachineInstance(
        tile.stateMachineByIndex(0),
        tile
      );

      tileArray.push(tile);
    }

    document.body.style.height = `${totalHeight}px`;
    console.log(`Total animations: ${tileArray.length}, Total height: ${totalHeight}px`);
  }

  window.addEventListener('scroll', () => {
    scrollPosition = window.scrollY;
  });

  let lastTime = 0;

  function renderLoop(time) {
    if (!lastTime) {
      lastTime = time;
    }
    const elapsedTimeInSeconds = (time - lastTime) / 1000;
    lastTime = time;

    renderer.clear();

    let visibleCount = 0;
    tileArray.forEach((tile, index) => {
      const isVisible = tile.y > scrollPosition - tile.height && tile.y < scrollPosition + canvas.height + tile.height;
      
      if (isVisible) {
        visibleCount++;
        renderer.save();

        tile.advance(elapsedTimeInSeconds);

        renderer.translate(tile.x, tile.y - scrollPosition);
        tile.draw(renderer);

        renderer.restore();

        tile.stateMachine.advance(elapsedTimeInSeconds);
        
        // Debug drawing using 2D context
        ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
        ctx.fillRect(tile.x, tile.y - scrollPosition, tile.width, tile.height);
      }
    });
    
    console.log(`Visible animations: ${visibleCount}, Scroll position: ${scrollPosition}px`);

    rive.requestAnimationFrame(renderLoop);
  }
  rive.requestAnimationFrame(renderLoop);
}

main();
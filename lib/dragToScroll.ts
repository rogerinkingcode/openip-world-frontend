// Ref callback que deixa arrastar com o mouse uma faixa de rolagem horizontal
// (ex.: abas que não cabem na tela). No toque o navegador já rola sozinho; com
// mouse não, e a barra fica escondida — sem isto a faixa parece travada numa
// janela estreita. Uso: <div ref={dragToScroll} className="overflow-x-auto">.
// Função de módulo (identidade estável) com cleanup de ref do React 19.

// Abaixo disso é clique, não arrasto.
const DRAG_THRESHOLD_PX = 5;

export function dragToScroll(node: HTMLElement | null) {
  if (!node) return;
  const el = node;

  let pointerId: number | null = null;
  let startX = 0;
  let startScrollLeft = 0;
  let scale = 1;
  let dragged = false;

  function onPointerDown(e: PointerEvent) {
    dragged = false;
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    if (el.scrollWidth <= el.clientWidth) return;

    pointerId = e.pointerId;
    startX = e.clientX;
    startScrollLeft = el.scrollLeft;
    // clientX vem em px da janela; scrollLeft, em px do elemento. Com o zoom do
    // <html> (--app-zoom) eles diferem, e sem converter a faixa não acompanha o mouse.
    scale = el.getBoundingClientRect().width / el.offsetWidth || 1;
  }

  function onPointerMove(e: PointerEvent) {
    if (e.pointerId !== pointerId) return;
    const dx = e.clientX - startX;

    if (!dragged) {
      if (Math.abs(dx) < DRAG_THRESHOLD_PX) return;
      dragged = true;
      el.setPointerCapture(e.pointerId);
      el.style.cursor = "grabbing";
    }
    el.scrollLeft = startScrollLeft - dx / scale;
  }

  function onPointerEnd(e: PointerEvent) {
    if (e.pointerId !== pointerId) return;
    pointerId = null;
    el.style.cursor = "";
  }

  // Soltar o mouse depois de arrastar dispara click no botão sob o cursor; esse
  // clique não é intenção de trocar de aba.
  function onClickCapture(e: MouseEvent) {
    if (!dragged) return;
    e.preventDefault();
    e.stopPropagation();
    dragged = false;
  }

  el.addEventListener("pointerdown", onPointerDown);
  el.addEventListener("pointermove", onPointerMove);
  el.addEventListener("pointerup", onPointerEnd);
  el.addEventListener("pointercancel", onPointerEnd);
  el.addEventListener("click", onClickCapture, true);

  return () => {
    el.removeEventListener("pointerdown", onPointerDown);
    el.removeEventListener("pointermove", onPointerMove);
    el.removeEventListener("pointerup", onPointerEnd);
    el.removeEventListener("pointercancel", onPointerEnd);
    el.removeEventListener("click", onClickCapture, true);
  };
}

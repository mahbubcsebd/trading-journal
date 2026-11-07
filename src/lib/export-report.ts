const PIXEL_RATIO = 2;

export type ReportFormat = "png" | "pdf";

async function renderPng(node: HTMLElement): Promise<{ dataUrl: string; width: number; height: number }> {
  const { toPng } = await import("html-to-image");
  const backgroundColor = getComputedStyle(node).backgroundColor;
  const dataUrl = await toPng(node, {
    pixelRatio: PIXEL_RATIO,
    backgroundColor,
    filter: (el) => !(el instanceof HTMLElement && el.dataset.exportHide !== undefined),
  });
  return { dataUrl, width: node.offsetWidth, height: node.offsetHeight };
}

function download(href: string, filename: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  a.click();
}

/** Capture `node` and save it as a PNG or a single-page PDF sized to the content. */
export async function exportReport(node: HTMLElement, format: ReportFormat, baseName: string): Promise<void> {
  const { dataUrl, width, height } = await renderPng(node);
  if (format === "png") {
    download(dataUrl, `${baseName}.png`);
    return;
  }
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({
    orientation: width > height ? "landscape" : "portrait",
    unit: "px",
    format: [width, height],
    hotfixes: ["px_scaling"],
  });
  pdf.addImage(dataUrl, "PNG", 0, 0, width, height);
  pdf.save(`${baseName}.pdf`);
}

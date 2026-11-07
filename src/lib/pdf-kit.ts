import type { jsPDF } from "jspdf";

export type RGB = readonly [number, number, number];

export const COLORS = {
  ink: [27, 24, 46],
  text: [38, 38, 52],
  muted: [112, 112, 128],
  line: [226, 226, 234],
  tint: [247, 246, 251],
  accent: [109, 76, 224],
  accentSoft: [196, 181, 253],
  win: [22, 148, 94],
  loss: [220, 53, 82],
  white: [255, 255, 255],
} as const satisfies Record<string, RGB>;

export const PAGE = {
  width: 595.28,
  height: 841.89,
  margin: 40,
  footer: 34,
  runningHeader: 30,
} as const;
const CONTENT_WIDTH = PAGE.width - PAGE.margin * 2;
const CELL_PAD = 6;

export type Cell = string | { text: string; color?: RGB; bold?: boolean };
export interface Column {
  header: string;
  weight: number;
  align?: "left" | "right" | "center";
}
export interface Row {
  cells: Cell[];
  note?: string;
  bold?: boolean;
}
export interface Tile {
  label: string;
  value: string;
  hint?: string;
  color?: RGB;
}
export interface Bar {
  label: string;
  value: number;
}

const cellText = (c: Cell) => (typeof c === "string" ? c : c.text);

/** Thin layer over jsPDF: tracks the vertical cursor and handles page breaks. */
export class PdfCanvas {
  y: number = PAGE.margin;

  constructor(
    readonly pdf: jsPDF,
    private readonly runningTitle: string,
  ) {}

  private fill(c: RGB) {
    this.pdf.setFillColor(c[0], c[1], c[2]);
  }
  private stroke(c: RGB) {
    this.pdf.setDrawColor(c[0], c[1], c[2]);
  }
  private ink(c: RGB) {
    this.pdf.setTextColor(c[0], c[1], c[2]);
  }
  font(size: number, bold = false, color: RGB = COLORS.text) {
    this.pdf.setFont("helvetica", bold ? "bold" : "normal");
    this.pdf.setFontSize(size);
    this.ink(color);
  }
  private fit(text: string, maxWidth: number): string {
    if (this.pdf.getTextWidth(text) <= maxWidth) return text;
    let t = text;
    while (t.length > 1 && this.pdf.getTextWidth(`${t}...`) > maxWidth)
      t = t.slice(0, -1);
    return `${t}...`;
  }
  wrap(text: string, width: number, size: number): string[] {
    this.font(size);
    return this.pdf.splitTextToSize(text, width) as string[];
  }

  private get limit() {
    return PAGE.height - PAGE.footer - 8;
  }
  ensure(height: number) {
    if (this.y + height > this.limit) this.newPage();
  }
  newPage() {
    this.pdf.addPage();
    this.y = PAGE.margin + PAGE.runningHeader - 8;
  }
  gap(h: number) {
    this.y += h;
  }

  /** Adds running header (page 2+) and "Page x of y" footer to every page. */
  finalize() {
    const total = this.pdf.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      this.pdf.setPage(i);
      this.stroke(COLORS.line);
      this.pdf.setLineWidth(0.5);
      this.pdf.line(
        PAGE.margin,
        PAGE.height - PAGE.footer,
        PAGE.width - PAGE.margin,
        PAGE.height - PAGE.footer,
      );
      this.font(7.5, false, COLORS.muted);
      this.pdf.text(
        this.runningTitle,
        PAGE.margin,
        PAGE.height - PAGE.footer + 14,
      );
      this.pdf.text(
        `Page ${i} of ${total}`,
        PAGE.width - PAGE.margin,
        PAGE.height - PAGE.footer + 14,
        { align: "right" },
      );
      if (i > 1) {
        this.font(7.5, true, COLORS.accent);
        this.pdf.text(
          this.runningTitle.toUpperCase(),
          PAGE.margin,
          PAGE.margin - 6,
          { charSpace: 0.8 },
        );
        this.line(
          PAGE.margin,
          PAGE.margin + 2,
          PAGE.width - PAGE.margin,
          PAGE.margin + 2,
        );
      }
    }
  }
  private line(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: RGB = COLORS.line,
    width = 0.5,
  ) {
    this.stroke(color);
    this.pdf.setLineWidth(width);
    this.pdf.line(x1, y1, x2, y2);
  }

  banner(opts: {
    kicker: string;
    title: string;
    subtitle: string;
    rightLabel: string;
    rightValue: string;
    rightColor: RGB;
  }) {
    const h = 104;
    this.fill(COLORS.ink);
    this.pdf.rect(0, 0, PAGE.width, h, "F");
    this.fill(COLORS.accent);
    this.pdf.rect(0, h, PAGE.width, 4, "F");
    this.font(8, true, COLORS.accentSoft);
    this.pdf.text(opts.kicker.toUpperCase(), PAGE.margin, 38, {
      charSpace: 1.2,
    });
    this.font(24, true, COLORS.white);
    this.pdf.text(opts.title, PAGE.margin, 66);
    this.font(9, false, [190, 186, 215]);
    this.pdf.text(opts.subtitle, PAGE.margin, 85);
    this.font(8, true, COLORS.accentSoft);
    this.pdf.text(opts.rightLabel.toUpperCase(), PAGE.width - PAGE.margin, 38, {
      align: "right",
      charSpace: 1.2,
    });
    this.font(24, true, opts.rightColor);
    this.pdf.text(opts.rightValue, PAGE.width - PAGE.margin, 66, {
      align: "right",
    });
    this.y = h + 28;
  }

  /** `minBody` keeps the heading together with at least that much content below it. */
  section(title: string, subtitle?: string, minBody = 60) {
    this.ensure(minBody + 16);
    this.fill(COLORS.accent);
    this.pdf.rect(PAGE.margin, this.y - 9, 3, 12, "F");
    this.font(11, true, COLORS.ink);
    this.pdf.text(title, PAGE.margin + 10, this.y);
    if (subtitle) {
      this.font(8, false, COLORS.muted);
      this.pdf.text(subtitle, PAGE.width - PAGE.margin, this.y, {
        align: "right",
      });
    }
    this.y += 16;
  }

  tiles(items: Tile[], cols: number, height = 54) {
    const gap = 10;
    const w = (CONTENT_WIDTH - gap * (cols - 1)) / cols;
    for (let i = 0; i < items.length; i += cols) {
      this.ensure(height + gap);
      items.slice(i, i + cols).forEach((t, j) => {
        const x = PAGE.margin + j * (w + gap);
        this.fill(COLORS.tint);
        this.pdf.roundedRect(x, this.y, w, height, 6, 6, "F");
        this.font(7, true, COLORS.muted);
        this.pdf.text(t.label.toUpperCase(), x + 11, this.y + 17, {
          charSpace: 0.6,
        });
        this.font(17, true, t.color ?? COLORS.ink);
        this.pdf.text(this.fit(t.value, w - 20), x + 11, this.y + 38);
        if (t.hint) {
          this.font(7, false, COLORS.muted);
          this.pdf.text(this.fit(t.hint, w - 20), x + 11, this.y + 49);
        }
      });
      this.y += height + gap;
    }
  }

  segmentBar(parts: { value: number; color: RGB; label: string }[]) {
    const total = parts.reduce((s, p) => s + p.value, 0);
    this.ensure(34);
    if (total === 0) return;
    let x = PAGE.margin;
    parts.forEach((p) => {
      const w = (p.value / total) * CONTENT_WIDTH;
      if (w <= 0) return;
      this.fill(p.color);
      this.pdf.rect(x, this.y, w, 9, "F");
      x += w;
    });
    this.y += 22;
    let lx = PAGE.margin;
    parts
      .filter((p) => p.value > 0)
      .forEach((p) => {
        this.fill(p.color);
        this.pdf.circle(lx + 3, this.y - 3, 3, "F");
        this.font(8, false, COLORS.text);
        const text = `${p.label}: ${p.value}`;
        this.pdf.text(text, lx + 10, this.y);
        lx += 10 + this.pdf.getTextWidth(text) + 18;
      });
    this.y += 28;
  }

  bullets(lines: string[]) {
    lines.forEach((line) => {
      const wrapped = this.wrap(line, CONTENT_WIDTH - 16, 9);
      this.ensure(wrapped.length * 12 + 6);
      this.fill(COLORS.accent);
      this.pdf.circle(PAGE.margin + 3, this.y - 3, 1.8, "F");
      this.font(9);
      this.pdf.text(wrapped, PAGE.margin + 14, this.y, {
        lineHeightFactor: 1.35,
      });
      this.y += wrapped.length * 12 + 4;
    });
    this.y += 6;
  }

  meterRow(
    label: string,
    pct: number,
    color: RGB,
    right: string,
    labelWidth = 150,
  ) {
    this.ensure(18);
    const trackX = PAGE.margin + labelWidth;
    const trackW = CONTENT_WIDTH - labelWidth - 90;
    this.font(8.5, false, COLORS.text);
    this.pdf.text(this.fit(label, labelWidth - 10), PAGE.margin, this.y + 7);
    this.fill(COLORS.line);
    this.pdf.roundedRect(trackX, this.y, trackW, 8, 4, 4, "F");
    const fillW = (Math.max(0, Math.min(100, pct)) / 100) * trackW;
    if (fillW > 0) {
      this.fill(color);
      this.pdf.roundedRect(trackX, this.y, Math.max(fillW, 6), 8, 4, 4, "F");
    }
    this.font(8.5, true, COLORS.text);
    this.pdf.text(right, PAGE.width - PAGE.margin, this.y + 7, {
      align: "right",
    });
    this.y += 18;
  }

  table(
    columns: Column[],
    rows: Row[],
    opts: { rowHeight?: number; fontSize?: number } = {},
  ) {
    const rowH = opts.rowHeight ?? 18;
    const fs = opts.fontSize ?? 8;
    const headerH = 20;
    const totalWeight = columns.reduce((s, c) => s + c.weight, 0);
    const widths = columns.map((c) => (c.weight / totalWeight) * CONTENT_WIDTH);
    const xs = widths.map(
      (_, i) => PAGE.margin + widths.slice(0, i).reduce((s, w) => s + w, 0),
    );
    const textX = (i: number) => {
      const align = columns[i].align ?? "left";
      if (align === "right") return xs[i] + widths[i] - CELL_PAD;
      if (align === "center") return xs[i] + widths[i] / 2;
      return xs[i] + CELL_PAD;
    };

    const drawHeader = () => {
      this.fill(COLORS.ink);
      this.pdf.roundedRect(
        PAGE.margin,
        this.y,
        CONTENT_WIDTH,
        headerH,
        4,
        4,
        "F",
      );
      this.font(7, true, COLORS.white);
      columns.forEach((c, i) =>
        this.pdf.text(c.header.toUpperCase(), textX(i), this.y + 13, {
          align: c.align ?? "left",
          charSpace: 0.5,
        }),
      );
      this.y += headerH;
    };

    this.ensure(headerH + rowH * Math.min(rows.length, 2));
    drawHeader();
    rows.forEach((row, r) => {
      const noteLines = row.note
        ? this.wrap(
            `Note: ${row.note}`,
            CONTENT_WIDTH - CELL_PAD * 2,
            7.5,
          ).slice(0, 3)
        : [];
      const h = rowH + (noteLines.length ? noteLines.length * 10 + 4 : 0);
      if (this.y + h > this.limit) {
        this.newPage();
        drawHeader();
      }
      if (r % 2 === 1) {
        this.fill(COLORS.tint);
        this.pdf.rect(PAGE.margin, this.y, CONTENT_WIDTH, h, "F");
      }
      row.cells.forEach((cell, i) => {
        const bold = row.bold || (typeof cell !== "string" && cell.bold);
        const color =
          typeof cell === "string" ? COLORS.text : (cell.color ?? COLORS.text);
        this.font(fs, !!bold, color);
        this.pdf.text(
          this.fit(cellText(cell), widths[i] - CELL_PAD * 2),
          textX(i),
          this.y + rowH / 2 + fs / 3,
          {
            align: columns[i].align ?? "left",
          },
        );
      });
      if (noteLines.length) {
        this.font(7.5, false, COLORS.muted);
        this.pdf.text(noteLines, PAGE.margin + CELL_PAD, this.y + rowH + 3, {
          lineHeightFactor: 1.25,
        });
      }
      this.y += h;
    });
    this.line(PAGE.margin, this.y, PAGE.margin + CONTENT_WIDTH, this.y);
    this.y += 16;
  }

  private axis(values: number[], plot: { top: number; bottom: number }) {
    const min = Math.min(0, ...values);
    const max = Math.max(0, ...values);
    const span = max === min ? 2 : max - min;
    const pad = span * 0.1;
    const lo = min === 0 && max === 0 ? -1 : min < 0 ? min - pad : 0;
    const hi = max === 0 && min === 0 ? 1 : max > 0 ? max + pad : 0;
    const yOf = (v: number) =>
      plot.bottom - ((v - lo) / (hi - lo)) * (plot.bottom - plot.top);
    return { lo, hi, yOf };
  }

  private gridAndLabels(
    axis: { lo: number; hi: number; yOf: (v: number) => number },
    x0: number,
    x1: number,
    money: (v: number) => string,
  ) {
    const ticks = 4;
    for (let i = 0; i <= ticks; i++) {
      const v = axis.lo + ((axis.hi - axis.lo) * i) / ticks;
      const y = axis.yOf(v);
      this.line(x0, y, x1, y, COLORS.line, 0.4);
      this.font(7, false, COLORS.muted);
      this.pdf.text(money(v), x0 - 6, y + 2.5, { align: "right" });
    }
    if (axis.lo < 0 && axis.hi > 0) {
      this.pdf.setLineDashPattern([3, 3], 0);
      this.line(x0, axis.yOf(0), x1, axis.yOf(0), COLORS.muted, 0.7);
      this.pdf.setLineDashPattern([], 0);
    }
  }

  lineChart(points: Bar[], money: (v: number) => string, height = 150) {
    this.ensure(height + 10);
    const left = 54;
    const x0 = PAGE.margin + left;
    const x1 = PAGE.width - PAGE.margin - 8;
    const plot = { top: this.y + 6, bottom: this.y + height - 20 };
    const axis = this.axis(
      points.map((p) => p.value),
      plot,
    );
    this.gridAndLabels(axis, x0, x1, money);
    const xOf = (i: number) =>
      points.length === 1
        ? (x0 + x1) / 2
        : x0 + ((x1 - x0) * i) / (points.length - 1);
    const last = points[points.length - 1]?.value ?? 0;
    const color = last >= 0 ? COLORS.win : COLORS.loss;
    this.stroke(color);
    this.pdf.setLineWidth(1.6);
    points
      .slice(1)
      .forEach((p, i) =>
        this.pdf.line(
          xOf(i),
          axis.yOf(points[i].value),
          xOf(i + 1),
          axis.yOf(p.value),
        ),
      );
    if (points.length <= 40) {
      this.fill(color);
      points.forEach((p, i) =>
        this.pdf.circle(xOf(i), axis.yOf(p.value), 2, "F"),
      );
    }
    const step = Math.ceil(points.length / 10);
    this.font(7, false, COLORS.muted);
    points.forEach((p, i) => {
      if (i % step === 0)
        this.pdf.text(p.label, xOf(i), plot.bottom + 13, { align: "center" });
    });
    this.y += height + 8;
  }

  barChart(
    bars: Bar[],
    money: (v: number) => string,
    opts: { height?: number; showValues?: boolean } = {},
  ) {
    const height = opts.height ?? 140;
    this.ensure(height + 10);
    const left = 54;
    const x0 = PAGE.margin + left;
    const x1 = PAGE.width - PAGE.margin - 8;
    const plot = { top: this.y + 14, bottom: this.y + height - 20 };
    const axis = this.axis(
      bars.map((b) => b.value),
      plot,
    );
    this.gridAndLabels(axis, x0, x1, money);
    const slot = (x1 - x0) / bars.length;
    const barW = Math.min(slot * 0.62, 34);
    const zeroY = axis.yOf(0);
    bars.forEach((b, i) => {
      const cx = x0 + slot * i + slot / 2;
      if (b.value !== 0) {
        const top = Math.min(axis.yOf(b.value), zeroY);
        const h = Math.max(Math.abs(axis.yOf(b.value) - zeroY), 1.5);
        this.fill(b.value > 0 ? COLORS.win : COLORS.loss);
        this.pdf.roundedRect(cx - barW / 2, top, barW, h, 1.5, 1.5, "F");
        if (opts.showValues) {
          this.font(7, true, COLORS.text);
          const ty = b.value > 0 ? top - 3 : top + h + 8;
          this.pdf.text(money(b.value), cx, ty, { align: "center" });
        }
      }
      this.font(7, false, COLORS.muted);
      this.pdf.text(b.label, cx, plot.bottom + 13, { align: "center" });
    });
    this.y += height + 8;
  }
}

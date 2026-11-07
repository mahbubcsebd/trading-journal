import { eachDayOfInterval, format, parseISO, startOfWeek } from "date-fns";
import { CHECKLIST } from "./checklist";
import { COLORS, PdfCanvas, type Cell, type RGB } from "./pdf-kit";
import {
  avgPlannedRR,
  byDirection,
  bySymbol,
  longestStreaks,
  maxDrawdown,
  sortChronological,
} from "./report-stats";
import {
  byType,
  disciplineOf,
  disciplineSplit,
  groupByDate,
  ruleAdherence,
  summarize,
  type Summary,
} from "./stats";
import { TRADE_TYPES, type Account, type Trade } from "./types";

export type ReportPeriod = "week" | "month";

export interface ReportInput {
  trades: Trade[];
  accounts: Account[];
  accountName: string;
  showAccountSplit: boolean;
  period: ReportPeriod;
  from: Date;
  to: Date;
}

const ISO = "yyyy-MM-dd";
const GOOD_RULE_PCT = 80;
const OK_RULE_PCT = 50;

const money = (n: number) =>
  `${n < 0 ? "-" : ""}$${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const signed = (n: number) => (n > 0 ? `+${money(n)}` : money(n));
const axisMoney = (v: number) =>
  `${v < 0 ? "-" : ""}$${Math.abs(Math.round(v)).toLocaleString("en-US")}`;
const pct = (n: number) => `${Math.round(n)}%`;
const pnlColor = (n: number): RGB =>
  n > 0 ? COLORS.win : n < 0 ? COLORS.loss : COLORS.text;
const pnlCell = (n: number, bold = false): Cell => ({
  text: signed(n),
  color: pnlColor(n),
  bold,
});
const rateText = (s: Summary) => (s.wins + s.losses ? pct(s.winRate) : "-");
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

function summaryCells(label: string, s: Summary): Cell[] {
  return [
    label,
    String(s.total),
    String(s.wins),
    String(s.losses),
    rateText(s),
    pnlCell(s.net, true),
    s.total ? pnlCell(s.net / s.total) : "-",
  ];
}
const SUMMARY_COLUMNS = (first: string) => [
  { header: first, weight: 2.4 },
  { header: "Trades", weight: 1, align: "right" as const },
  { header: "Wins", weight: 1, align: "right" as const },
  { header: "Losses", weight: 1, align: "right" as const },
  { header: "Win rate", weight: 1.2, align: "right" as const },
  { header: "Net P/L", weight: 1.6, align: "right" as const },
  { header: "Avg / trade", weight: 2, align: "right" as const },
];

function takeaways(
  input: ReportInput,
  s: Summary,
  dayTotals: { key: string; net: number }[],
): string[] {
  const lines: string[] = [];
  const tradingDays = dayTotals.length;
  lines.push(
    `${signed(s.net)} net across ${plural(s.total, "trade")} on ${plural(tradingDays, "trading day")}; ${s.wins} won, ${s.losses} lost${s.breakeven ? `, ${s.breakeven} breakeven` : ""} (${rateText(s)} win rate).`,
  );
  if (dayTotals.length) {
    const best = dayTotals.reduce((a, b) => (b.net > a.net ? b : a));
    const worst = dayTotals.reduce((a, b) => (b.net < a.net ? b : a));
    lines.push(
      `Best day ${format(parseISO(best.key), "EEE d MMM")} (${signed(best.net)}); worst day ${format(parseISO(worst.key), "EEE d MMM")} (${signed(worst.net)}).`,
    );
  }
  const split = disciplineSplit(input.trades);
  if (split.full.total && split.partial.total) {
    lines.push(
      `Trades with all rules followed won ${rateText(split.full)} (${signed(split.full.net)}) vs ${rateText(split.partial)} (${signed(split.partial.net)}) when a rule was skipped.`,
    );
  } else if (split.full.total) {
    lines.push(
      `Every trade followed all rules (${rateText(split.full)} win rate).`,
    );
  } else {
    lines.push(
      `No trade followed every rule this ${input.period}. Average rule score ${pct(s.discipline)}.`,
    );
  }
  const weakest = [...ruleAdherence(input.trades)].sort(
    (a, b) => a.pct - b.pct,
  )[0];
  if (weakest && weakest.pct < 100)
    lines.push(
      `Most-skipped rule: "${weakest.label}" (followed on ${pct(weakest.pct)} of trades).`,
    );
  return lines;
}

function renderOverview(
  c: PdfCanvas,
  input: ReportInput,
  s: Summary,
  chrono: Trade[],
  dayTotals: { key: string; net: number }[],
) {
  const dd = maxDrawdown(chrono);
  const streak = longestStreaks(chrono);
  const rr = avgPlannedRR(input.trades);
  const best = dayTotals.length
    ? dayTotals.reduce((a, b) => (b.net > a.net ? b : a))
    : null;
  const worst = dayTotals.length
    ? dayTotals.reduce((a, b) => (b.net < a.net ? b : a))
    : null;
  c.section("Performance summary");
  c.tiles(
    [
      {
        label: "Net P/L",
        value: signed(s.net),
        color: pnlColor(s.net),
        hint: `${plural(s.total, "trade")}`,
      },
      {
        label: "Win rate",
        value: rateText(s),
        hint: `${s.wins}W / ${s.losses}L${s.breakeven ? ` / ${s.breakeven}BE` : ""}`,
      },
      {
        label: "Profit factor",
        value: s.profitFactor === null ? "-" : s.profitFactor.toFixed(2),
        hint: "gross win / gross loss",
      },
      {
        label: "Rules followed",
        value: pct(s.discipline),
        hint: "average per trade",
      },
      {
        label: "Avg win",
        value: s.wins ? signed(s.avgWin) : "-",
        color: COLORS.win,
      },
      {
        label: "Avg loss",
        value: s.losses ? signed(-s.avgLoss) : "-",
        color: COLORS.loss,
      },
      {
        label: "Expectancy",
        value: s.total ? signed(s.net / s.total) : "-",
        color: pnlColor(s.net),
        hint: "avg P/L per trade",
      },
      {
        label: "Max drawdown",
        value: dd ? money(-dd) : "-",
        color: dd ? COLORS.loss : COLORS.ink,
        hint: "peak to trough",
      },
      {
        label: "Best day",
        value: best ? signed(best.net) : "-",
        color: best ? pnlColor(best.net) : COLORS.ink,
        hint: best ? format(parseISO(best.key), "EEE d MMM") : "",
      },
      {
        label: "Worst day",
        value: worst ? signed(worst.net) : "-",
        color: worst ? pnlColor(worst.net) : COLORS.ink,
        hint: worst ? format(parseISO(worst.key), "EEE d MMM") : "",
      },
      {
        label: "Streaks",
        value: `${streak.win}W / ${streak.loss}L`,
        hint: "longest win / loss run",
      },
      {
        label: "Planned RR",
        value: rr === null ? "-" : `1:${rr.toFixed(1)}`,
        hint: "avg from entry / SL / TP",
      },
    ],
    4,
  );
  c.segmentBar([
    { value: s.wins, color: COLORS.win, label: "Wins" },
    { value: s.losses, color: COLORS.loss, label: "Losses" },
    { value: s.breakeven, color: COLORS.muted, label: "Breakeven" },
  ]);
  c.section("Key takeaways");
  c.bullets(takeaways(input, s, dayTotals));
}

function renderCharts(
  c: PdfCanvas,
  input: ReportInput,
  days: Date[],
  net: Record<string, number>,
) {
  const isWeek = input.period === "week";
  const label = (d: Date) => format(d, isWeek ? "EEE d" : "d");
  c.section("Profit curve", "cumulative P/L by day", 150);
  const curve = days.reduce<{ label: string; value: number }[]>((acc, d) => {
    const prev = acc.length ? acc[acc.length - 1].value : 0;
    return [
      ...acc,
      { label: label(d), value: prev + (net[format(d, ISO)] ?? 0) },
    ];
  }, []);
  c.lineChart(curve, axisMoney);
  c.section("Daily result", "net P/L per day", 140);
  c.barChart(
    days.map((d) => ({ label: label(d), value: net[format(d, ISO)] ?? 0 })),
    axisMoney,
    { showValues: isWeek },
  );
}

function renderBreakdowns(
  c: PdfCanvas,
  input: ReportInput,
  days: Date[],
  byDay: Record<string, Trade[]>,
) {
  const dayRows = days
    .filter((d) => input.period === "week" || byDay[format(d, ISO)])
    .map((d): { cells: Cell[] } => {
      const list = byDay[format(d, ISO)] ?? [];
      const s = summarize(list);
      const rules = list.length
        ? pct(
            (list.reduce((a, t) => a + disciplineOf(t), 0) / list.length) * 100,
          )
        : "-";
      return {
        cells: [
          format(d, "EEE, d MMM"),
          String(s.total || "-"),
          String(s.wins || "-"),
          String(s.losses || "-"),
          rateText(s),
          s.total ? pnlCell(s.net) : "-",
          rules,
        ],
      };
    });
  c.section("Day by day");
  c.table(
    [
      { header: "Date", weight: 2.4 },
      { header: "Trades", weight: 1, align: "right" },
      { header: "Wins", weight: 1, align: "right" },
      { header: "Losses", weight: 1, align: "right" },
      { header: "Win rate", weight: 1.2, align: "right" },
      { header: "Net P/L", weight: 1.6, align: "right" },
      { header: "Rules", weight: 1.2, align: "right" },
    ],
    dayRows,
  );

  if (input.period === "month") {
    const weeks = new Map<string, Trade[]>();
    for (const t of input.trades) {
      const key = format(
        startOfWeek(parseISO(t.trade_date), { weekStartsOn: 1 }),
        ISO,
      );
      weeks.set(key, [...(weeks.get(key) ?? []), t]);
    }
    c.section("Week by week");
    c.table(
      SUMMARY_COLUMNS("Week"),
      [...weeks.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, list]) => ({
          cells: summaryCells(
            `Week of ${format(parseISO(key), "d MMM")}`,
            summarize(list),
          ),
        })),
    );
  }

  c.section("By trade type");
  c.table(
    SUMMARY_COLUMNS("Type"),
    byType(input.trades).map(({ type, summary }) => ({
      cells: summaryCells(
        TRADE_TYPES.find((t) => t.value === type)?.label ?? type,
        summary,
      ),
    })),
  );
  c.section("By direction");
  c.table(
    SUMMARY_COLUMNS("Direction"),
    byDirection(input.trades).map(({ key, summary }) => ({
      cells: summaryCells(key, summary),
    })),
  );
  c.section("By symbol");
  c.table(
    SUMMARY_COLUMNS("Symbol"),
    bySymbol(input.trades).map(({ key, summary }) => ({
      cells: summaryCells(key, summary),
    })),
  );

  if (input.showAccountSplit) {
    c.section("By account");
    c.table(
      SUMMARY_COLUMNS("Account"),
      input.accounts.map((a) => ({
        cells: summaryCells(
          a.name,
          summarize(input.trades.filter((t) => t.account_id === a.id)),
        ),
      })),
    );
  }
}

function renderDiscipline(c: PdfCanvas, input: ReportInput, s: Summary) {
  c.section("Rule discipline", `${CHECKLIST.length} rules`);
  ruleAdherence(input.trades).forEach((r) => {
    const followed = Math.round((r.pct / 100) * s.total);
    const color =
      r.pct >= GOOD_RULE_PCT
        ? COLORS.win
        : r.pct >= OK_RULE_PCT
          ? COLORS.accent
          : COLORS.loss;
    c.meterRow(
      r.label,
      r.pct,
      color,
      `${pct(r.pct)}  (${followed}/${s.total})`,
    );
  });
  c.gap(8);
  const split = disciplineSplit(input.trades);
  c.section("Do the rules pay off?");
  c.table(SUMMARY_COLUMNS("Group"), [
    { cells: summaryCells("All rules followed", split.full) },
    { cells: summaryCells("Some rules skipped", split.partial) },
  ]);
}

function renderTradeLog(c: PdfCanvas, chrono: Trade[]) {
  c.newPage();
  c.section("Trade log", `${plural(chrono.length, "trade")}, oldest first`);
  const num = (n: number | null) => (n === null ? "-" : String(n));
  c.table(
    [
      { header: "Date", weight: 1.3 },
      { header: "Symbol", weight: 1.3 },
      { header: "Type", weight: 1.2 },
      { header: "Side", weight: 0.8 },
      { header: "Lots", weight: 0.8, align: "right" },
      { header: "Entry", weight: 1.2, align: "right" },
      { header: "SL", weight: 1.2, align: "right" },
      { header: "TP", weight: 1.2, align: "right" },
      { header: "Exit", weight: 1.2, align: "right" },
      { header: "P/L", weight: 1.4, align: "right" },
      { header: "Rules", weight: 0.9, align: "right" },
    ],
    chrono.map((t) => ({
      cells: [
        format(parseISO(t.trade_date), "d MMM"),
        t.symbol.toUpperCase(),
        TRADE_TYPES.find((x) => x.value === t.trade_type)?.label ??
          t.trade_type,
        {
          text: t.direction === "buy" ? "Buy" : "Sell",
          color: t.direction === "buy" ? COLORS.win : COLORS.loss,
        },
        String(Number(t.lot_size.toFixed(2))),
        num(t.entry_price),
        num(t.stop_loss),
        num(t.take_profit),
        num(t.exit_price),
        pnlCell(t.pnl, true),
        `${CHECKLIST.filter((r) => t.checklist?.[r.id]).length}/${CHECKLIST.length}`,
      ],
      note: t.notes?.trim() || undefined,
    })),
    { rowHeight: 20, fontSize: 7.5 },
  );
}

/** Builds a multi-page A4 PDF report (selectable text, real tables) and triggers the download. */
export async function downloadReportPdf(
  input: ReportInput,
  fileName: string,
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
  const isWeek = input.period === "week";
  const periodLabel = isWeek
    ? `${format(input.from, "d MMM")} - ${format(input.to, "d MMM yyyy")}`
    : format(input.from, "MMMM yyyy");
  const c = new PdfCanvas(
    pdf,
    `Trading Journal - ${input.accountName} - ${periodLabel}`,
  );

  const s = summarize(input.trades);
  const chrono = sortChronological(input.trades);
  const byDay = groupByDate(input.trades);
  const days = eachDayOfInterval({ start: input.from, end: input.to });
  const net = Object.fromEntries(
    Object.entries(byDay).map(([k, list]) => [
      k,
      list.reduce((a, t) => a + t.pnl, 0),
    ]),
  );
  const dayTotals = Object.entries(net).map(([key, value]) => ({
    key,
    net: value,
  }));

  c.banner({
    kicker: `Trading Journal - ${isWeek ? "Weekly" : "Monthly"} report`,
    title: periodLabel,
    subtitle: `${input.accountName}   |   Generated ${format(new Date(), "d MMM yyyy")}`,
    rightLabel: "Net P/L",
    rightValue: s.total ? signed(s.net) : "-",
    rightColor: s.net >= 0 ? [134, 239, 172] : [253, 164, 175],
  });

  if (s.total === 0) {
    c.font(11, false, COLORS.muted);
    pdf.text("No trades were logged in this period.", 40, c.y + 10);
  } else {
    renderOverview(c, input, s, chrono, dayTotals);
    renderCharts(c, input, days, net);
    renderBreakdowns(c, input, days, byDay);
    renderDiscipline(c, input, s);
    renderTradeLog(c, chrono);
  }
  c.finalize();
  pdf.save(`${fileName}.pdf`);
}

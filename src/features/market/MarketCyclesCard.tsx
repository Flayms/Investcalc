import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { dataText } from "@/features/i18n/datasets";
import { useI18n } from "@/features/i18n/i18n";
import { type Dataset, monthLabel } from "@/simulation/dataset";
import { bearMarkets, bullMarkets, median } from "@/simulation/market";

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div>
      <dt className="text-sm lg:text-xs text-muted-foreground">{label}</dt>
      <dd className="text-lg font-semibold tabular-nums">{value}</dd>
      {note && <dd className="text-sm lg:text-xs text-muted-foreground tabular-nums">{note}</dd>}
    </div>
  );
}

/** Historic bear markets (≥ 20 % below the all-time high) and the bull markets between them. */
export function MarketCyclesCard({ dataset, months }: { dataset: Dataset; months: number }) {
  const n = dataset.returns.length;
  const first = Math.max(0, n - months);
  const bears = useMemo(() => bearMarkets(dataset), [dataset]);
  const bulls = useMemo(() => bullMarkets(dataset), [dataset]);
  const inFrame = bears.filter((b) => (b.recoveredIndex ?? n - 1) >= first);
  const recovered = bears.flatMap((b) => (b.monthsToRecover === null ? [] : [b.monthsToRecover]));
  const medianDecline = median(bears.map((b) => b.decline));
  const medianRecovery = median(recovered);
  const medianBullGain = median(bulls.past.map((b) => b.gain));
  const medianBullMonths = median(bulls.past.map((b) => b.months));
  const { t, format } = useI18n();
  const c = t.cycles;

  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle className="text-base">{c.title}</CardTitle>
        <CardDescription className="text-sm lg:text-xs">
          {c.description(dataText(t, dataset).name)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Stat
            label={c.bearMarketsSince(dataset.start.slice(0, 4))}
            value={String(bears.length)}
            note={
              medianDecline === null
                ? undefined
                : c.medianDecline(format.signedPercent(medianDecline))
            }
          />
          <Stat
            label={c.medianRecovery}
            value={medianRecovery === null ? "–" : format.duration(medianRecovery)}
            note={c.peakToHigh}
          />
          {bulls.current && (
            <Stat
              label={c.currentBull}
              value={format.gain(bulls.current.gain)}
              note={c.bullSince(bulls.current.start, format.duration(bulls.current.months))}
            />
          )}
          {medianBullGain !== null && medianBullMonths !== null && (
            <Stat
              label={c.medianBull}
              value={format.gain(medianBullGain)}
              note={c.completed(format.duration(medianBullMonths), bulls.past.length)}
            />
          )}
        </dl>
        {inFrame.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {c.noBearMarket(monthLabel(dataset, first))}
          </p>
        ) : (
          <Table className="text-sm lg:text-xs">
            <TableHeader>
              <TableRow>
                <TableHead>{c.peak}</TableHead>
                <TableHead>{c.low}</TableHead>
                <TableHead className="text-right">{c.decline}</TableHead>
                <TableHead className="hidden text-right sm:table-cell">{c.peakToLow}</TableHead>
                <TableHead className="hidden sm:table-cell">{c.recovered}</TableHead>
                <TableHead className="text-right">{c.peakToRecovery}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...inFrame].reverse().map((b) => (
                <TableRow key={b.peak}>
                  <TableCell
                    className="tabular-nums"
                    title={b.peakIndex === 0 ? c.firstMonth : undefined}
                  >
                    {b.peakIndex === 0 ? `≤ ${b.peak}` : b.peak}
                  </TableCell>
                  <TableCell className="tabular-nums">{b.trough}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums text-red-800 dark:text-red-300">
                    {format.signedPercent(b.decline)}
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums sm:table-cell">
                    {format.duration(b.monthsDown)}
                  </TableCell>
                  <TableCell className="hidden tabular-nums sm:table-cell">
                    {b.recovered ?? "–"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {b.monthsToRecover === null ? (
                      <span className="rounded bg-red-100 px-1.5 py-0.5 text-red-900 dark:bg-red-400/15 dark:text-red-200">
                        {c.ongoing}
                      </span>
                    ) : (
                      format.duration(b.monthsToRecover)
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <p className="text-xs lg:text-[11px] text-muted-foreground">
          {c.note}
          {dataset.priceType === "average" && c.averageNote}
        </p>
      </CardContent>
    </Card>
  );
}

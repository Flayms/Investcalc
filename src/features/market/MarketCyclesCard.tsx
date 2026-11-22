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
import { formatDuration, formatGain, formatSignedPercent } from "@/lib/format";
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

  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle className="text-base">Bear and bull markets</CardTitle>
        <CardDescription className="text-sm lg:text-xs">
          {dataset.name}: declines of 20 % or more from the all-time high, from the peak to the
          lowest point before the high was regained. Bull markets run from a bear market's low to
          the next peak.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Stat
            label={`Bear markets since ${dataset.start.slice(0, 4)}`}
            value={String(bears.length)}
            note={
              medianDecline === null
                ? undefined
                : `median decline ${formatSignedPercent(medianDecline)}`
            }
          />
          <Stat
            label="Median time to recover"
            value={medianRecovery === null ? "–" : formatDuration(medianRecovery)}
            note="peak to new all-time high"
          />
          {bulls.current && (
            <Stat
              label="Current bull market"
              value={formatGain(bulls.current.gain)}
              note={`since ${bulls.current.start} · ${formatDuration(bulls.current.months)}`}
            />
          )}
          {medianBullGain !== null && medianBullMonths !== null && (
            <Stat
              label="Median bull market"
              value={formatGain(medianBullGain)}
              note={`${formatDuration(medianBullMonths)} · ${bulls.past.length} completed`}
            />
          )}
        </dl>
        {inFrame.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No bear market in this time frame (since {monthLabel(dataset, first)}).
          </p>
        ) : (
          <Table className="text-sm lg:text-xs">
            <TableHeader>
              <TableRow>
                <TableHead>Peak</TableHead>
                <TableHead>Low</TableHead>
                <TableHead className="text-right">Decline</TableHead>
                <TableHead className="hidden text-right sm:table-cell">Peak to low</TableHead>
                <TableHead className="hidden sm:table-cell">Recovered</TableHead>
                <TableHead className="text-right">Peak to recovery</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...inFrame].reverse().map((b) => (
                <TableRow key={b.peak}>
                  <TableCell
                    className="tabular-nums"
                    title={
                      b.peakIndex === 0 ? "First data month; the peak may be earlier" : undefined
                    }
                  >
                    {b.peakIndex === 0 ? `≤ ${b.peak}` : b.peak}
                  </TableCell>
                  <TableCell className="tabular-nums">{b.trough}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums text-red-800 dark:text-red-300">
                    {formatSignedPercent(b.decline)}
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums sm:table-cell">
                    {formatDuration(b.monthsDown)}
                  </TableCell>
                  <TableCell className="hidden tabular-nums sm:table-cell">
                    {b.recovered ?? "–"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {b.monthsToRecover === null ? (
                      <span className="rounded bg-red-100 px-1.5 py-0.5 text-red-900 dark:bg-red-400/15 dark:text-red-200">
                        ongoing
                      </span>
                    ) : (
                      formatDuration(b.monthsToRecover)
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <p className="text-xs lg:text-[11px] text-muted-foreground">
          Based on monthly total returns, so short crashes look milder than in daily closes.
          {dataset.priceType === "average" &&
            " This index uses monthly average prices: e.g. 2020 and 2022 stay just above −20 % here."}
        </p>
      </CardContent>
    </Card>
  );
}

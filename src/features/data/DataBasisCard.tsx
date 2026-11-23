import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPercent } from "@/lib/format";
import { type Dataset, datasetStats } from "@/simulation/dataset";

export function DataBasisCard({ datasets }: { datasets: Record<string, Dataset> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Data basis</CardTitle>
        <CardDescription className="text-sm lg:text-xs">
          Monthly total returns (dividends reinvested) in USD. Short rate (SOFR proxy): 3-month US
          T-bill (FRED TB3MS), 1926–1933 the 1-month T-bill, before that the long-term rate.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3 md:hidden">
          {Object.values(datasets).map((d) => {
            const s = datasetStats(d);
            return (
              <article key={d.id} className="rounded-lg border p-3 text-sm">
                <h3 className="font-medium">{d.name}</h3>
                <p className="text-muted-foreground">{d.description}</p>
                <dl className="my-2 grid grid-cols-2 gap-x-3 gap-y-1">
                  <div>
                    <dt className="text-xs text-muted-foreground">Period</dt>
                    <dd className="tabular-nums">
                      {s.from.slice(0, 4)}–{s.to.slice(0, 4)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">CAGR</dt>
                    <dd className="tabular-nums">{formatPercent(s.cagr)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Volatility</dt>
                    <dd className="tabular-nums">{formatPercent(s.volatility)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Daily data from</dt>
                    <dd className="tabular-nums">{d.dailyFrom ?? "–"}</dd>
                  </div>
                </dl>
                <p className="text-xs text-muted-foreground">{d.source}</p>
              </article>
            );
          })}
        </div>
        <Table className="hidden md:table text-sm lg:text-xs">
          <TableHeader>
            <TableRow>
              <TableHead>Index</TableHead>
              <TableHead>Period</TableHead>
              <TableHead className="text-right">Months</TableHead>
              <TableHead className="text-right">CAGR</TableHead>
              <TableHead className="text-right">Volatility</TableHead>
              <TableHead>Daily data from</TableHead>
              <TableHead>Source</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.values(datasets).map((d) => {
              const s = datasetStats(d);
              return (
                <TableRow key={d.id}>
                  <TableCell className="whitespace-normal align-top">
                    <div className="font-medium">{d.name}</div>
                    <div className="text-muted-foreground">{d.description}</div>
                  </TableCell>
                  <TableCell className="align-top tabular-nums">
                    {s.from} – {s.to}
                  </TableCell>
                  <TableCell className="text-right align-top tabular-nums">{s.months}</TableCell>
                  <TableCell className="text-right align-top tabular-nums">
                    {formatPercent(s.cagr)}
                  </TableCell>
                  <TableCell className="text-right align-top tabular-nums">
                    {formatPercent(s.volatility)}
                  </TableCell>
                  <TableCell className="align-top tabular-nums">{d.dailyFrom ?? "–"}</TableCell>
                  <TableCell className="max-w-72 whitespace-normal align-top text-muted-foreground">
                    {d.source}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <div className="grid gap-4 text-sm lg:text-xs text-muted-foreground md:grid-cols-2">
          <div>
            <h3 className="mb-1 font-semibold text-foreground">How paths are generated</h3>
            <p>
              <span className="font-medium text-foreground">Historical windows</span> replay every
              real period of the chosen length.{" "}
              <span className="font-medium text-foreground">Random slicing</span> uses a stationary
              block bootstrap: each path is stitched together from random contiguous blocks of
              history (mean length configurable) instead of single random months, so crashes,
              volatility regimes and interest rates stay together. This matters for leveraged ETFs
              (volatility drag) and SMA strategies (trends).
            </p>
          </div>
          <div>
            <h3 className="mb-1 font-semibold text-foreground">Assumptions & limits</h3>
            <ul className="list-disc space-y-0.5 pl-4">
              <li>Amounts in €, returns in USD: currency effects and inflation are ignored.</li>
              <li>
                S&P 500 uses monthly average prices (smooths monthly returns); SMA signals act one
                month later.
              </li>
              <li>
                Leveraged ETFs: daily reset, drag from the realised variance of the same month's
                daily returns (estimated where no daily data exists), financing on (L − 1).
              </li>
              <li>
                German taxes: 26.375 %, 30 % Teilfreistellung, allowance, Vorabpauschale, loss
                carry-forward.
              </li>
              <li>Past returns do not guarantee future returns. Not investment advice.</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

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
import { type CurrencyData, type Dataset, datasetStats, monthLabel } from "@/simulation/dataset";

type Props = { datasets: Record<string, Dataset>; eur: CurrencyData };

export function DataBasisCard({ datasets, eur }: Props) {
  const eurTo = monthLabel(eur, eur.fx.length - 1);
  const { t, format } = useI18n();
  const db = t.dataBasis;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{db.title}</CardTitle>
        <CardDescription className="text-sm lg:text-xs">{db.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3 md:hidden">
          {Object.values(datasets).map((d) => {
            const s = datasetStats(d);
            const text = dataText(t, d);
            return (
              <article key={d.id} className="rounded-lg border p-3 text-sm">
                <h3 className="font-medium">{text.name}</h3>
                <p className="text-muted-foreground">{text.description}</p>
                <dl className="my-2 grid grid-cols-2 gap-x-3 gap-y-1">
                  <div>
                    <dt className="text-xs text-muted-foreground">{db.period}</dt>
                    <dd className="tabular-nums">
                      {s.from.slice(0, 4)}–{s.to.slice(0, 4)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">{db.cagr}</dt>
                    <dd className="tabular-nums">{format.percent(s.cagr)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">{db.volatility}</dt>
                    <dd className="tabular-nums">{format.percent(s.volatility)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">{db.dailyFrom}</dt>
                    <dd className="tabular-nums">{d.dailyFrom ?? "–"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">{db.dailySignalFrom}</dt>
                    <dd className="tabular-nums">{d.daily?.from ?? db.monthlySignal}</dd>
                  </div>
                </dl>
                <p className="text-xs text-muted-foreground">{text.source}</p>
              </article>
            );
          })}
        </div>
        <Table className="hidden md:table text-sm lg:text-xs">
          <TableHeader>
            <TableRow>
              <TableHead>{db.index}</TableHead>
              <TableHead>{db.period}</TableHead>
              <TableHead className="text-right">{db.months}</TableHead>
              <TableHead className="text-right">{db.cagr}</TableHead>
              <TableHead className="text-right">{db.volatility}</TableHead>
              <TableHead>{db.dailyFrom}</TableHead>
              <TableHead>{db.dailySignalFrom}</TableHead>
              <TableHead>{db.source}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.values(datasets).map((d) => {
              const s = datasetStats(d);
              const text = dataText(t, d);
              return (
                <TableRow key={d.id}>
                  <TableCell className="whitespace-normal align-top">
                    <div className="font-medium">{text.name}</div>
                    <div className="text-muted-foreground">{text.description}</div>
                  </TableCell>
                  <TableCell className="align-top tabular-nums">
                    {s.from} – {s.to}
                  </TableCell>
                  <TableCell className="text-right align-top tabular-nums">{s.months}</TableCell>
                  <TableCell className="text-right align-top tabular-nums">
                    {format.percent(s.cagr)}
                  </TableCell>
                  <TableCell className="text-right align-top tabular-nums">
                    {format.percent(s.volatility)}
                  </TableCell>
                  <TableCell className="align-top tabular-nums">{d.dailyFrom ?? "–"}</TableCell>
                  <TableCell className="align-top tabular-nums">
                    {d.daily?.from ?? db.monthlySignal}
                  </TableCell>
                  <TableCell className="max-w-72 whitespace-normal align-top text-muted-foreground">
                    {text.source}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <div className="text-sm lg:text-xs text-muted-foreground">
          <h3 className="mb-1 font-semibold text-foreground">{db.euro(eur.start, eurTo)}</h3>
          <p>
            {db.euroText} {dataText(t, eur).source}
          </p>
        </div>
        <div className="grid gap-4 text-sm lg:text-xs text-muted-foreground md:grid-cols-2">
          <div>
            <h3 className="mb-1 font-semibold text-foreground">{db.pathsTitle}</h3>
            <p>
              <span className="font-medium text-foreground">{db.historicalWindows}</span>{" "}
              {db.historicalWindowsText}{" "}
              <span className="font-medium text-foreground">{db.randomSlicing}</span>{" "}
              {db.randomSlicingText}
            </p>
          </div>
          <div>
            <h3 className="mb-1 font-semibold text-foreground">{db.assumptionsTitle}</h3>
            <ul className="list-disc space-y-0.5 pl-4">
              {db.assumptions.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

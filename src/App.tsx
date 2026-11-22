import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function App() {
  return (
    <main className="mx-auto max-w-5xl p-8">
      <Card>
        <CardHeader>
          <CardTitle>
            <h1>Investcalc</h1>
          </CardTitle>
          <CardDescription>Monte Carlo simulations of ETF investment strategies.</CardDescription>
        </CardHeader>
      </Card>
    </main>
  );
}

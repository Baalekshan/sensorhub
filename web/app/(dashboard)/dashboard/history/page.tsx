import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HistoryTable } from "@/components/dashboard/history-table";

export default function HistoryPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">History</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Sensor Readings History</CardTitle>
        </CardHeader>
        <CardContent>
          <HistoryTable />
        </CardContent>
      </Card>
    </div>
  );
} 
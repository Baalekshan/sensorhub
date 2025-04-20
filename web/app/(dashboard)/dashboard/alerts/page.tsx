import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertsTable } from "@/components/dashboard/alerts-table";

export default function AlertsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Alerts</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Active Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <AlertsTable />
        </CardContent>
      </Card>
    </div>
  );
} 
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLiveData } from '@/hooks/useLiveData';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader2 } from 'lucide-react';

interface LiveDataPageProps {
  params: {
    id: string;
  };
}

export default function LiveDataPage({ params }: LiveDataPageProps) {
  const { id } = params;
  const { isConnected, error, lastData, dataHistory } = useLiveData({
    deviceId: id,
    autoConnect: true,
  });

  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    if (lastData) {
      setChartData(prev => {
        const newData = [...prev, {
          timestamp: new Date().toLocaleTimeString(),
          ...lastData.sensors
        }];
        // Keep last 50 data points for the chart
        return newData.slice(-50);
      });
    }
  }, [lastData]);

  if (error) {
    return (
      <div className="p-4">
        <Card className="bg-destructive/10">
          <CardContent className="pt-6">
            <p className="text-destructive">Error: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Live Data</h1>
        <div className="flex items-center space-x-2">
          <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-muted-foreground">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {!isConnected ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <p>Connecting to device...</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Current Values */}
          <Card>
            <CardHeader>
              <CardTitle>Current Values</CardTitle>
            </CardHeader>
            <CardContent>
              {lastData ? (
                <div className="space-y-4">
                  {Object.entries(lastData.sensors).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center">
                      <span className="font-medium capitalize">{key}</span>
                      <span>{String(value)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Waiting for data...</p>
              )}
            </CardContent>
          </Card>

          {/* Historical Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Historical Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {lastData && Object.keys(lastData.sensors).map((sensor, index) => (
                      <Line
                        key={sensor}
                        type="monotone"
                        dataKey={sensor}
                        stroke={`hsl(${index * 60}, 70%, 50%)`}
                        dot={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Data History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Data History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-[400px] overflow-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left p-2">Time</th>
                  {lastData && Object.keys(lastData.sensors).map(sensor => (
                    <th key={sensor} className="text-left p-2 capitalize">{sensor}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dataHistory.map((data, index) => (
                  <tr key={index} className="border-t">
                    <td className="p-2">{new Date(data.timestamp).toLocaleString()}</td>
                    {Object.entries(data.sensors).map(([key, value]) => (
                      <td key={key} className="p-2">{String(value)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
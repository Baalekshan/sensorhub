"use client"

import { useState, useEffect } from 'react';
import { useSubscription } from '@apollo/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { ArrowDown, ArrowUp, Battery, Cpu, Droplets, MoreHorizontal, RefreshCcw, ThermometerSun, Timer } from 'lucide-react';
import { gql } from '@apollo/client';

const SENSOR_READING_SUBSCRIPTION = gql`
  subscription OnSensorReadingAdded {
    sensorReadingAdded {
      sensorId
      value
      timestamp
      unit
      status
    }
  }
`;

const SENSOR_STATUS_SUBSCRIPTION = gql`
  subscription OnSensorStatusUpdated {
    sensorStatusUpdated {
      sensorId
      status
    }
  }
`;

interface SensorData {
  id: string;
  name: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  status: string;
  trend: string;
  icon: React.ReactNode;
  trendValue: string;
  chartData: Array<{ time: string; value: number }>;
}

export default function LiveDataPage() {
  const [sensorData, setSensorData] = useState<Record<string, SensorData>>({});
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const { data: readingData } = useSubscription(SENSOR_READING_SUBSCRIPTION);
  const { data: statusData } = useSubscription(SENSOR_STATUS_SUBSCRIPTION);

  useEffect(() => {
    if (readingData?.sensorReadingAdded) {
      const { sensorId, value, timestamp, unit, status } = readingData.sensorReadingAdded;
      setSensorData(prev => ({
        ...prev,
        [sensorId]: {
          ...prev[sensorId],
          value,
          unit,
          status,
          chartData: [
            ...(prev[sensorId]?.chartData || []).slice(-19),
            { time: new Date(timestamp).toLocaleTimeString(), value }
          ]
        }
      }));
      setLastUpdated(new Date());
    }
  }, [readingData]);

  useEffect(() => {
    if (statusData?.sensorStatusUpdated) {
      const { sensorId, status } = statusData.sensorStatusUpdated;
      setSensorData(prev => ({
        ...prev,
        [sensorId]: {
          ...prev[sensorId],
          status
        }
      }));
    }
  }, [statusData]);

  const handleRefresh = () => {
    setLastUpdated(new Date());
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'critical':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'normal':
        return <Badge variant="success">Normal</Badge>;
      case 'warning':
        return <Badge variant="warning">Warning</Badge>;
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatLastUpdated = () => {
    return lastUpdated.toLocaleTimeString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Live Data</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Last updated: {formatLastUpdated()}
          </span>
          <Button variant="outline" size="icon" onClick={handleRefresh}>
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(sensorData).map(([id, sensor]) => (
              <Card key={id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {sensor.name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {sensor.icon}
                    {getStatusBadge(sensor.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {sensor.value} {sensor.unit}
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    {sensor.trend === 'up' ? (
                      <ArrowUp className="h-3 w-3 text-green-500" />
                    ) : (
                      <ArrowDown className="h-3 w-3 text-red-500" />
                    )}
                    <span className="ml-1">{sensor.trendValue}</span>
                  </div>
                  <Progress
                    value={(sensor.value - sensor.min) / (sensor.max - sensor.min) * 100}
                    className="mt-2"
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          {Object.entries(sensorData).map(([id, sensor]) => (
            <Card key={id}>
              <CardHeader>
                <CardTitle>{sensor.name}</CardTitle>
                <CardDescription>
                  Real-time {sensor.name.toLowerCase()} monitoring
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={sensor.chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#8884d8"
                        fill="#8884d8"
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
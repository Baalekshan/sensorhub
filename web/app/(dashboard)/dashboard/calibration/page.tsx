"use client"

import { useState } from 'react';
import Link from 'next/link';
import { Calendar, Clock, Download, MoreHorizontal, RefreshCcw, Settings, Upload } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import useToastNotifications from '@/hooks/use-toast-notifications';

// Mock data for calibration
const mockCalibrationData = [
  {
    id: '1',
    sensorName: 'Soil Moisture Sensor',
    sensorType: 'Soil Moisture',
    lastCalibration: '15 days ago',
    status: 'Calibrated',
    calibrationPoints: 3,
    offset: -2.5,
    gain: 1.05,
    accuracy: '±2%',
    updatedBy: 'John Doe',
    nextCalibration: '45 days',
  },
  {
    id: '2',
    sensorName: 'Greenhouse Temperature',
    sensorType: 'Temperature',
    lastCalibration: '2 months ago',
    status: 'Needs Calibration',
    calibrationPoints: 2,
    offset: 0.8,
    gain: 0.98,
    accuracy: '±0.5°C',
    updatedBy: 'Sarah Johnson',
    nextCalibration: 'Overdue',
  },
  {
    id: '3',
    sensorName: 'Water Level Sensor',
    sensorType: 'Water Level',
    lastCalibration: '2 days ago',
    status: 'Calibrated',
    calibrationPoints: 4,
    offset: 0,
    gain: 1.0,
    accuracy: '±1%',
    updatedBy: 'Michael Chen',
    nextCalibration: '58 days',
  },
  {
    id: '4',
    sensorName: 'Indoor Humidity',
    sensorType: 'Humidity',
    lastCalibration: '1 month ago',
    status: 'Warning',
    calibrationPoints: 2,
    offset: 1.2,
    gain: 0.97,
    accuracy: '±3%',
    updatedBy: 'John Doe',
    nextCalibration: '5 days',
  },
  {
    id: '5',
    sensorName: 'Weather Station',
    sensorType: 'Weather',
    lastCalibration: '3 months ago',
    status: 'Needs Calibration',
    calibrationPoints: 3,
    offset: -1.5,
    gain: 1.02,
    accuracy: 'Unknown',
    updatedBy: 'Emma Williams',
    nextCalibration: 'Overdue',
  },
];

export default function CalibrationPage() {
  const [calibrationData, setCalibrationData] = useState(mockCalibrationData);
  const { toast } = useToastNotifications();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Calibrated':
        return <Badge variant="outline" className="border-green-500 text-green-500">Calibrated</Badge>;
      case 'Needs Calibration':
        return <Badge variant="destructive">Needs Calibration</Badge>;
      case 'Warning':
        return <Badge variant="outline" className="border-amber-500 text-amber-500">Calibration Soon</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleExportCalibration = (id: string) => {
    toast({
      title: "Calibration data exported",
      description: "The calibration data has been downloaded to your device.",
    });
  };

  const handleImportCalibration = (id: string) => {
    toast({
      title: "Upload calibration data",
      description: "Please select a calibration file to upload.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Calibration</h2>
          <p className="text-muted-foreground">
            Manage and update calibration settings for your sensors.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <RefreshCcw className="mr-2 h-4 w-4" /> Sync Calibration
          </Button>
          <Button>
            <Settings className="mr-2 h-4 w-4" /> Calibration Settings
          </Button>
        </div>
      </div>

      <Tabs defaultValue="sensors" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sensors">Sensors</TabsTrigger>
          <TabsTrigger value="history">Calibration History</TabsTrigger>
          <TabsTrigger value="settings">Default Parameters</TabsTrigger>
        </TabsList>
        <TabsContent value="sensors" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {calibrationData.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">{item.sensorName}</CardTitle>
                    {getStatusBadge(item.status)}
                  </div>
                  <CardDescription>{item.sensorType}</CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-sm">
                        <p className="text-muted-foreground">Last Calibration</p>
                        <div className="flex items-center gap-1 font-medium">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          {item.lastCalibration}
                        </div>
                      </div>
                      <div className="text-sm">
                        <p className="text-muted-foreground">Next Calibration</p>
                        <div className="flex items-center gap-1 font-medium">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className={item.nextCalibration === 'Overdue' ? 'text-destructive' : ''}>
                            {item.nextCalibration}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-sm">
                        <p className="text-muted-foreground">Calibration Points</p>
                        <p className="font-medium">{item.calibrationPoints}</p>
                      </div>
                      <div className="text-sm">
                        <p className="text-muted-foreground">Accuracy</p>
                        <p className="font-medium">{item.accuracy}</p>
                      </div>
                      <div className="text-sm">
                        <p className="text-muted-foreground">Offset</p>
                        <p className="font-medium">{item.offset}</p>
                      </div>
                      <div className="text-sm">
                        <p className="text-muted-foreground">Gain</p>
                        <p className="font-medium">{item.gain}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-2 flex justify-between">
                  <Button variant="default" size="sm" asChild>
                    <Link href={`/dashboard/calibration/${item.id}`}>
                      Calibrate
                    </Link>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleExportCalibration(item.id)}>
                        <Download className="mr-2 h-4 w-4" /> Export Calibration
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleImportCalibration(item.id)}>
                        <Upload className="mr-2 h-4 w-4" /> Import Calibration
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/calibration/${item.id}/history`}>
                          <Clock className="mr-2 h-4 w-4" /> View History
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Calibration History</CardTitle>
              <CardDescription>
                View all past calibration operations across your devices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="h-12 px-4 text-left align-middle font-medium">Sensor</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Date</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Updated By</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Result</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b transition-colors hover:bg-muted/50">
                      <td className="p-4 align-middle">Water Level Sensor</td>
                      <td className="p-4 align-middle">April 27, 2025</td>
                      <td className="p-4 align-middle">Michael Chen</td>
                      <td className="p-4 align-middle">
                        <Badge variant="outline" className="border-green-500 text-green-500">Success</Badge>
                      </td>
                      <td className="p-4 align-middle">
                        <Button variant="ghost" size="sm">View Details</Button>
                      </td>
                    </tr>
                    <tr className="border-b transition-colors hover:bg-muted/50">
                      <td className="p-4 align-middle">Indoor Humidity</td>
                      <td className="p-4 align-middle">March 15, 2025</td>
                      <td className="p-4 align-middle">John Doe</td>
                      <td className="p-4 align-middle">
                        <Badge variant="outline" className="border-green-500 text-green-500">Success</Badge>
                      </td>
                      <td className="p-4 align-middle">
                        <Button variant="ghost" size="sm">View Details</Button>
                      </td>
                    </tr>
                    <tr className="border-b transition-colors hover:bg-muted/50">
                      <td className="p-4 align-middle">Soil Moisture Sensor</td>
                      <td className="p-4 align-middle">March 14, 2025</td>
                      <td className="p-4 align-middle">John Doe</td>
                      <td className="p-4 align-middle">
                        <Badge variant="outline" className="border-green-500 text-green-500">Success</Badge>
                      </td>
                      <td className="p-4 align-middle">
                        <Button variant="ghost" size="sm">View Details</Button>
                      </td>
                    </tr>
                    <tr className="border-b transition-colors hover:bg-muted/50">
                      <td className="p-4 align-middle">Greenhouse Temperature</td>
                      <td className="p-4 align-middle">February 28, 2025</td>
                      <td className="p-4 align-middle">Sarah Johnson</td>
                      <td className="p-4 align-middle">
                        <Badge variant="destructive">Failed</Badge>
                      </td>
                      <td className="p-4 align-middle">
                        <Button variant="ghost" size="sm">View Details</Button>
                      </td>
                    </tr>
                    <tr className="transition-colors hover:bg-muted/50">
                      <td className="p-4 align-middle">Weather Station</td>
                      <td className="p-4 align-middle">January 15, 2025</td>
                      <td className="p-4 align-middle">Emma Williams</td>
                      <td className="p-4 align-middle">
                        <Badge variant="outline" className="border-green-500 text-green-500">Success</Badge>
                      </td>
                      <td className="p-4 align-middle">
                        <Button variant="ghost" size="sm">View Details</Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Default Calibration Parameters</CardTitle>
              <CardDescription>
                Configure default calibration settings for each sensor type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="h-12 px-4 text-left align-middle font-medium">Sensor Type</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Calibration Method</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Min. Calibration Points</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Calibration Interval</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b transition-colors hover:bg-muted/50">
                      <td className="p-4 align-middle">Temperature</td>
                      <td className="p-4 align-middle">Two-point</td>
                      <td className="p-4 align-middle">2</td>
                      <td className="p-4 align-middle">90 days</td>
                      <td className="p-4 align-middle">
                        <Button variant="outline" size="sm">Edit</Button>
                      </td>
                    </tr>
                    <tr className="border-b transition-colors hover:bg-muted/50">
                      <td className="p-4 align-middle">Humidity</td>
                      <td className="p-4 align-middle">Two-point</td>
                      <td className="p-4 align-middle">2</td>
                      <td className="p-4 align-middle">60 days</td>
                      <td className="p-4 align-middle">
                        <Button variant="outline" size="sm">Edit</Button>
                      </td>
                    </tr>
                    <tr className="border-b transition-colors hover:bg-muted/50">
                      <td className="p-4 align-middle">Soil Moisture</td>
                      <td className="p-4 align-middle">Three-point</td>
                      <td className="p-4 align-middle">3</td>
                      <td className="p-4 align-middle">60 days</td>
                      <td className="p-4 align-middle">
                        <Button variant="outline" size="sm">Edit</Button>
                      </td>
                    </tr>
                    <tr className="border-b transition-colors hover:bg-muted/50">
                      <td className="p-4 align-middle">Water Level</td>
                      <td className="p-4 align-middle">Multi-point</td>
                      <td className="p-4 align-middle">4</td>
                      <td className="p-4 align-middle">60 days</td>
                      <td className="p-4 align-middle">
                        <Button variant="outline" size="sm">Edit</Button>
                      </td>
                    </tr>
                    <tr className="transition-colors hover:bg-muted/50">
                      <td className="p-4 align-middle">Weather</td>
                      <td className="p-4 align-middle">Three-point</td>
                      <td className="p-4 align-middle">3</td>
                      <td className="p-4 align-middle">90 days</td>
                      <td className="p-4 align-middle">
                        <Button variant="outline" size="sm">Edit</Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
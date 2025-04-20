"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ChevronLeft, Download, HelpCircle, Info, Trash2, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

// Mock calibration data
const mockCalibrationData = {
  id: '1',
  sensorName: 'Soil Moisture Sensor',
  sensorType: 'Soil Moisture',
  moduleVersion: '2.1.0',
  lastCalibration: '15 days ago',
  status: 'Ready for calibration',
  currentValues: {
    raw: 2048,
    calibrated: '42%',
  },
  calibrationMethod: 'Three-point calibration',
  points: [
    { name: 'Dry point', expected: '0%', measured: null, raw: null },
    { name: 'Mid point', expected: '50%', measured: null, raw: null },
    { name: 'Wet point', expected: '100%', measured: null, raw: null },
  ],
  parameters: {
    offset: -2.5,
    gain: 1.05,
    nonLinearity: 0.02,
  },
  advice: 'For best results, ensure the sensor is completely dry for the first point, in slightly damp soil for the mid point, and fully immersed in water for the wet point.',
};

export default function CalibrationDetailPage({ params }: { params: { id: string } }) {
  const [calibrationData, setCalibrationData] = useState(mockCalibrationData);
  const [activePoint, setActivePoint] = useState<number | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [currentRawValue, setCurrentRawValue] = useState(2048);
  const router = useRouter();
  const { toast } = useToast();

  const steps = [
    'Preparation',
    'Calibration Points',
    'Verification',
    'Save & Apply',
  ];

  const handleCapture = (pointIndex: number) => {
    setActivePoint(pointIndex);
    
    // Simulate reading from sensor with slight variation
    const simulatedRaw = currentRawValue + (Math.random() - 0.5) * 200;
    const simulatedValue = parseFloat(calibrationData.points[pointIndex].expected) + (Math.random() - 0.5) * 5;
    
    // Update the points array with the new values
    const updatedPoints = [...calibrationData.points];
    updatedPoints[pointIndex] = {
      ...updatedPoints[pointIndex],
      measured: `${simulatedValue.toFixed(1)}%`,
      raw: Math.round(simulatedRaw),
    };
    
    setCalibrationData({
      ...calibrationData,
      points: updatedPoints,
    });
    
    toast({
      title: "Point captured",
      description: `${calibrationData.points[pointIndex].name} recorded successfully.`,
    });
    
    // Clear active point after a delay
    setTimeout(() => {
      setActivePoint(null);
    }, 2000);
  };

  const handleStartCalibration = () => {
    setIsCalibrating(true);
    setCurrentStep(1);
    
    toast({
      title: "Calibration started",
      description: "Follow the instructions for each calibration point.",
    });
  };

  const handleNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinishCalibration = () => {
    toast({
      title: "Calibration saved",
      description: "New calibration parameters have been applied to the sensor.",
    });
    
    router.push('/dashboard/calibration');
  };

  const handleCancelCalibration = () => {
    // Reset the calibration data
    setCalibrationData({
      ...mockCalibrationData,
      points: mockCalibrationData.points.map(point => ({
        ...point,
        measured: null,
        raw: null,
      })),
    });
    
    setIsCalibrating(false);
    setCurrentStep(0);
    setActivePoint(null);
    
    toast({
      title: "Calibration cancelled",
      description: "The calibration process has been cancelled.",
      variant: "destructive",
    });
  };

  const areAllPointsCaptured = () => {
    return calibrationData.points.every(point => point.measured !== null && point.raw !== null);
  };

  const getStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Preparation Required</AlertTitle>
              <AlertDescription>
                Before starting calibration, please ensure that:
                <ul className="list-disc pl-5 mt-2">
                  <li>The sensor is connected and functioning properly</li>
                  <li>You have the necessary reference materials (dry soil, water, etc.)</li>
                  <li>The environment is stable (temperature, humidity)</li>
                </ul>
              </AlertDescription>
            </Alert>
            
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Sensor Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Sensor Type:</span>
                      <span className="text-sm font-medium">{calibrationData.sensorType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Module Version:</span>
                      <span className="text-sm font-medium">{calibrationData.moduleVersion}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Last Calibration:</span>
                      <span className="text-sm font-medium">{calibrationData.lastCalibration}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Current Raw Value:</span>
                      <span className="text-sm font-medium">{calibrationData.currentValues.raw}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Current Calibrated Value:</span>
                      <span className="text-sm font-medium">{calibrationData.currentValues.calibrated}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Calibration Method</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm">{calibrationData.calibrationMethod}</p>
                    <p className="text-sm text-muted-foreground">{calibrationData.advice}</p>
                    
                    <div className="flex items-center space-x-2 pt-2">
                      <Switch
                        id="advanced-mode"
                        checked={advancedMode}
                        onCheckedChange={setAdvancedMode}
                      />
                      <Label htmlFor="advanced-mode">Advanced Mode</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="flex justify-end gap-4">
              <Button variant="outline" onClick={() => router.push('/dashboard/calibration')}>
                Cancel
              </Button>
              <Button onClick={handleStartCalibration}>
                Start Calibration
              </Button>
            </div>
          </div>
        );
      
      case 1:
        return (
          <div className="space-y-4">
            <Alert className="bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
              <Info className="h-4 w-4" />
              <AlertTitle>Calibration in Progress</AlertTitle>
              <AlertDescription>
                Capture each calibration point by following the instructions and pressing "Capture" when ready.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-4">
              {calibrationData.points.map((point, index) => (
                <Card key={index} className={`${activePoint === index ? 'ring-2 ring-primary' : ''}`}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">{point.name}</CardTitle>
                      {point.measured ? (
                        <Badge variant="outline" className="border-green-500 text-green-500">
                          <Check className="mr-1 h-3 w-3" /> Captured
                        </Badge>
                      ) : (
                        <Badge variant="outline">Pending</Badge>
                      )}
                    </div>
                    <CardDescription>Expected value: {point.expected}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label htmlFor={`point-${index}-measured`}>Measured Value</Label>
                        <div className="flex items-center mt-1">
                          <Input
                            id={`point-${index}-measured`}
                            value={point.measured || ''}
                            readOnly
                            placeholder="Not captured yet"
                          />
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="ml-1">
                                  <HelpCircle className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>The calibrated value measured by the sensor</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                      {advancedMode && (
                        <div>
                          <Label htmlFor={`point-${index}-raw`}>Raw Value</Label>
                          <div className="flex items-center mt-1">
                            <Input
                              id={`point-${index}-raw`}
                              value={point.raw || ''}
                              readOnly
                              placeholder="Not captured yet"
                            />
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="ml-1">
                                    <HelpCircle className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>The raw ADC value from the sensor</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2">
                    <Button
                      variant={point.measured ? "outline" : "default"}
                      onClick={() => handleCapture(index)}
                      className="w-full"
                    >
                      {point.measured ? "Recapture" : "Capture"}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
            
            <div className="flex justify-between">
              <Button variant="outline" onClick={handlePrevStep}>
                <ChevronLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button onClick={handleNextStep} disabled={!areAllPointsCaptured()}>
                Next Step
              </Button>
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-4">
            <Alert className="bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
              <Info className="h-4 w-4" />
              <AlertTitle>Calibration Verification</AlertTitle>
              <AlertDescription>
                Review the calculated calibration parameters and verify the sensor's performance.
              </AlertDescription>
            </Alert>
            
            <Card>
              <CardHeader>
                <CardTitle>Calculated Parameters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label>Offset</Label>
                    <div className="flex items-center mt-1">
                      <Input value={calibrationData.parameters.offset} readOnly />
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="ml-1">
                              <HelpCircle className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Zero offset adjustment</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                  <div>
                    <Label>Gain</Label>
                    <div className="flex items-center mt-1">
                      <Input value={calibrationData.parameters.gain} readOnly />
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="ml-1">
                              <HelpCircle className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Multiplier to scale the readings</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                  {advancedMode && (
                    <div>
                      <Label>Non-linearity</Label>
                      <div className="flex items-center mt-1">
                        <Input value={calibrationData.parameters.nonLinearity} readOnly />
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="ml-1">
                                <HelpCircle className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Non-linear correction factor</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Calibration Points Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative w-full overflow-auto">
                  <table className="w-full caption-bottom text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="h-12 px-4 text-left align-middle font-medium">Point</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Expected</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Measured</th>
                        {advancedMode && (
                          <th className="h-12 px-4 text-left align-middle font-medium">Raw Value</th>
                        )}
                        <th className="h-12 px-4 text-left align-middle font-medium">Error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calibrationData.points.map((point, index) => {
                        const expectedValue = parseFloat(point.expected);
                        const measuredValue = point.measured ? parseFloat(point.measured as string) : 0;
                        const error = point.measured ? (measuredValue - expectedValue).toFixed(1) : 'N/A';
                        const errorPercentage = point.measured ? ((measuredValue - expectedValue) / expectedValue * 100).toFixed(1) : 'N/A';
                        
                        return (
                          <tr key={index} className="border-b transition-colors hover:bg-muted/50">
                            <td className="p-4 align-middle">{point.name}</td>
                            <td className="p-4 align-middle">{point.expected}</td>
                            <td className="p-4 align-middle">{point.measured || 'Not captured'}</td>
                            {advancedMode && (
                              <td className="p-4 align-middle">{point.raw || 'N/A'}</td>
                            )}
                            <td className="p-4 align-middle">
                              {point.measured ? (
                                <span className={
                                  Math.abs(parseFloat(error as string)) > 5 ? 'text-red-500' : 
                                  Math.abs(parseFloat(error as string)) > 2 ? 'text-amber-500' : 
                                  'text-green-500'
                                }>
                                  {error}% ({errorPercentage}%)
                                </span>
                              ) : 'N/A'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-between">
              <Button variant="outline" onClick={handlePrevStep}>
                <ChevronLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button onClick={handleNextStep}>
                Next Step
              </Button>
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-4">
            <Alert className="bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300">
              <Check className="h-4 w-4" />
              <AlertTitle>Calibration Complete</AlertTitle>
              <AlertDescription>
                Your sensor has been successfully calibrated. You can now save and apply the new parameters.
              </AlertDescription>
            </Alert>
            
            <Card>
              <CardHeader>
                <CardTitle>Calibration Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h3 className="text-sm font-medium">Sensor Information</h3>
                      <div className="mt-2 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Sensor Name:</span>
                          <span className="text-sm">{calibrationData.sensorName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Sensor Type:</span>
                          <span className="text-sm">{calibrationData.sensorType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Module Version:</span>
                          <span className="text-sm">{calibrationData.moduleVersion}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">New Calibration Parameters</h3>
                      <div className="mt-2 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Offset:</span>
                          <span className="text-sm">{calibrationData.parameters.offset}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Gain:</span>
                          <span className="text-sm">{calibrationData.parameters.gain}</span>
                        </div>
                        {advancedMode && (
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Non-linearity:</span>
                            <span className="text-sm">{calibrationData.parameters.nonLinearity}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-sm font-medium">Calibration Points</h3>
                    <div className="mt-2 grid gap-2 grid-cols-3">
                      {calibrationData.points.map((point, index) => (
                        <div key={index} className="flex flex-col p-2 border rounded-md">
                          <span className="text-sm font-medium">{point.name}</span>
                          <span className="text-xs text-muted-foreground">Expected: {point.expected}</span>
                          <span className="text-xs">Measured: {point.measured}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center space-x-2">
                    <Switch id="sync-to-cloud" defaultChecked />
                    <Label htmlFor="sync-to-cloud">Sync calibration to cloud</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch id="apply-immediately" defaultChecked />
                    <Label htmlFor="apply-immediately">Apply calibration immediately</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-between">
              <div className="flex gap-2">
                <Button variant="outline" onClick={handlePrevStep}>
                  <ChevronLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button variant="outline" onClick={() => setCurrentStep(0)}>
                  Restart
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleCancelCalibration()}>
                  <X className="mr-2 h-4 w-4" /> Cancel
                </Button>
                <Button onClick={handleFinishCalibration}>
                  <Check className="mr-2 h-4 w-4" /> Save & Apply
                </Button>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/calibration')}
            className="mr-2"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{calibrationData.sensorName}</h2>
            <p className="text-muted-foreground">
              {isCalibrating ? 'Calibration in progress' : 'Calibration wizard'}
            </p>
          </div>
        </div>
        {!isCalibrating && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" /> Export Data
            </Button>
          </div>
        )}
      </div>

      {isCalibrating && (
        <div className="relative">
          <div className="flex border-b">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`flex-1 text-center py-2 ${
                  currentStep === index ? 'border-b-2 border-primary font-medium' : ''
                }`}
              >
                <span className="inline-flex items-center">
                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs mr-2 ${
                    currentStep >= index ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    {index + 1}
                  </span>
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        {getStepContent()}
      </div>
    </div>
  );
}
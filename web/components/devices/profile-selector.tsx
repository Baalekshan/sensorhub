import React from 'react';
import { DeviceProfile } from '../../hooks/useDeviceOnboarding';
import { Card, CardContent } from '../ui/card';
import { CheckCircle2, ChevronRight, Zap, Clock, Waves } from 'lucide-react';

interface ProfileSelectorProps {
  profiles: DeviceProfile[];
  selectedProfile: DeviceProfile | null;
  onSelect: (profile: DeviceProfile) => void;
}

// Profile icons mapping
const profileIcons: Record<string, React.ReactNode> = {
  'temp-humidity': <Waves className="h-5 w-5 text-blue-500" />,
  'air-quality': <Zap className="h-5 w-5 text-green-500" />,
  'full-environment': <Clock className="h-5 w-5 text-purple-500" />,
};

export function ProfileSelector({ profiles, selectedProfile, onSelect }: ProfileSelectorProps) {
  if (profiles.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No compatible profiles found for your sensor configuration.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {profiles.map((profile) => (
        <Card 
          key={profile.id}
          className={`cursor-pointer transition-colors hover:bg-slate-50 ${
            selectedProfile?.id === profile.id ? 'border-primary' : ''
          }`}
          onClick={() => onSelect(profile)}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-slate-100 w-10 h-10 rounded-full flex items-center justify-center">
                  {profileIcons[profile.id] || <Clock className="h-5 w-5 text-slate-600" />}
                </div>
                <div>
                  <p className="font-medium">{profile.name}</p>
                  <p className="text-xs text-muted-foreground">{profile.description}</p>
                </div>
              </div>
              {selectedProfile?.id === profile.id ? (
                <CheckCircle2 className="h-5 w-5 text-primary" />
              ) : (
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            
            <div className="mt-4 text-xs text-muted-foreground">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-medium text-foreground">Compatible Sensors</p>
                  <ul className="mt-1 space-y-1">
                    {profile.compatibleSensors.map((sensor) => (
                      <li key={sensor}>{sensor}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-foreground">Configuration</p>
                  <ul className="mt-1 space-y-1">
                    <li>Sampling: {profile.configuration.sampling.interval / 1000}s</li>
                    <li>Active Sensors: {profile.configuration.sensors.filter(s => s.active).length}</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 
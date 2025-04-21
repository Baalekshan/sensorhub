export enum UpdateType {
  FIRMWARE = 'FIRMWARE',
  CONFIGURATION = 'CONFIGURATION',
}

export enum UpdateSessionState {
  INITIATED = 'INITIATED',
  PREPARING = 'PREPARING',
  TRANSFERRING = 'TRANSFERRING',
  VALIDATING = 'VALIDATING',
  APPLYING = 'APPLYING',
  RESTARTING = 'RESTARTING',
  VERIFYING = 'VERIFYING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  ROLLING_BACK = 'ROLLING_BACK',
  ROLLED_BACK = 'ROLLED_BACK',
  CRITICAL_FAILURE = 'CRITICAL_FAILURE',
}

export interface UpdateOptions {
  chunkSize?: number;
  forceUpdate?: boolean;
  skipVerification?: boolean;
  updateTimeout?: number;
}

export interface UpdateStatusReport {
  status: string;
  chunkId?: number;
  progress?: number;
  error?: string;
  message?: string;
}

// Device information needed for updates
export interface DeviceInfo {
  id: string;
  type: string;
  firmwareVersion: string;
} 
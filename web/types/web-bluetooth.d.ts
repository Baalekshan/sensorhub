// Extend Navigator interface with Web Bluetooth API
interface Navigator {
  bluetooth: {
    requestDevice(options: RequestDeviceOptions): Promise<BluetoothDevice>;
    getAvailability(): Promise<boolean>;
    onavailabilitychanged: EventHandler;
  };
}

interface RequestDeviceOptions {
  filters?: Array<{
    services?: string[] | number[];
    name?: string;
    namePrefix?: string;
    manufacturerData?: Array<{
      companyIdentifier: number;
      dataPrefix?: BufferSource;
      mask?: BufferSource;
    }>;
    serviceData?: Array<{
      service: BluetoothServiceUUID;
      dataPrefix?: BufferSource;
      mask?: BufferSource;
    }>;
  }>;
  optionalServices?: string[] | number[];
  acceptAllDevices?: boolean;
}

// Add module declaration to make TypeScript recognize this file
declare module "web-bluetooth" {
  export {};
} 
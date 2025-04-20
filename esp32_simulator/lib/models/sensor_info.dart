import 'package:json_annotation/json_annotation.dart';

part 'sensor_info.g.dart';

@JsonSerializable()
class SensorInfo {
  final List<Sensor> sensors;

  SensorInfo({
    List<Sensor>? sensors,
  }) : sensors = sensors ??
            [
              Sensor(
                id: 'temp1',
                type: 'BME280',
                isCalibrated: true,
                isActive: true,
              ),
              Sensor(
                id: 'humid1',
                type: 'HDC1080',
                isCalibrated: true,
                isActive: true,
              ),
            ];

  factory SensorInfo.fromJson(Map<String, dynamic> json) =>
      _$SensorInfoFromJson(json);

  Map<String, dynamic> toJson() => _$SensorInfoToJson(this);
}

@JsonSerializable()
class Sensor {
  final String id;
  final String type;
  final bool isCalibrated;
  final bool isActive;

  Sensor({
    required this.id,
    required this.type,
    required this.isCalibrated,
    required this.isActive,
  });

  factory Sensor.fromJson(Map<String, dynamic> json) => _$SensorFromJson(json);

  Map<String, dynamic> toJson() => _$SensorToJson(this);
} 
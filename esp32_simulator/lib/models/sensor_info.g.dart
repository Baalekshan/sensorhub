// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'sensor_info.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

SensorInfo _$SensorInfoFromJson(Map<String, dynamic> json) => SensorInfo(
      sensors: (json['sensors'] as List<dynamic>?)
          ?.map((e) => Sensor.fromJson(e as Map<String, dynamic>))
          .toList(),
    );

Map<String, dynamic> _$SensorInfoToJson(SensorInfo instance) =>
    <String, dynamic>{
      'sensors': instance.sensors,
    };

Sensor _$SensorFromJson(Map<String, dynamic> json) => Sensor(
      id: json['id'] as String,
      type: json['type'] as String,
      isCalibrated: json['isCalibrated'] as bool,
      isActive: json['isActive'] as bool,
    );

Map<String, dynamic> _$SensorToJson(Sensor instance) => <String, dynamic>{
      'id': instance.id,
      'type': instance.type,
      'isCalibrated': instance.isCalibrated,
      'isActive': instance.isActive,
    };

import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { PageHeader } from '@/components/PageHeader';
import { colors } from '@/constants/colors';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { useDevices } from '@/hooks/useDevices';
import { TimeRangeSelector } from '@/components/TimeRangeSelector';
import { Calendar, BarChart2, Share2 } from 'lucide-react-native';
import { Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width - 32;

export default function AnalyticsScreen() {
  const router = useRouter();
  const { devices } = useDevices();
  const [timeRange, setTimeRange] = useState('week');
  const [selectedDevice, setSelectedDevice] = useState('all');
  const [selectedSensorType, setSelectedSensorType] = useState('temperature');
  
  // Get chart data based on selected filters
  const getChartData = () => {
    // In a real app, you'd fetch actual historical data from an API
    // Here we're generating mock data for demonstration
    
    // Define labels based on selected time range
    let labels;
    switch (timeRange) {
      case 'day':
        labels = ['8am', '12pm', '4pm', '8pm'];
        break;
      case 'week':
        labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        break;
      case 'month':
        labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
        break;
      default:
        labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    }
    
    // Generate mock data sets based on sensor type
    let datasets = [];
    let legend = [];
    
    if (selectedDevice === 'all') {
      // Show data from all devices
      if (devices && devices.length > 0) {
        datasets = devices.slice(0, 3).map((device, index) => {
          const offset = index * 5; // Just to create visual variation
          legend.push(device.name);
          return {
            data: labels.map(() => Math.floor(Math.random() * 30) + 20 + offset),
            color: () => [colors.primary, colors.success, colors.warning][index % 3],
            strokeWidth: 2,
          };
        });
      } else {
        // No devices, use dummy data
        legend = ['No Device Data'];
        datasets = [
          {
            data: labels.map(() => 0),
            color: () => colors.textSecondary,
            strokeWidth: 2,
          },
        ];
      }
    } else {
      // Show data for a specific device
      const device = devices?.find(d => d.id === selectedDevice);
      if (device) {
        legend = [device.name];
        datasets = [
          {
            data: labels.map(() => Math.floor(Math.random() * 30) + 20),
            color: () => colors.primary,
            strokeWidth: 3,
          },
        ];
      }
    }

    return {
      labels,
      datasets,
      legend,
    };
  };
  
  const chartData = getChartData();
  
  // Get appropriate unit for selected sensor type
  const getSensorUnit = () => {
    switch (selectedSensorType) {
      case 'temperature':
        return '°C';
      case 'humidity':
        return '%';
      case 'moisture':
        return '%';
      case 'gas':
        return 'ppm';
      default:
        return '';
    }
  };
  
  // Device selector options
  const deviceOptions = [
    { id: 'all', name: 'All Devices' },
    ...(devices?.map(device => ({ id: device.id, name: device.name })) || []),
  ];
  
  // Sensor type options
  const sensorTypes = [
    { id: 'temperature', name: 'Temperature' },
    { id: 'humidity', name: 'Humidity' },
    { id: 'moisture', name: 'Soil Moisture' },
    { id: 'gas', name: 'Gas Level' },
  ];

  return (
    <View style={styles.container}>
      <PageHeader 
        title="Analytics"
        subtitle="Sensor data trends and insights"
        rightComponent={
          <TouchableOpacity style={styles.exportButton}>
            <Share2 size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        }
      />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Time range selector */}
        <TimeRangeSelector
          selected={timeRange}
          onChange={setTimeRange}
        />
        
        {/* Device selector */}
        <View style={styles.selectorContainer}>
          <Text style={styles.selectorLabel}>Device:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {deviceOptions.map(device => (
              <TouchableOpacity
                key={device.id}
                style={[
                  styles.selectorButton,
                  selectedDevice === device.id && styles.selectorButtonActive
                ]}
                onPress={() => setSelectedDevice(device.id)}
              >
                <Text
                  style={[
                    styles.selectorButtonText,
                    selectedDevice === device.id && styles.selectorButtonTextActive
                  ]}
                >
                  {device.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        {/* Sensor type selector */}
        <View style={styles.selectorContainer}>
          <Text style={styles.selectorLabel}>Sensor Type:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {sensorTypes.map(type => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.selectorButton,
                  selectedSensorType === type.id && styles.selectorButtonActive
                ]}
                onPress={() => setSelectedSensorType(type.id)}
              >
                <Text
                  style={[
                    styles.selectorButtonText,
                    selectedSensorType === type.id && styles.selectorButtonTextActive
                  ]}
                >
                  {type.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        {/* Line chart */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>
              {selectedSensorType.charAt(0).toUpperCase() + selectedSensorType.slice(1)} Readings
            </Text>
            <View style={styles.dateContainer}>
              <Calendar size={16} color={colors.textSecondary} />
              <Text style={styles.dateText}>
                {timeRange === 'day' ? 'Today' : 
                 timeRange === 'week' ? 'This Week' : 
                 timeRange === 'month' ? 'This Month' : 'Last 6 Months'}
              </Text>
            </View>
          </View>
          
          <LineChart
            data={chartData}
            width={screenWidth}
            height={220}
            chartConfig={{
              backgroundColor: colors.cardBackground,
              backgroundGradientFrom: colors.cardBackground,
              backgroundGradientTo: colors.cardBackground,
              decimalPlaces: 0,
              color: (opacity = 1) => colors.primary,
              labelColor: (opacity = 1) => colors.textSecondary,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '4',
                strokeWidth: '2',
              },
              propsForLabels: {
                fontSize: 12,
                fontFamily: 'Inter-Regular',
              }
            }}
            bezier
            style={styles.chart}
            yAxisSuffix={getSensorUnit()}
            fromZero
            withInnerLines={false}
            withOuterLines={true}
            renderDotContent={({ x, y, index, indexData }) => (
              <View
                key={index}
                style={[
                  styles.tooltipContainer,
                  { top: y - 32, left: x - 16 }
                ]}
              >
                <Text style={styles.tooltipText}>{indexData}{getSensorUnit()}</Text>
              </View>
            )}
          />
          
          {/* Legend */}
          <View style={styles.legendContainer}>
            {chartData.legend.map((label, index) => (
              <View key={index} style={styles.legendItem}>
                <View 
                  style={[
                    styles.legendColor, 
                    { 
                      backgroundColor: typeof chartData.datasets[index]?.color === 'function' 
                        ? chartData.datasets[index].color(1) 
                        : colors.primary
                    }
                  ]} 
                />
                <Text style={styles.legendText}>{label}</Text>
              </View>
            ))}
          </View>
        </View>
        
        {/* Bar chart - Sensor Comparison */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>
              Sensor Comparison
            </Text>
            <View style={styles.chartIconContainer}>
              <BarChart2 size={18} color={colors.textSecondary} />
            </View>
          </View>
          
          <BarChart
            data={{
              labels: ['Temp', 'Humid', 'Moist', 'Gas'],
              datasets: [
                {
                  data: [24, 65, 38, 120],
                }
              ]
            }}
            width={screenWidth}
            height={220}
            yAxisSuffix=""
            chartConfig={{
              backgroundColor: colors.cardBackground,
              backgroundGradientFrom: colors.cardBackground,
              backgroundGradientTo: colors.cardBackground,
              decimalPlaces: 0,
              color: (opacity = 1) => colors.primary,
              labelColor: (opacity = 1) => colors.textSecondary,
              barPercentage: 0.6,
              propsForLabels: {
                fontSize: 12,
                fontFamily: 'Inter-Regular',
              }
            }}
            style={styles.chart}
            showValuesOnTopOfBars
            fromZero
            withInnerLines={false}
          />
        </View>
        
        {/* Analytics insights */}
        <View style={styles.insightsCard}>
          <Text style={styles.insightsTitle}>Key Insights</Text>
          
          <View style={styles.insightItem}>
            <View style={[styles.insightDot, { backgroundColor: colors.success }]} />
            <Text style={styles.insightText}>
              Temperature remains stable within optimal range
            </Text>
          </View>
          
          <View style={styles.insightItem}>
            <View style={[styles.insightDot, { backgroundColor: colors.warning }]} />
            <Text style={styles.insightText}>
              Humidity levels peak during evening hours
            </Text>
          </View>
          
          <View style={styles.insightItem}>
            <View style={[styles.insightDot, { backgroundColor: colors.error }]} />
            <Text style={styles.insightText}>
              Gas sensor readings increased by 15% this week
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  exportButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectorContainer: {
    marginBottom: 16,
  },
  selectorLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  selectorButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectorButtonActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  selectorButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.textSecondary,
  },
  selectorButtonTextActive: {
    color: colors.primary,
  },
  chartCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.textPrimary,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 6,
  },
  chartIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  tooltipContainer: {
    position: 'absolute',
    backgroundColor: colors.textPrimary,
    padding: 4,
    borderRadius: 4,
    zIndex: 1,
  },
  tooltipText: {
    fontFamily: 'Inter-Medium',
    fontSize: 10,
    color: colors.cardBackground,
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
  },
  insightsCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  insightsTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 16,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  insightText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textPrimary,
    flex: 1,
  },
});
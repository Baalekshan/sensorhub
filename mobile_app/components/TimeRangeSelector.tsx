import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '@/constants/colors';
import { Calendar } from 'lucide-react-native';

interface TimeRangeSelectorProps {
  selected: string;
  onChange: (range: string) => void;
}

export function TimeRangeSelector({ selected, onChange }: TimeRangeSelectorProps) {
  const ranges = [
    { id: 'day', label: 'Day' },
    { id: 'week', label: 'Week' },
    { id: 'month', label: 'Month' },
    { id: 'year', label: 'Year' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Calendar size={20} color={colors.primary} />
      </View>
      
      <View style={styles.optionsContainer}>
        {ranges.map(range => (
          <TouchableOpacity
            key={range.id}
            style={[
              styles.option,
              selected === range.id && styles.optionSelected
            ]}
            onPress={() => onChange(range.id)}
          >
            <Text
              style={[
                styles.optionText,
                selected === range.id && styles.optionTextSelected
              ]}
            >
              {range.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  optionsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  option: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  optionSelected: {
    backgroundColor: colors.primaryLight,
  },
  optionText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.textSecondary,
  },
  optionTextSelected: {
    color: colors.primary,
  },
});
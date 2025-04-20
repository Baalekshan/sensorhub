import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ScrollView, Platform } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useDevices } from '@/hooks/useDevices';
import { colors } from '@/constants/colors';
import { PageHeader } from '@/components/PageHeader';
import { DeviceListItem } from '@/components/DeviceListItem';
import { Plus, Search, Filter, BluetoothOff } from 'lucide-react-native';
import { TextInput } from 'react-native-gesture-handler';

export default function DevicesScreen() {
  const { devices, isLoading, fetchDevices } = useDevices();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const router = useRouter();

  // Filter devices based on search query and status filter
  const filteredDevices = devices?.filter(device => {
    const matchesSearch = device.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus ? device.status === filterStatus : true;
    return matchesSearch && matchesStatus;
  });

  // Pull-to-refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDevices();
    setRefreshing(false);
  };

  const handleAddDevice = () => {
    if (Platform.OS === 'web') {
      // For web, navigate directly to the correct path
      window.location.href = '/devices/add';
    } else {
      // For native, use router
      router.push('./add');
    }
  };

  const renderFilterButton = (label: string, value: string | null) => (
    <TouchableOpacity 
      style={[
        styles.filterButton,
        filterStatus === value && styles.filterButtonActive
      ]}
      onPress={() => setFilterStatus(value === filterStatus ? null : value)}
    >
      <Text 
        style={[
          styles.filterButtonText,
          filterStatus === value && styles.filterButtonTextActive
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <PageHeader 
        title="My Devices"
        subtitle="Manage your connected sensors"
        rightComponent={
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={handleAddDevice}
          >
            <Plus size={24} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search devices..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.textSecondary}
          />
        </View>
      </View>

      {/* Filter pills */}
      <View style={styles.filtersContainer}>
        <View style={styles.filterIconContainer}>
          <Filter size={16} color={colors.textSecondary} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {renderFilterButton('All', null)}
          {renderFilterButton('Online', 'online')}
          {renderFilterButton('Offline', 'offline')}
          {renderFilterButton('Warning', 'warning')}
        </ScrollView>
      </View>

      {/* Device list */}
      <FlatList
        data={filteredDevices}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <DeviceListItem
            device={item}
            onPress={() => {
              if (Platform.OS === 'web') {
                window.location.href = `/devices/${item.id}`;
              } else {
                router.push(`./${item.id}`);
              }
            }}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            {isLoading ? (
              <Text style={styles.emptyText}>Loading devices...</Text>
            ) : (
              <>
                <BluetoothOff size={48} color={colors.textSecondary} style={styles.emptyIcon} />
                <Text style={styles.emptyTitle}>No devices found</Text>
                <Text style={styles.emptyText}>
                  {searchQuery 
                    ? 'Try adjusting your search or filters'
                    : 'Add a new device to get started'}
                </Text>
                {!searchQuery && (
                  <TouchableOpacity 
                    style={styles.emptyButton}
                    onPress={handleAddDevice}
                  >
                    <Plus size={18} color="#FFFFFF" style={styles.emptyButtonIcon} />
                    <Text style={styles.emptyButtonText}>Add Device</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.textPrimary,
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  filterIconContainer: {
    marginRight: 8,
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterButtonActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  filterButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.textSecondary,
  },
  filterButtonTextActive: {
    color: colors.primary,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 64,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  emptyButtonIcon: {
    marginRight: 8,
  },
  emptyButtonText: {
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    fontSize: 16,
  },
});
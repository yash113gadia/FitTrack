import React, { useRef, useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Dimensions, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { colors } from '../../constants/theme';
import * as Haptics from 'expo-haptics';

interface ScrollWheelPickerProps {
  items: string[];
  initialValue?: string;
  onValueChange: (value: string) => void;
  height?: number;
  itemHeight?: number;
  label?: string;
}

const ScrollWheelPicker: React.FC<ScrollWheelPickerProps> = ({
  items,
  initialValue,
  onValueChange,
  height = 150,
  itemHeight = 50,
  label,
}) => {
  const flatListRef = useRef<FlatList>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Initial scroll to position
  useEffect(() => {
    if (initialValue) {
      const index = items.indexOf(initialValue);
      if (index !== -1) {
        setSelectedIndex(index);
        setTimeout(() => {
          flatListRef.current?.scrollToOffset({
            offset: index * itemHeight,
            animated: false,
          });
        }, 100);
      }
    }
  }, []);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / itemHeight);
    
    if (index !== selectedIndex && index >= 0 && index < items.length) {
      setSelectedIndex(index);
      Haptics.selectionAsync();
      onValueChange(items[index]);
    }
  };

  const renderItem = ({ item, index }: { item: string; index: number }) => {
    const isSelected = index === selectedIndex;
    return (
      <View style={[styles.itemContainer, { height: itemHeight }]}>
        <Text style={[
          styles.itemText, 
          isSelected ? styles.selectedItemText : styles.unselectedItemText
        ]}>
          {item}
        </Text>
      </View>
    );
  };

  const spacerHeight = (height - itemHeight) / 2;

  return (
    <View style={[styles.container, { height }]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.selectionOverlay} pointerEvents="none" />
      <FlatList
        ref={flatListRef}
        data={items}
        renderItem={renderItem}
        keyExtractor={(_, index) => index.toString()}
        showsVerticalScrollIndicator={false}
        snapToInterval={itemHeight}
        decelerationRate="fast"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingTop: spacerHeight,
          paddingBottom: spacerHeight,
        }}
        getItemLayout={(_, index) => ({
          length: itemHeight,
          offset: itemHeight * index,
          index,
        })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: colors.gray[50],
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  label: {
    position: 'absolute',
    top: 10,
    left: 16,
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray[500],
    zIndex: 10,
  },
  selectionOverlay: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 50,
    marginTop: -25,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.primary[200],
    backgroundColor: colors.primary[50],
    opacity: 0.3,
  },
  itemContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: {
    fontSize: 20,
  },
  selectedItemText: {
    fontWeight: 'bold',
    color: colors.primary[600],
    fontSize: 24,
  },
  unselectedItemText: {
    color: colors.gray[400],
  },
});

export default ScrollWheelPicker;

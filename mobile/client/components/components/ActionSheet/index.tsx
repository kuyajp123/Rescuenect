import {
    Actionsheet,
    ActionsheetBackdrop,
    ActionsheetContent,
    ActionsheetDragIndicator,
    ActionsheetDragIndicatorWrapper,
    ActionsheetItem,
    ActionsheetItemText
} from '@/components/ui/actionsheet';
import React from 'react';
import { StyleSheet } from 'react-native';
import { create } from 'zustand';

export interface ActionSheetItemType {
  id: string;
  name: string;
  icon?: React.ReactNode;
  onPress: () => void;
}

interface ActionSheetStore {
  isOpen: boolean;
  items: ActionSheetItemType[];
  showActionSheet: (items: ActionSheetItemType[]) => void;
  hideActionSheet: () => void;
}

export const useActionSheet = create<ActionSheetStore>((set, get) => ({
  isOpen: false,
  items: [],
  showActionSheet: (items) => {
    set({ isOpen: true, items });
  },
  hideActionSheet: () => {
    set({ isOpen: false, items: [] });
  },
}));

interface ActionSheetProps {
  isOpen?: boolean;
  onClose?: () => void;
  items?: ActionSheetItemType[];
}

export const ActionSheet = ({ isOpen, onClose, items = [] }: ActionSheetProps) => {
  
  return (
    <Actionsheet isOpen={isOpen} onClose={onClose}>
      <ActionsheetBackdrop />
      <ActionsheetContent>
        <ActionsheetDragIndicatorWrapper>
          <ActionsheetDragIndicator />
        </ActionsheetDragIndicatorWrapper>

        {items.map((item) => (
          <ActionsheetItem 
            key={item.id} 
            onPress={() => {
              item.onPress();
              onClose?.();
            }}
          >
            {item.icon}
            <ActionsheetItemText>{item.name}</ActionsheetItemText>
          </ActionsheetItem>
        ))}

      </ActionsheetContent>
    </Actionsheet>
  );
};

export default ActionSheet;

const styles = StyleSheet.create({});

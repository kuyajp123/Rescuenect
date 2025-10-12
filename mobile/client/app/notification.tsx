import Body from '@/components/ui/layout/Body';
import React from 'react';
import { StyleSheet } from 'react-native';
import { Button } from '@/components/components/button/Button';
import { Text } from 'react-native';
import { LoadingOverlay } from '@/components/ui/loading';
import { useState } from 'react';

export const notification = () => {
  const [openModal, setOpenModal] = useState(false);

  return (
    <Body>
      <Button
        onPress={() => {
          setOpenModal(true);
        }}
      >
        <Text>Close</Text>
      </Button>
      <LoadingOverlay
        visible={openModal}
        message="Getting your Status"
        onRequestClose={() => setOpenModal(false)}
        width={250}
      />
    </Body>
  );
};

const styles = StyleSheet.create({});

export default notification;

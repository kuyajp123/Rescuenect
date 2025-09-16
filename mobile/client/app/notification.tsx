import Body from '@/components/ui/layout/Body';
import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { useStatusFormStore } from '@/components/store/useStatusForm';

export const notification = () => {
  const statusFormData = useStatusFormStore((state) => state.formData);

  useEffect(() => {
    console.log("statusFormData in notification screen:", JSON.stringify(statusFormData, null, 2));
  }, [statusFormData])

  return (
      <Body>

      </Body>
  )
}

const styles = StyleSheet.create({})

export default notification;
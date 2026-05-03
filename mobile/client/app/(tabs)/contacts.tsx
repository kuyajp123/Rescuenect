import { MainHotlineAndContact } from '@/components/components/HotlineAndContact/MainHotlineAndContact';
import Body from '@/components/ui/layout/Body';
import React, { useCallback, useState } from 'react';
import { RefreshControl } from 'react-native';

export const DetailsScreen = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setRefreshTrigger(prev => prev + 1);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  return (
    <Body refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <MainHotlineAndContact refreshTrigger={refreshTrigger} />
    </Body>
  );
};

export default DetailsScreen;

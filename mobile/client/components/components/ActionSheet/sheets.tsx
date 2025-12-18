import { registerSheet } from 'react-native-actions-sheet';
import { MyActionSheet } from './index';

registerSheet('image-picker-actionSheet', MyActionSheet);
registerSheet('map-image-picker-actionSheet', MyActionSheet);
registerSheet('FAB', MyActionSheet);
registerSheet('status-more-action', MyActionSheet);
registerSheet('status-ellipsis-action', MyActionSheet);

export { };


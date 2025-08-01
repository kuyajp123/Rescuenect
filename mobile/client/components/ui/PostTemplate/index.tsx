// List components with empty state handling
export { DonationList } from '../data-display/DonationList';
export { StatusList } from '../data-display/StatusList';

/*
===========================================
POST TEMPLATE COMPONENTS EXPORTS
===========================================

INDIVIDUAL COMPONENTS:
---------------------
- StatusTemplate: Single status update component
- DonnationPostTemplate: Single donation post component

LIST COMPONENTS WITH EMPTY STATES:
----------------------------------
- StatusList: Handles multiple status updates with empty state
- DonationList: Handles multiple donations with empty state

TYPE DEFINITIONS:
----------------
- StatusTemplateProps: TypeScript interface for all post data

MIGRATION GUIDE:
---------------
OLD WAY (Manual mapping):
{statusData.map((item, index) => (
  <StatusTemplate key={index} {...item} />
))}

NEW WAY (With empty state):
<StatusList statusUpdates={statusData} />

BENEFITS:
---------
✅ Automatic empty state handling
✅ Consistent spacing between items
✅ Custom empty state messaging
✅ Better user experience
✅ Less boilerplate code
*/

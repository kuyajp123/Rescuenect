# RescueNect Debugging Checklist


## Backend / Auth

- [ ] Super admin can sign in with email in SUPER_ADMIN_EMAILS.
- [ ] LGU admin can sign in and lands on normal LGU dashboard.
- [ ] Super admin cannot access LGU-only /admin/lgu/* endpoints.
- [ ] LGU admin cannot access /admin/super/* endpoints.
- [ ] Inactive LGU admin is blocked from protected admin routes.
- [ ] GET /admin/me returns correct role, clientId, clientName, weather coordinates, and mapSettings.

## Super Admin

- [ ] /super overview loads without 500 error.
- [ ] Overview cards show correct client, request, proposal, admin, and resident counts.
- [ ] Overview health section shows backend, Firebase, PSGC, weather, and earthquake status.
- [ ] /super/requests lists LGU access requests.
- [ ] Approving an LGU request creates a draft client.
- [ ] Rejecting an LGU request updates status and review note.
- [ ] /super/clients search, pagination, manage, activate/deactivate, and delete work.
- [ ] Naic delete remains disabled/blocked.
- [ ] Client details page shows original request info, admins, barangays, weather settings, and map settings.
- [ ] Saving client weather key/lat/lng works.
- [ ] Saving map settings works.
- [ ] Uploading/importing GeoJSON boundary computes and stores max bounds.
- [ ] /super/admins lists only LGU admins, not super admins.
- [ ] LGU admin invite, sort, pagination, deactivate/delete work.
- [ ] /super/client-requests lists LGU proposals.
- [ ] Approving/rejecting proposals works and stores review metadata.

## Public Request Access

- [ ] /request-access loads.
- [ ] PSGC region dropdown loads.
- [ ] Province dropdown loads when applicable.
- [ ] NCR/no-province region loads municipalities directly.
- [ ] Municipality dropdown loads correctly.
- [ ] Barangay checklist loads after municipality selection.
- [ ] Select all barangays works.
- [ ] Form validates required requester/location/barangay/verification fields.
- [ ] Optional proposed weather latitude/longitude submit correctly.
- [ ] Submission creates lguRequests/{id} with PSGC snapshot and barangay snapshot.
- [ ] Requester receives/logs email attempt when email delivery is configured or disabled.

## LGU Admin Scoping

- [ ] Naic admin sees only Naic residents/statuses/centers/announcements/contacts.
- [ ] Another client admin sees only that client’s data.
- [ ] LGU admin cannot read/write another client’s data by changing request params.
- [ ] Creating evacuation center stores correct clientId.
- [ ] Creating announcement stores correct clientId.
- [ ] Status/resident views do not leak other clients.
- [ ] Legacy missing clientId data still behaves as Naic during transition.

## LGU Coordination

- [ ] LGU admin sees /client-requests sidebar item.
- [ ] LGU Coordination page loads client info and client admins.
- [ ] Weather coordinate proposal submits.
- [ ] Map settings proposal validates zoom rules:
- [ ] minZoom allowed 12..13
- [ ] zoom allowed minZoom..17
- [ ] maxZoom allowed zoom..18
- [ ] Barangay coverage proposal submits.
- [ ] Client information proposal submits.
- [ ] Admin invite proposal submits.
- [ ] LGU admin can cancel pending own-client proposal.
- [ ] LGU admin cannot cancel/read another client proposal.
- [ ] Approved proposal applies changes only after super admin approval.

## Maps

- [ ] Status map centers on logged-in LGU client.
- [ ] Evacuation map centers on logged-in LGU client.
- [ ] Add evacuation center map centers on logged-in LGU client.
- [ ] Evacuation panel map uses logged-in LGU client settings.
- [ ] Earthquake map uses logged-in LGU client settings.
- [ ] Map cannot pan outside configured maxBounds.
- [ ] Default map zoom is 15.
- [ ] Max zoom does not exceed 18.
- [ ] Zoom setting does not exceed 17 for default/current zoom.

## Weather / Notifications

- [ ] Naic weather still loads.
- [ ] Non-Naic client weather loads using its configured weather key/coordinates.
- [ ] LGU admin receives weather notifications for own clientId.
- [ ] LGU admin does not receive another client’s weather notifications.
- [ ] Super admin does not receive Naic weather notifications.
- [ ] Super admin does not receive any client weather notifications.
- [ ] Super admin still receives management/system notifications.
- [ ] Notification list filters correctly by role and client.
- [ ] Notification details render earthquake distance as client-relative, not “from Naic” for other clients.

## Earthquake

- [ ] Earthquake monitor uses active clients as scopes.
- [ ] Earthquake records include affectedClientIds.
- [ ] Earthquake records include clientImpacts.
- [ ] Super admin sees all earthquake records.
- [ ] LGU admin sees only earthquake records where affectedClientIds contains their clientId.
- [ ] Earthquake notifications target only affected active clients.
- [ ] Resident earthquake notifications target affected client coverage only.
- [ ] Naic fallback still works if no active dynamic client scopes exist.

## Email

- [ ] With EMAIL_DELIVERY_ENABLED=false, email attempts are logged as disabled.
- [ ] With SMTP configured, emails send successfully.
- [ ] LGU access request received email logs/sends.
- [ ] LGU request approved/rejected email logs/sends.
- [ ] LGU admin invitation email logs/sends.
- [ ] Client proposal submitted email logs/sends to super admins.
- [ ] Client proposal approved/rejected email logs/sends to requester.
- [ ] emailLogs or emailOutbox records status, recipient, template, and error if failed.

## Build / Test

- [ ] Backend: npm test
- [ ] Backend: npm run build
- [ ] Frontend: npm run build
- [ ] mobile/client: npx tsc --noEmit
- [ ] Supabase: deploy/test earthquake-monitor function after updating functions.

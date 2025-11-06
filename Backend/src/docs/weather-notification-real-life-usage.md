# Weather Notification System - Real-Life Usage & Flow Documentation

## 📋 Overview

This document provides real-world scenarios and detailed flow diagrams for the weather notification system, showing exactly when and how notifications are triggered based on weather conditions in your 6 monitoring locations.

## 🗺️ **Your Current Setup**

### **Monitoring Locations**

- **Coastal West** - Marine/coastal area
- **Coastal East** - Eastern shoreline region
- **Central Naic** - Urban center/downtown
- **Sabang** - Rural/residential area
- **Farm Area** - Agricultural region
- **Naic Boundary** - Border/peripheral zone

### **Data Collection Schedule**

- **Realtime Data**: Every 30 minutes → Powers WARNING notifications
- **Hourly Data**: Every 60 minutes → Powers ADVISORY notifications
- **Daily Data**: Every 12 hours → Powers INFO notifications
- **Critical Conditions**: Immediate processing → CRITICAL notifications

## ⏰ **Notification Flow Timeline**

```
🕐 Data Collection Flow:
├── 00:00 ── Realtime (30min) ── WARNING Check ── Hourly (60min) ── Daily (12hr)
├── 00:30 ── Realtime (30min) ── WARNING Check
├── 01:00 ── Realtime (30min) ── WARNING Check ── Hourly (60min) ── ADVISORY Check
├── 01:30 ── Realtime (30min) ── WARNING Check
├── 02:00 ── Realtime (30min) ── WARNING Check ── Hourly (60min) ── ADVISORY Check
└── ... continues 24/7

🚨 CRITICAL: Triggered immediately after ANY data collection detects dangerous conditions
📊 INFO: Every 6 hours (00:00, 06:00, 12:00, 18:00) for general updates
```

## 🌡️ **CRITICAL Notifications - Immediate Response**

### **Scenario 1: Extreme Heat Emergency**

```
📍 Location: Farm Area
🕒 Time: 2:15 PM (peak heat)
🌡️ Conditions: Temperature 38°C, Feels like 42°C, Humidity 85%

FLOW:
1. Weather collection function runs (realtime data update)
2. Detects: temperatureApparent (42°C) ≥ threshold (40°C)
3. IMMEDIATE trigger of notification-critical function
4. Notification sent within 30 seconds:

📱 Notification:
"🔥 EXTREME HEAT EMERGENCY - Farm Area
LIFE-THREATENING heat! Feels like 42.0°C. Stay indoors immediately.
Risk of heatstroke is EXTREME. Seek air conditioning or cooling centers."

👥 Recipients: ALL users (admin + public)
⏱️ Cooldown: 10 minutes (can send another if conditions persist)
```

### **Scenario 2: Flash Flood Alert**

```
📍 Location: Coastal West
🕒 Time: 11:45 AM (monsoon season)
🌧️ Conditions: Rainfall intensity 55mm/h, Wind 18 m/s

FLOW:
1. Realtime data collection detects extreme rainfall
2. System checks: rainIntensity (55mm/h) ≥ threshold (50mm/h)
3. CRITICAL notification triggered immediately
4. All users in coastal areas alerted:

📱 Notification:
"⚡ FLASH FLOOD EMERGENCY - Coastal West
EXTREME RAINFALL: 55.0mm/h! Flash flooding imminent.
DO NOT drive through flooded roads. Seek higher ground immediately."

👥 Recipients: ALL users
🚨 Priority: Highest (overrides all other notifications)
```

### **Scenario 3: Dangerous Wind Storm**

```
📍 Location: Naic Boundary
🕒 Time: 3:20 AM (typhoon approach)
💨 Conditions: Wind gusts 22 m/s (79 km/h), Sustained winds 19 m/s

FLOW:
1. Automated weather monitoring detects extreme winds
2. System evaluates: windGust (22 m/s) ≥ threshold (20 m/s)
3. CRITICAL alert sent immediately to all devices:

📱 Notification:
"💨 EXTREME WIND EMERGENCY - Naic Boundary
LIFE-THREATENING wind gusts: 22.0m/s (79km/h) from Northwest.
Widespread damage expected. Stay indoors away from windows and trees."

👥 Recipients: ALL users
⚠️ Action: Emergency services may be automatically notified
```

## ⚠️ **WARNING Notifications - Every 30 Minutes**

### **Scenario 4: Heavy Rain with Flooding Risk**

```
📍 Location: Central Naic
🕒 Schedule: Every 30 minutes (synced with realtime data)
🌧️ Conditions: Rainfall 9mm/h, Previous accumulation 25mm

TIMING FLOW:
├── 08:00 ── Data collected ── WARNING threshold met ── Notification sent
├── 08:30 ── Data collected ── Still raining ── Cooldown active (30 min) ── SKIPPED
├── 09:00 ── Data collected ── Rain continues ── Cooldown expired ── Notification sent
└── 09:30 ── Data collected ── Rain stopped ── No notification needed

📱 Notification (sent at 08:00 and 09:00):
"🌧️ HEAVY RAIN WARNING - Central Naic
Heavy rainfall detected: 9.0mm/h. Flooding possible in low-lying areas.
Avoid unnecessary travel. Turn around, don't drown."

👥 Recipients: Admin + Public users
🔄 Rate Limit: Max 3 notifications per location per 30-min cycle
```

### **Scenario 5: Dangerous Heat Index**

```
📍 Location: Sabang
🕒 Schedule: Every 30 minutes during hot weather
🌡️ Conditions: Temperature 36°C, Humidity 75%, Heat Index 39°C

TIMING FLOW:
├── 12:30 ── Realtime data ── Heat warning threshold ── Notification sent
├── 13:00 ── Realtime data ── Still hot ── Cooldown active ── SKIPPED
├── 13:30 ── Realtime data ── Temperature rising ── Cooldown expired ── New notification
└── 14:00 ── Temperature drops ── Below threshold ── No notification

📱 Notification:
"🌡️ SEVERE HEAT WARNING - Sabang
Dangerous heat conditions: 36.0°C (feels like 39.0°C).
High risk of heat-related illness. Limit outdoor exposure and stay hydrated."
```

## 📋 **ADVISORY Notifications - Every 2 Hours**

### **Scenario 6: Strong Wind Advisory**

```
📍 Location: Coastal East
🕒 Schedule: Every 2 hours (01:00, 03:00, 05:00, 07:00, etc.)
💨 Conditions: Wind speed 10 m/s, Gusts 12 m/s

TIMING FLOW:
├── 14:00 ── Hourly data collection
├── 15:00 ── Hourly data collection ── ADVISORY check (every 2hr) ── Threshold met
├── 15:01 ── Advisory notification sent
├── 16:00 ── Hourly data collection
├── 17:00 ── Hourly data collection ── ADVISORY check ── Cooldown active (2hr) ── SKIPPED
└── 17:00+ ── Next advisory possible at 17:01 (2hr cooldown expired)

📱 Notification (sent at 15:01):
"💨 Strong Wind Advisory - Coastal East
Strong winds at 10.0m/s (36km/h) from Northwest.
Secure lightweight objects and use caution when driving."

👥 Recipients: Admin + Public users
⏱️ Cooldown: 2 hours between same advisory types
```

### **Scenario 7: High UV Alert**

```
📍 Location: Farm Area
🕒 Schedule: Every 2 hours during daylight (08:00, 10:00, 12:00, 14:00, 16:00)
☀️ Conditions: UV Index 9, Cloud cover 30%, Temperature 33°C

TIMING FLOW:
├── 10:00 ── Hourly data ── UV threshold met ── Advisory sent
├── 11:00 ── Hourly data
├── 12:00 ── Hourly data ── ADVISORY check (2hr cycle) ── Still high UV ── Cooldown active ── SKIPPED
├── 13:00 ── Hourly data
└── 14:00 ── Hourly data ── ADVISORY check ── Cooldown expired ── New advisory sent

📱 Notification:
"☀️ Very High UV Alert - Farm Area
Very High UV Index: 9. Skin damage possible in 15-20 minutes.
Use SPF 30+, seek shade during midday, wear protective clothing."
```

## ℹ️ **INFO Notifications - Every 6 Hours**

### **Scenario 8: General Weather Update**

```
📍 Location: All locations (Central Naic primary)
🕒 Schedule: Fixed times (00:00, 06:00, 12:00, 18:00)
🌤️ Conditions: Partly cloudy, 28°C, Light winds, 60% rain chance

TIMING FLOW:
├── 18:00 ── Daily data collection triggers INFO check
├── 18:01 ── General conditions evaluated ── INFO threshold met ── Notification sent
├── 00:00 ── Next INFO cycle ── Conditions improved ── No notification
├── 06:00 ── INFO cycle ── New weather pattern ── Notification sent
└── 12:00 ── INFO cycle ── Routine update ── Notification sent

📱 Notification (18:01):
"🌞 High UV Advisory - Central Naic
High UV Index: 7. Sun protection recommended for extended outdoor activities.
Apply sunscreen and reapply every 2 hours."

👥 Recipients: ADMIN ONLY (reduces notification fatigue for public)
📊 Purpose: Keep administrators informed of general conditions
```

## 🔄 **Multi-Location Scenario: Typhoon Approaching**

### **Real-Time Sequence During Severe Weather Event**

```
🌀 TYPHOON SCENARIO - Multiple locations affected simultaneously

🕒 14:30 - Storm intensifies:

📍 COASTAL WEST (14:31):
🚨 CRITICAL: "💨 EXTREME WIND EMERGENCY - Wind gusts 25m/s!"
👥 → ALL users (immediate)

📍 COASTAL EAST (14:32):
🚨 CRITICAL: "⚡ FLASH FLOOD EMERGENCY - Rainfall 60mm/h!"
👥 → ALL users (immediate)

📍 CENTRAL NAIC (14:33):
⚠️ WARNING: "🌧️ HEAVY RAIN WARNING - 8mm/h with flooding risk"
👥 → Admin + Public (30-min cycle)

📍 SABANG (14:34):
⚠️ WARNING: "💨 Strong Wind Warning - Gusts up to 18m/s"
👥 → Admin + Public (30-min cycle)

📍 FARM AREA (14:35):
📋 ADVISORY: "🌦️ Moderate Rain Alert - 4mm/h steady rain"
👥 → Admin + Public (2-hour cycle)

📍 NAIC BOUNDARY (14:36):
📋 ADVISORY: "🌬️ Strong Wind Advisory - 12m/s sustained winds"
👥 → Admin + Public (2-hour cycle)

RESULT: Users receive 2-6 notifications based on their location preferences
```

## 📱 **User Experience Scenarios**

### **Scenario A: Urban Resident (Central Naic)**

```
👤 Maria - Office worker living in Central Naic
📍 Location preference: Central Naic only
⚙️ Notification settings: All levels enabled

TYPICAL DAY:
├── 08:00 ── ℹ️ "Partly cloudy, 28°C expected high"
├── 12:30 ── 📋 "High UV Advisory - Use sun protection"
├── 15:45 ── ⚠️ "Heavy rain approaching - seek shelter"
├── 16:15 ── 🚨 "FLASH FLOOD EMERGENCY - avoid low areas!"
└── 18:00 ── ℹ️ "Storm passed, conditions improving"

📊 Result: 5 relevant notifications for her specific location and safety
```

### **Scenario B: Agricultural Worker (Multiple Locations)**

```
👤 Juan - Farmer working across Farm Area and Naic Boundary
📍 Location preferences: Farm Area + Naic Boundary
⚙️ Notification settings: Critical + Warning only (disabled Advisory/Info)

HARVEST DAY:
├── 06:00 ── 🚨 "EXTREME HEAT EMERGENCY - Farm Area (42°C)"
├── 06:01 ── 🚨 "EXTREME HEAT EMERGENCY - Naic Boundary (40°C)"
├── 14:30 ── ⚠️ "Heavy Rain Warning - Farm Area (work interruption)"
└── 14:35 ── ⚠️ "Strong Wind Warning - Naic Boundary (equipment risk)"

📊 Result: 4 critical alerts affecting his work locations and safety
```

### **Scenario C: Admin/Emergency Responder**

```
👤 Dr. Santos - Municipal disaster coordinator
📍 Location preferences: ALL locations (regional oversight)
⚙️ Notification settings: ALL levels (full monitoring)

EMERGENCY COORDINATION:
├── 13:00 ── 🚨 "CRITICAL alerts from 3 locations - coordinate response"
├── 13:30 ── ⚠️ "WARNING conditions spreading to 4 locations"
├── 15:00 ── 📋 "ADVISORY updates from all 6 monitoring points"
└── 18:00 ── ℹ️ "Regional weather summary and outlook"

📊 Result: 15+ notifications providing complete situational awareness
```

## 🔧 **System Performance & Rate Limiting**

### **Notification Throttling Logic**

```
PER LOCATION LIMITS:
├── CRITICAL: Max 5 per location (10-min cooldown)
├── WARNING: Max 3 per location (30-min cooldown)
├── ADVISORY: Max 2 per location (2-hour cooldown)
└── INFO: Max 1 per location (6-hour cooldown)

EXAMPLE - Heavy Storm in Coastal West:
├── 14:00 ── 🚨 Critical #1 (Flash flood - 60mm/h)
├── 14:05 ── 🚨 Critical #2 (Extreme winds - 25m/s)
├── 14:12 ── 🚨 Critical #3 (Hail detected)
├── 14:15 ── 🚨 Critical #4 blocked (10-min cooldown active)
├── 14:25 ── 🚨 Critical #4 sent (cooldown expired)
└── 14:30 ── 🚨 Critical #5 (tornado warning - final slot)

After 5 CRITICAL notifications, system waits for conditions to change
or until next data collection cycle before evaluating new threats.
```

### **User Token Management**

```
FIRESTORE STRUCTURE:
users/{userId} = {
  fcmToken: "user_device_token_123",
  userType: "public" | "admin",
  notificationsEnabled: true,
  locationPreferences: ["central_naic", "farm_area"],
  notificationLevels: ["CRITICAL", "WARNING", "ADVISORY"] // User choice
}

TARGETING LOGIC:
├── CRITICAL → ALL users (safety override)
├── WARNING → Users with matching locations + notification level enabled
├── ADVISORY → Users with matching locations + notification level enabled
└── INFO → Admin users only (reduces public notification fatigue)
```

## 📊 **Daily Operation Summary**

### **Typical 24-Hour Cycle**

```
AUTOMATED PROCESSING:
├── 144 realtime data collections (every 30min × 6 locations)
├── 144 WARNING notification checks (paired with realtime)
├── 72 ADVISORY notification checks (every 2hr × 6 locations)
├── 24 INFO notification checks (every 6hr × 6 locations)
└── Variable CRITICAL checks (triggered by dangerous conditions)

EXPECTED NOTIFICATIONS (Normal Weather):
├── CRITICAL: 0-2 per day (rare, emergency only)
├── WARNING: 2-8 per day (weather-dependent)
├── ADVISORY: 6-12 per day (routine conditions)
└── INFO: 1-4 per day (general updates)

HIGH-ACTIVITY DAYS (Severe Weather):
├── CRITICAL: 10-20 per day (multiple emergencies)
├── WARNING: 15-30 per day (widespread conditions)
├── ADVISORY: 12-24 per day (regional impacts)
└── INFO: 4-6 per day (situation updates)
```

This real-life documentation shows exactly how your weather notification system operates, ensuring users receive timely, relevant, and potentially life-saving weather alerts based on actual conditions in their areas of interest! 🌤️⚡🚨

## 🎯 **Key Benefits of This Design**

1. **🚨 Life Safety Priority**: Critical conditions override all rate limiting
2. **📍 Location Relevance**: Users only get alerts for their chosen areas
3. **⏰ Smart Timing**: Notifications aligned with data freshness
4. **🛡️ Spam Prevention**: Intelligent cooldowns prevent alert fatigue
5. **👥 Audience Targeting**: Different notification strategies for admins vs public
6. **🔄 Scalable Processing**: Handles multiple simultaneous weather events
7. **📱 Multi-Device Support**: Works across web admin dashboard and mobile apps

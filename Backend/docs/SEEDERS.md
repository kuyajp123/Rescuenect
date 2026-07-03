# Rescuenect Data Seeders

The Rescuenect backend includes a comprehensive data seeding system designed to quickly populate Firestore and Supabase Storage with realistic, localized data for development, testing, and demonstration purposes.

All seeder scripts are located in `Backend/scripts/seeders/` and are orchestrated by a central runner (`Backend/scripts/seed.ts`).

---

## 🏗️ Architecture

The seeding system is built with a few core principles:

1. **Client-Scoped:** All seeded data is strictly tied to a specific Local Government Unit (LGU) or client (e.g., `naic`). The seeder validates that the client exists in Firestore before writing any data.
2. **Self-Contained Images:** To avoid external dependencies or heavy image-processing libraries (like Sharp or Canvas), the seeder uses deterministic, color-coded SVG placeholders. These are converted to buffers and uploaded directly to Supabase Storage, appearing as valid images in the app.
3. **Environment Aware:** To prevent accidental pollution of production data, the seeders are strictly bound to environment NPM aliases (e.g., `seed:staging` vs `seed:production`).

---

## 📦 Supported Modules

You can run seeders individually or all at once using the `--module` flag.

### 1. Evacuations (`evacuations`)
- **Collection:** `centers`
- **Bucket:** `evacuation-centers`
- **Details:** Generates realistic evacuation center records (e.g., "Barangay Multi-Purpose Hall", "Municipal Covered Court") with randomized capacities, occupancy, facilities (Restrooms, Medical Team, Generator), and localized coordinates within the client's bounds. Uploads an SVG placeholder image for the center.

### 2. Danger Zones (`danger-zones`)
- **Collection:** `dangerZones`
- **Bucket:** None
- **Details:** Creates hazard zone reports (Flood, Landslide, Earthquake Fault, etc.). Randomly utilizes three geometry types: `point`, `circle`, and `polygon`, complete with bounding box (`bbox`) and centroid calculations. Data is seeded as `lgu_official` to bypass resident UID requirements. 

### 3. Announcements (`announcements`)
- **Collection:** `announcements`
- **Bucket:** `announcement-thumbnails`
- **Details:** Seeds LGU-style advisories and announcements (e.g., "Mandatory Evacuation Order", "Relief Operations Schedule"). Categorizes them (Emergency, Weather, Relief) and generates professional-looking SVG thumbnail placeholders.

### 4. Contacts (`contacts`)
- **Collection:** `contacts` (Document ID = clientId)
- **Bucket:** None
- **Details:** Seeds a complete emergency contact directory for the LGU. It generates Categories (Emergency Services, Health Services, LGU Offices, Utilities) and fills them with relevant contact items, including icons, colors, and actions (`call`, `open`, `email`).
- *Note:* Writes directly to Firestore to bypass the strict logo requirements present in the standard `ContactModel`.

### 5. Carousel (`carousel`)
- **Collection:** `carouselSlides`
- **Bucket:** `carousel-slides`
- **Details:** Generates informational and emergency-preparedness slides for the mobile app's carousel component (e.g., "Stay Safe, Stay Informed", "Know Your Evacuation Routes"). Shuffles templates randomly and uploads corresponding SVG slides.

---

## 🚀 Usage Guide

All seed commands are executed via NPM scripts defined in `Backend/package.json`. You **must** provide the `--client` argument.

### Seeding Staging (Safe)
The `seed:staging` commands automatically inject `APP_ENV=staging`, which loads your `.env.staging` file. 

```bash
# Seed all modules
npm run seed:staging:all -- --client=naic

# Seed a specific module
npm run seed:staging:evacuations -- --client=naic
npm run seed:staging:danger-zones -- --client=naic

# Control the amount of generated records (default is 5)
npm run seed:staging -- --client=naic --module=announcements --count=10
```

### Seeding Production (Live Data)
The `seed:production` commands inject `APP_ENV=production`, loading `.env.production` or falling back to your default `.env`. 
> ⚠️ **Warning:** Running these commands will trigger a large visual warning in the terminal before execution, as it writes real records to the live database.

```bash
# Seed all modules to production
npm run seed:production:all -- --client=naic

# Seed specific modules to production
npm run seed:production:carousel -- --client=naic
npm run seed:production:contacts -- --client=naic
```

## 🧹 Unseeder System

The system also provides an unseeder that cleanly deletes database records and their associated Storage images.

### Deletion Targets
The unseeder uses a `--target` argument to determine what to delete:
- `--target=seeded` *(Default)*: Only deletes records explicitly marked as created by the seeder (e.g. `createdBy: 'seeder-system'`).
- `--target=all`: Deletes **ALL** records for the specified module and client, wiping real user data. Because this is highly destructive, you will always be prompted for a `(y/N)` confirmation in the terminal before it proceeds.

### Usage

```bash
# Safely remove all seeded data from all modules (Staging)
npm run unseed:staging:all -- --client=naic --target=seeded

# Safely remove seeded evacuations
npm run unseed:staging -- --client=naic --module=evacuations

# ⚠️ DESTRUCTIVE: Delete ALL danger zones (seeded + real) for client 'naic'
npm run unseed:staging -- --client=naic --module=danger-zones --target=all
```

---

## 🔧 Internal Mechanisms

- **`scripts/run-seed-env.js`:** A cross-platform Node.js wrapper that sets the `APP_ENV` variable and utilizes `npx ts-node` to reliably run the TypeScript seeder regardless of whether you are on Windows, Mac, or Linux. 
- **`scripts/seed.ts`:** The main entry point. Parses CLI arguments (`--client`, `--module`, `--count`) and dispatches the execution to the corresponding seeder module.
- **`scripts/seeders/_utils.ts`:** Houses shared utilities like `pick()`, `randomInt()`, array shufflers, Firestore client validation, and the `generatePlaceholderImageBuffer` SVG builder.

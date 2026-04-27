import { getRawClient } from '../db'
import { newId } from './uuid'

export class SeedService {
  async isDemoLoaded(): Promise<boolean> {
    const client = getRawClient()
    try {
      const [partners, programs, teachers] = await Promise.all([
        client.execute(`SELECT COUNT(*) as c FROM partners`),
        client.execute(`SELECT COUNT(*) as c FROM programs`),
        client.execute(`SELECT COUNT(*) as c FROM teachers`),
      ])
      return (
        Number((partners.rows[0] as any).c) >= 10 &&
        Number((programs.rows[0] as any).c) >= 17 &&
        Number((teachers.rows[0] as any).c) >= 12
      )
    } catch {
      return false
    }
  }

  async loadDemo(): Promise<{ inserted: Record<string, number> }> {
    const client = getRawClient()
    await this.clearAll(false)
    const now = Math.floor(Date.now() / 1000)

    // ── IDs ────────────────────────────────────────────────────────────────────
    const districtSCCS = newId(), districtOUSD = newId(), districtLAUSD = newId()
    const schoolGault = newId(), schoolBranciforte = newId(), schoolFruitvale = newId(), schoolMarinaDelRey = newId()
    const teacherMaria = newId(), teacherJames = newId(), teacherSarah = newId(), teacherAisha = newId()
    const teacherBen = newId(), teacherPriya = newId(), teacherOlivia = newId(), teacherDaniel = newId()
    const teacherNoemi = newId(), teacherEthan = newId(), teacherCamila = newId(), teacherGrace = newId()
    const partnerElkhorn = newId(), partnerPieRanch = newId(), partnerUCSCFarm = newId()
    const partnerPointReyes = newId(), partnerTreePeople = newId(), partnerCoyoteHills = newId()
    const partnerYES = newId(), partnerLAWaterkeeper = newId(), partnerAnoNuevo = newId(), partnerFarmlab = newId()

    // ── Program IDs (pre-generate so standards can reference them) ─────────────
    const pids = Array.from({ length: 17 }, () => newId())

    // ── Build all INSERT statements ────────────────────────────────────────────
    const stmts: { sql: string; args: any[] }[] = []

    // Districts
    const districts = [
      [districtSCCS, 'Santa Cruz City Schools', 'Santa Cruz', 'superintendent@sccs.net', 6800],
      [districtOUSD, 'Oakland Unified School District', 'Alameda', 'info@ousd.org', 34000],
      [districtLAUSD, 'Los Angeles Unified School District', 'Los Angeles', 'info@lausd.net', 430000],
    ]
    for (const [id, name, county, email, enroll] of districts) {
      stmts.push({ sql: `INSERT OR IGNORE INTO districts (id, name, county, superintendent_email, enrollment_total) VALUES (?, ?, ?, ?, ?)`, args: [id, name, county, email, enroll] })
    }

    // Schools
    const schools = [
      [schoolGault, 'Gault Elementary', districtSCCS, '1320 Seabright Ave, Santa Cruz, CA 95062', 'Santa Cruz', 'Santa Cruz', 36.9741, -122.0308, 340, 0],
      [schoolBranciforte, 'Branciforte Middle School', districtSCCS, '315 Poplar Ave, Santa Cruz, CA 95062', 'Santa Cruz', 'Santa Cruz', 36.9817, -122.0191, 520, 1],
      [schoolFruitvale, 'Fruitvale Elementary', districtOUSD, '3200 Boston Ave, Oakland, CA 94602', 'Oakland', 'Alameda', 37.7913, -122.2139, 410, 1],
      [schoolMarinaDelRey, 'Marina del Rey Middle School', districtLAUSD, '12500 Braddock Dr, Los Angeles, CA 90066', 'Los Angeles', 'Los Angeles', 33.9803, -118.4517, 680, 0],
    ]
    for (const [id, name, did, addr, city, county, lat, lng, enroll, t1] of schools) {
      stmts.push({ sql: `INSERT OR IGNORE INTO schools (id, name, district_id, address, city, county, lat, lng, enrollment, title1_flag, geocoding_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'success')`, args: [id, name, did, addr, city, county, lat, lng, enroll, t1] })
    }

    // Teachers
    const teachers = [
      [teacherMaria, 'Maria Chen', 'mchen@sccs.net', schoolGault, ['3','4','5'], ['Life Science','Earth Science','Biodiversity'], 36.9741, -122.0308, '95062'],
      [teacherJames, 'James Rodriguez', 'jrodriguez@ousd.org', schoolFruitvale, ['6','7','8'], ['Climate Justice','Water','Earth Science'], 37.7913, -122.2139, '94602'],
      [teacherSarah, 'Sarah Kim', 'skim@lausd.net', schoolMarinaDelRey, ['K','1','2'], ['Life Science','Biodiversity'], 33.9803, -118.4517, '90066'],
      [teacherAisha, 'Aisha Patel', 'apatel@sccs.net', schoolBranciforte, ['6','7'], ['Water','Earth Science','Biodiversity'], 36.9817, -122.0191, '95062'],
      [teacherBen, 'Ben Thompson', 'bthompson@sccs.net', schoolGault, ['1','2'], ['Life Science','Agriculture'], 36.9741, -122.0308, '95062'],
      [teacherPriya, 'Priya Narayan', 'pnarayan@ousd.org', schoolFruitvale, ['3','4'], ['Climate Justice','Agriculture'], 37.7913, -122.2139, '94602'],
      [teacherOlivia, 'Olivia Martinez', 'omartinez@ousd.org', schoolFruitvale, ['9','10'], ['Climate Justice','Earth Science','Water'], 37.7913, -122.2139, '94602'],
      [teacherDaniel, 'Daniel Nguyen', 'dnguyen@lausd.net', schoolMarinaDelRey, ['4','5'], ['Water','Life Science'], 33.9803, -118.4517, '90066'],
      [teacherNoemi, 'Noemi Rivera', 'nrivera@lausd.net', schoolMarinaDelRey, ['11','12'], ['Climate Justice','Indigenous Ecological Knowledge'], 33.9803, -118.4517, '90066'],
      [teacherEthan, 'Ethan Brooks', 'ebrooks@sccs.net', schoolBranciforte, ['8'], ['Earth Science','Agriculture'], 36.9817, -122.0191, '95062'],
      [teacherCamila, 'Camila Flores', 'cflores@ousd.org', schoolFruitvale, ['TK','K'], ['Life Science','Biodiversity'], 37.7913, -122.2139, '94602'],
      [teacherGrace, 'Grace Wilson', 'gwilson@lausd.net', schoolMarinaDelRey, ['7','8'], ['Water','Biodiversity','Climate Justice'], 33.9803, -118.4517, '90066'],
    ]
    for (const [id, name, email, sid, grades, subjects, lat, lng, zip] of teachers) {
      stmts.push({ sql: `INSERT OR IGNORE INTO teachers (id, name, email, school_id, grade_levels, subjects, lat, lng, zip) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, args: [id, name, email, sid, JSON.stringify(grades), JSON.stringify(subjects), lat, lng, zip] })
    }

    // Partners
    const partners: [string, string, string, string, string, number, number, string, string, string, number][] = [
      [partnerElkhorn, 'Elkhorn Slough National Estuarine Research Reserve', 'wetlands', "One of California's most important wetland habitats, offering research-based field programs for students to explore estuarine ecology, wildlife monitoring, and coastal climate change.", '1700 Elkhorn Rd, Watsonville, CA 95076', 36.8278, -121.7453, 'Monterey', 'education@elkhornslough.org', 'https://elkhornslough.org', 95],
      [partnerPieRanch, 'Pie Ranch', 'agriculture', 'A diversified organic farm and education center in San Mateo County teaching food systems, sustainable agriculture, and community resilience to students from farm to table.', '2080 CA-1, Pescadero, CA 94060', 37.2566, -122.4014, 'San Mateo', 'education@pieranch.org', 'https://pieranch.org', 88],
      [partnerUCSCFarm, 'UCSC Farm & Garden', 'agriculture', 'The 30-acre UC Santa Cruz Farm and Alan Chadwick Garden offer hands-on programs connecting students to organic farming, soil health, and the science of growing food.', '1156 High St, Santa Cruz, CA 95064', 36.9914, -122.0618, 'Santa Cruz', 'casfs@ucsc.edu', 'https://casfs.ucsc.edu', 82],
      [partnerPointReyes, 'Point Reyes National Seashore Association', 'wetlands', 'Environmental education programs at Point Reyes exploring coastal ecology, migratory birds, tule elk, and the effects of climate change on Pacific coastlines.', '1 Bear Valley Rd, Point Reyes Station, CA 94956', 38.0698, -122.8005, 'Marin', 'education@ptreyes.org', 'https://ptreyes.org', 90],
      [partnerTreePeople, 'TreePeople', 'urban_ecology', 'Los Angeles-based urban forestry organization offering outdoor classroom programs focused on stormwater, urban heat islands, tree planting, and community environmental stewardship.', '12601 Mulholland Dr, Beverly Hills, CA 90210', 34.0840, -118.4343, 'Los Angeles', 'education@treepeople.org', 'https://treepeople.org', 91],
      [partnerCoyoteHills, 'Coyote Hills Regional Park Education', 'wetlands', 'East Bay Regional Park programs set in 1,265 acres of marshland and rolling hills, offering programs on Bay Area ecology, Ohlone culture, and freshwater/saltwater interfaces.', '8000 Patterson Ranch Rd, Fremont, CA 94555', 37.5500, -122.0591, 'Alameda', 'info@ebparks.org', 'https://ebparks.org', 78],
      [partnerYES, 'Youth Energy Squad (YES)', 'climate_justice', 'Oakland-based youth climate justice organization running hands-on programs teaching energy efficiency, green jobs, and community organizing for frontline communities.', '1611 Telegraph Ave, Oakland, CA 94612', 37.8044, -122.2469, 'Alameda', 'info@youthenergyquad.org', 'https://youthenergyquad.org', 85],
      [partnerLAWaterkeeper, 'Los Angeles Waterkeeper', 'climate_justice', "Watchdog organization protecting LA's watersheds through education programs teaching students to monitor water quality, understand stormwater systems, and advocate for environmental justice.", '360 22nd St, Santa Monica, CA 90402', 34.0195, -118.4912, 'Los Angeles', 'education@lawaterkeeper.org', 'https://lawaterkeeper.org', 80],
      [partnerAnoNuevo, 'Año Nuevo State Park Docents', 'wetlands', "Educational programs at Año Nuevo State Park focused on elephant seal biology, coastal ecosystems, and population ecology.", 'New Years Creek Rd, Pescadero, CA 94060', 37.1088, -122.3296, 'San Mateo', 'anonuevo@parks.ca.gov', 'https://parks.ca.gov/anonuevo', 72],
      [partnerFarmlab, 'Farmlab / Manzanita Seed', 'agriculture', 'Urban agriculture education in Los Angeles offering programs on seed saving, food sovereignty, Indigenous food systems, and urban soil science.', '1745 N Spring St, Los Angeles, CA 90012', 34.0664, -118.2521, 'Los Angeles', 'info@farmlab.us', 'https://farmlab.us', 76],
    ]
    for (const [id, name, type, desc, addr, lat, lng, county, email, website, score] of partners) {
      stmts.push({ sql: `INSERT OR IGNORE INTO partners (id, name, type, description, address, lat, lng, county, contact_email, website, status, profile_score, geocoding_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, 'success')`, args: [id, name, type, desc, addr, lat, lng, county, email, website, score] })
    }

    // Programs
    const programsData: [string, string, string, string, string[], string[], number, number, number, string[], number, number][] = [
      [pids[0], partnerElkhorn, 'Slough Explorers: Estuarine Food Webs', 'Students wade into the slough ecosystem to collect invertebrate samples and construct food web diagrams, investigating how sea level rise threatens this fragile system.', ['4','5','6'], ['Life Science','Earth Science','Biodiversity'], 30, 180, 8, ['Fall','Spring'], 36.8278, -121.7453],
      [pids[1], partnerElkhorn, 'Coastal Bird Monitoring & Climate Indicators', 'An advanced program for middle and high schoolers to conduct real shorebird surveys using eBird data submission. Students analyze 10-year trend data to understand phenology shifts.', ['6','7','8','9','10'], ['Life Science','Earth Science'], 24, 240, 12, ['Fall','Winter','Spring'], 36.8278, -121.7453],
      [pids[2], partnerPieRanch, 'From Seed to Table: Farm Science Immersion', 'A full-day farm visit where students plant, harvest, and cook a seasonal dish. Activities include soil texture testing, composting biology, and a guided harvest walk.', ['2','3','4','5'], ['Agriculture','Life Science'], 28, 360, 15, ['Spring','Fall'], 37.2566, -122.4014],
      [pids[3], partnerPieRanch, "Soil Health & Carbon: What's Under Our Feet", 'Students dig soil profiles, measure organic matter, and conduct Brix testing on vegetables to explore the connection between soil health, plant nutrition, and carbon sequestration.', ['6','7','8'], ['Agriculture','Earth Science','Life Science'], 25, 270, 10, ['Spring','Fall'], 37.2566, -122.4014],
      [pids[4], partnerUCSCFarm, 'Biointensive Gardening Workshop for Schools', 'Led by UCSC farm apprentices, students learn double-digging raised bed techniques, companion planting, and integrated pest management in the historic Chadwick Garden.', ['3','4','5','6'], ['Agriculture','Life Science'], 32, 150, 0, ['Spring'], 36.9914, -122.0618],
      [pids[5], partnerUCSCFarm, 'Pollinator Pathways: Bee Biology & Native Plants', "Students explore the UCSC Farm's certified organic fields and native habitat areas to study pollinator decline, native bee identification, and habitat restoration design.", ['4','5','6','7'], ['Life Science','Biodiversity'], 30, 180, 5, ['Spring','Summer'], 36.9914, -122.0618],
      [pids[6], partnerPointReyes, 'Tule Elk & Grassland Ecology', 'Students hike through the Tomales Point wildlife corridor to observe the reintroduced tule elk herd and study grassland food webs, carrying capacity, and apex species.', ['5','6','7','8'], ['Life Science','Biodiversity','Earth Science'], 28, 300, 5, ['Fall','Winter','Spring'], 38.0698, -122.8005],
      [pids[7], partnerPointReyes, 'Intertidal Zone Science: Rocky Shore Surveys', 'Students conduct quadrat surveys of rocky intertidal zones, documenting species distribution by tidal zone. Compare data to 20-year baseline records to observe climate-driven range shifts.', ['6','7','8','9','10','11','12'], ['Life Science','Earth Science','Biodiversity'], 20, 360, 8, ['Spring','Summer'], 38.0698, -122.8005],
      [pids[8], partnerTreePeople, 'Urban Forest Rangers: Tree Planting & Stewardship', "Students become certified Urban Forest Rangers by learning tree ID, planting technique, and stormwater benefits. Each class plants trees in their neighborhood and tracks growth via app.", ['3','4','5','6','7'], ['Life Science','Earth Science','Climate Justice'], 35, 120, 0, ['Fall','Winter','Spring'], 34.0840, -118.4343],
      [pids[9], partnerTreePeople, 'Cool Neighborhoods: Urban Heat & Climate Equity', 'High school students use infrared thermometers to map temperature differences between tree-lined and heat-exposed streets, analyzing equity implications and designing cooling proposals.', ['9','10','11','12'], ['Climate Justice','Earth Science'], 30, 240, 0, ['Spring','Summer','Fall'], 34.0840, -118.4343],
      [pids[10], partnerCoyoteHills, 'Marsh Discovery: Bay Area Wetland Ecology', 'Students explore pickleweed marshes and mudflats at Coyote Hills to investigate seasonal flooding, salt tolerance adaptations, and the role of wetlands as carbon sinks.', ['4','5','6','7'], ['Life Science','Earth Science','Biodiversity'], 32, 210, 6, ['Fall','Winter','Spring'], 37.5500, -122.0591],
      [pids[11], partnerCoyoteHills, 'Ohlone Lifeways & Traditional Ecological Knowledge', 'Facilitated by Ohlone community partners, students explore the reconstructed village site and tule marsh to learn about traditional ecological knowledge and sustainable harvesting.', ['3','4','5'], ['Biodiversity','Life Science'], 30, 180, 4, ['Fall','Spring'], 37.5500, -122.0591],
      [pids[12], partnerYES, 'Home Energy Audit: Youth as Climate Advocates', 'Students learn to use energy audit tools (kill-a-watt meters, thermal imaging cameras) to assess energy waste in homes and public buildings, then present recommendations to city council.', ['7','8','9','10','11','12'], ['Climate Justice','Earth Science'], 25, 180, 0, ['Fall','Winter','Spring','Summer'], 37.8044, -122.2469],
      [pids[13], partnerLAWaterkeeper, 'LA River Macroinvertebrate Monitoring', 'Students wade into the LA River with Waterkeeper scientists to collect benthic macroinvertebrates and calculate biotic integrity indices—real data used in regulatory reporting.', ['6','7','8','9','10'], ['Water','Life Science','Earth Science','Climate Justice'], 24, 240, 0, ['Spring','Fall'], 34.0195, -118.4912],
      [pids[14], partnerLAWaterkeeper, 'Stormwater & Environmental Justice: Who Bears the Flood Risk?', 'Students map impervious surfaces and flood-vulnerable neighborhoods, analyze FEMA flood maps against income data, and design green infrastructure solutions.', ['8','9','10','11','12'], ['Water','Climate Justice','Earth Science'], 30, 180, 0, ['Fall','Winter','Spring'], 34.0195, -118.4912],
      [pids[15], partnerAnoNuevo, 'Elephant Seal Biology & Population Dynamics', 'Docent-led guided walks to observe the Northern elephant seal breeding colony. Students learn reproductive ecology, deep-diving physiology, and population recovery as a conservation success.', ['4','5','6','7','8'], ['Life Science','Biodiversity'], 25, 240, 12, ['Winter','Spring'], 37.1088, -122.3296],
      [pids[16], partnerFarmlab, 'Seed Sovereignty: Indigenous Food Systems & Urban Agriculture', 'Students learn seed saving techniques from Indigenous food sovereignty advocates, explore the history of seed patents and food colonization, and plant their own seed gardens.', ['5','6','7','8','9','10'], ['Agriculture','Biodiversity','Climate Justice'], 28, 150, 0, ['Spring','Fall'], 34.0664, -118.2521],
    ]
    for (const [id, pid, title, desc, grades, subjects, maxStu, dur, cost, season, lat, lng] of programsData) {
      stmts.push({ sql: `INSERT OR IGNORE INTO programs (id, partner_id, title, description, grade_levels, subjects, max_students, duration_mins, cost, season, lat, lng, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, args: [id, pid, title, desc, JSON.stringify(grades), JSON.stringify(subjects), maxStu, dur, cost, JSON.stringify(season), lat, lng, now] })
    }

    // Program Standards
    const standardsMap: Record<number, [string, string, string][]> = {
      0: [['LS2-1', 'Analyze and interpret data to provide evidence for the effects of resource availability on organisms', 'NGSS'], ['EP&C-I', 'Species, ecosystems, and ecological processes are interconnected', 'EP&Cs']],
      1: [['LS4-5', 'Evaluate evidence supporting claims that changes in environmental conditions may result in increases in some species', 'NGSS'], ['EP&C-III', 'Natural systems change over time driven by internal and external factors', 'EP&Cs']],
      2: [['LS1-6', 'Construct a scientific explanation based on evidence for the role of photosynthesis in the cycling of matter', 'NGSS'], ['EP&C-II', 'Goods and services vital to well-being are derived from the natural world', 'EP&Cs']],
      3: [['ESS2-1', "Develop a model to describe the cycling of Earth's materials and the flow of energy that drives this process", 'NGSS'], ['EP&C-V', 'Humans can affect the natural world through decisions about food, energy, and materials', 'EP&Cs']],
      6: [['LS2-6', 'Evaluate the claims that complex interactions in ecosystems maintain relatively consistent numbers and types of organisms', 'NGSS'], ['LS4-4', 'Construct an explanation for how natural selection leads to adaptation of populations', 'NGSS']],
      8: [['ESS3-3', 'Apply scientific principles to design a method for monitoring and minimizing a human impact on the environment', 'NGSS'], ['EP&C-V', 'Humans can affect the natural world; individuals and societies can take actions to protect it', 'EP&Cs']],
      12: [['ESS3-2', 'Analyze and interpret data on natural hazards to forecast future events and inform development of mitigation technologies', 'NGSS'], ['EP&C-IV', 'Decisions made by individuals and societies affect the integrity and services of natural systems', 'EP&Cs']],
    }
    for (const [idx, stds] of Object.entries(standardsMap)) {
      const progId = pids[Number(idx)]
      if (!progId) continue
      for (const [code, desc, framework] of stds) {
        stmts.push({ sql: `INSERT OR IGNORE INTO program_standards (id, program_id, standard_code, standard_desc, framework) VALUES (?, ?, ?, ?, ?)`, args: [newId(), progId, code, desc, framework] })
      }
    }

    // Bookmarks & Engagements for Maria
    for (const pid of [pids[0], pids[4], pids[6]]) {
      stmts.push({ sql: `INSERT OR IGNORE INTO bookmarks (id, teacher_id, program_id, created_at) VALUES (?, ?, ?, ?)`, args: [newId(), teacherMaria, pid, now - 86400 * 7] })
    }
    for (const pid of [pids[0], pids[1], pids[4]]) {
      stmts.push({ sql: `INSERT OR IGNORE INTO engagements (id, teacher_id, program_id, type, occurred_at) VALUES (?, ?, ?, 'view', ?)`, args: [newId(), teacherMaria, pid, now - 86400 * 3] })
    }

    // Settings
    stmts.push({ sql: `INSERT OR REPLACE INTO settings (key, value) VALUES ('active_teacher_id', ?)`, args: [teacherMaria] })
    stmts.push({ sql: `INSERT OR REPLACE INTO settings (key, value) VALUES ('demo_auto_seed_disabled', '')`, args: [] })

    // ── Single batch — one network round-trip to Turso ─────────────────────────
    await client.batch(stmts, 'write')

    return {
      inserted: {
        districts: 3, schools: 4, teachers: 12, partners: 10,
        programs: 17, program_standards: 14, bookmarks: 3, engagements: 3,
      },
    }
  }

  async clearDemo(): Promise<void> {
    await this.clearAll(true)
  }

  private async clearAll(disableAutoSeed: boolean): Promise<void> {
    const client = getRawClient()
    const tables = [
      'outreach_log', 'partner_prospects', 'reports', 'lesson_plans',
      'reviews', 'engagements', 'bookmarks', 'teacher_interests',
      'program_standards', 'programs', 'partners', 'teachers',
      'schools', 'districts', 'settings',
    ]
    const stmts: { sql: string; args: any[] }[] = tables.map(t => ({ sql: `DELETE FROM ${t}`, args: [] }))
    if (disableAutoSeed) {
      stmts.push({ sql: `INSERT OR REPLACE INTO settings (key, value) VALUES ('demo_auto_seed_disabled', 'true')`, args: [] })
    }
    await client.batch(stmts, 'write')
  }
}

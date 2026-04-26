import { getSqlite } from '../db'
import { newId } from '../utils/uuid'

export class SeedService {
  async isDemoLoaded(): Promise<boolean> {
    const sqlite = getSqlite()
    const row = sqlite.prepare(`SELECT COUNT(*) as c FROM partners`).get() as { c: number }
    return row.c > 0
  }

  async loadDemo(): Promise<{ inserted: Record<string, number> }> {
    const sqlite = getSqlite()
    const counts: Record<string, number> = {}

    // ── Districts ───────────────────────────────────────────────────────────────
    const districtSCCS = newId()
    const districtOUSD = newId()
    const districtLAUSD = newId()

    const districts = [
      { id: districtSCCS, name: 'Santa Cruz City Schools', county: 'Santa Cruz', superintendent_email: 'superintendent@sccs.net', enrollment_total: 6800 },
      { id: districtOUSD, name: 'Oakland Unified School District', county: 'Alameda', superintendent_email: 'info@ousd.org', enrollment_total: 34000 },
      { id: districtLAUSD, name: 'Los Angeles Unified School District', county: 'Los Angeles', superintendent_email: 'info@lausd.net', enrollment_total: 430000 }
    ]
    const districtStmt = sqlite.prepare(
      `INSERT OR IGNORE INTO districts (id, name, county, superintendent_email, enrollment_total) VALUES (?, ?, ?, ?, ?)`
    )
    for (const d of districts) districtStmt.run(d.id, d.name, d.county, d.superintendent_email, d.enrollment_total)
    counts.districts = districts.length

    // ── Schools ─────────────────────────────────────────────────────────────────
    const schoolGault = newId()
    const schoolBranciforte = newId()
    const schoolFruitvale = newId()
    const schoolMarinaDelRey = newId()

    const schools = [
      { id: schoolGault, name: 'Gault Elementary', district_id: districtSCCS, address: '1320 Seabright Ave, Santa Cruz, CA 95062', city: 'Santa Cruz', county: 'Santa Cruz', lat: 36.9741, lng: -122.0308, enrollment: 340, title1_flag: 0 },
      { id: schoolBranciforte, name: 'Branciforte Middle School', district_id: districtSCCS, address: '315 Poplar Ave, Santa Cruz, CA 95062', city: 'Santa Cruz', county: 'Santa Cruz', lat: 36.9817, lng: -122.0191, enrollment: 520, title1_flag: 1 },
      { id: schoolFruitvale, name: 'Fruitvale Elementary', district_id: districtOUSD, address: '3200 Boston Ave, Oakland, CA 94602', city: 'Oakland', county: 'Alameda', lat: 37.7913, lng: -122.2139, enrollment: 410, title1_flag: 1 },
      { id: schoolMarinaDelRey, name: 'Marina del Rey Middle School', district_id: districtLAUSD, address: '12500 Braddock Dr, Los Angeles, CA 90066', city: 'Los Angeles', county: 'Los Angeles', lat: 33.9803, lng: -118.4517, enrollment: 680, title1_flag: 0 }
    ]
    const schoolStmt = sqlite.prepare(
      `INSERT OR IGNORE INTO schools (id, name, district_id, address, city, county, lat, lng, enrollment, title1_flag, geocoding_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'success')`
    )
    for (const s of schools) schoolStmt.run(s.id, s.name, s.district_id, s.address, s.city, s.county, s.lat, s.lng, s.enrollment, s.title1_flag)
    counts.schools = schools.length

    // ── Teachers ────────────────────────────────────────────────────────────────
    const teacherMaria = newId()
    const teacherJames = newId()
    const teacherSarah = newId()

    const teachers = [
      {
        id: teacherMaria,
        name: 'Maria Chen',
        email: 'mchen@sccs.net',
        school_id: schoolGault,
        grade_levels: JSON.stringify(['3', '4', '5']),
        subjects: JSON.stringify(['Life Science', 'Earth Science', 'Biodiversity']),
        lat: 36.9741,
        lng: -122.0308,
        zip: '95062'
      },
      {
        id: teacherJames,
        name: 'James Rodriguez',
        email: 'jrodriguez@ousd.org',
        school_id: schoolFruitvale,
        grade_levels: JSON.stringify(['6', '7', '8']),
        subjects: JSON.stringify(['Climate Justice', 'Water', 'Earth Science']),
        lat: 37.7913,
        lng: -122.2139,
        zip: '94602'
      },
      {
        id: teacherSarah,
        name: 'Sarah Kim',
        email: 'skim@lausd.net',
        school_id: schoolMarinaDelRey,
        grade_levels: JSON.stringify(['K', '1', '2']),
        subjects: JSON.stringify(['Life Science', 'Biodiversity']),
        lat: 33.9803,
        lng: -118.4517,
        zip: '90066'
      }
    ]
    const teacherStmt = sqlite.prepare(
      `INSERT OR IGNORE INTO teachers (id, name, email, school_id, grade_levels, subjects, lat, lng, zip) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    for (const t of teachers) teacherStmt.run(t.id, t.name, t.email, t.school_id, t.grade_levels, t.subjects, t.lat, t.lng, t.zip)
    counts.teachers = teachers.length

    // ── Partners ────────────────────────────────────────────────────────────────
    const partnerElkhorn = newId()
    const partnerPieRanch = newId()
    const partnerUCSCFarm = newId()
    const partnerPointReyes = newId()
    const partnerTreePeople = newId()
    const partnerCoyoteHills = newId()
    const partnerYES = newId()
    const partnerLAWaterkeeper = newId()
    const partnerAnoNuevo = newId()
    const partnerFarmlab = newId()

    const partners = [
      {
        id: partnerElkhorn,
        name: 'Elkhorn Slough National Estuarine Research Reserve',
        type: 'wetlands',
        description: 'One of California\'s most important wetland habitats, offering research-based field programs for students to explore estuarine ecology, wildlife monitoring, and coastal climate change.',
        address: '1700 Elkhorn Rd, Watsonville, CA 95076',
        lat: 36.8278,
        lng: -121.7453,
        county: 'Monterey',
        contact_email: 'education@elkhornslough.org',
        website: 'https://elkhornslough.org',
        status: 'active',
        profile_score: 95
      },
      {
        id: partnerPieRanch,
        name: 'Pie Ranch',
        type: 'agriculture',
        description: 'A diversified organic farm and education center in San Mateo County teaching food systems, sustainable agriculture, and community resilience to students from farm to table.',
        address: '2080 CA-1, Pescadero, CA 94060',
        lat: 37.2566,
        lng: -122.4014,
        county: 'San Mateo',
        contact_email: 'education@pieranch.org',
        website: 'https://pieranch.org',
        status: 'active',
        profile_score: 88
      },
      {
        id: partnerUCSCFarm,
        name: 'UCSC Farm & Garden',
        type: 'agriculture',
        description: 'The 30-acre UC Santa Cruz Farm and Alan Chadwick Garden offer hands-on programs connecting students to organic farming, soil health, and the science of growing food.',
        address: '1156 High St, Santa Cruz, CA 95064',
        lat: 36.9914,
        lng: -122.0618,
        county: 'Santa Cruz',
        contact_email: 'casfs@ucsc.edu',
        website: 'https://casfs.ucsc.edu',
        status: 'active',
        profile_score: 82
      },
      {
        id: partnerPointReyes,
        name: 'Point Reyes National Seashore Association',
        type: 'wetlands',
        description: 'Environmental education programs at Point Reyes exploring coastal ecology, migratory birds, tule elk, and the effects of climate change on Pacific coastlines.',
        address: '1 Bear Valley Rd, Point Reyes Station, CA 94956',
        lat: 38.0698,
        lng: -122.8005,
        county: 'Marin',
        contact_email: 'education@ptreyes.org',
        website: 'https://ptreyes.org',
        status: 'active',
        profile_score: 90
      },
      {
        id: partnerTreePeople,
        name: 'TreePeople',
        type: 'urban_ecology',
        description: 'Los Angeles-based urban forestry organization offering outdoor classroom programs focused on stormwater, urban heat islands, tree planting, and community environmental stewardship.',
        address: '12601 Mulholland Dr, Beverly Hills, CA 90210',
        lat: 34.0840,
        lng: -118.4343,
        county: 'Los Angeles',
        contact_email: 'education@treepeople.org',
        website: 'https://treepeople.org',
        status: 'active',
        profile_score: 91
      },
      {
        id: partnerCoyoteHills,
        name: 'Coyote Hills Regional Park Education',
        type: 'wetlands',
        description: 'East Bay Regional Park programs set in 1,265 acres of marshland and rolling hills, offering programs on Bay Area ecology, Ohlone culture, and freshwater/saltwater interfaces.',
        address: '8000 Patterson Ranch Rd, Fremont, CA 94555',
        lat: 37.5500,
        lng: -122.0591,
        county: 'Alameda',
        contact_email: 'info@ebparks.org',
        website: 'https://ebparks.org',
        status: 'active',
        profile_score: 78
      },
      {
        id: partnerYES,
        name: 'Youth Energy Squad (YES)',
        type: 'climate_justice',
        description: 'Oakland-based youth climate justice organization running hands-on programs teaching energy efficiency, green jobs, and community organizing for frontline communities.',
        address: '1611 Telegraph Ave, Oakland, CA 94612',
        lat: 37.8044,
        lng: -122.2469,
        county: 'Alameda',
        contact_email: 'info@youthenergyquad.org',
        website: 'https://youthenergyquad.org',
        status: 'active',
        profile_score: 85
      },
      {
        id: partnerLAWaterkeeper,
        name: 'Los Angeles Waterkeeper',
        type: 'climate_justice',
        description: 'Watchdog organization protecting LA\'s watersheds through education programs teaching students to monitor water quality, understand stormwater systems, and advocate for environmental justice.',
        address: '360 22nd St, Santa Monica, CA 90402',
        lat: 34.0195,
        lng: -118.4912,
        county: 'Los Angeles',
        contact_email: 'education@lawaterkeeper.org',
        website: 'https://lawaterkeeper.org',
        status: 'active',
        profile_score: 80
      },
      {
        id: partnerAnoNuevo,
        name: 'Año Nuevo State Park Docents',
        type: 'wetlands',
        description: 'Educational programs at Año Nuevo State Park focused on elephant seal biology, coastal ecosystems, and population ecology with one of the world\'s largest mainland breeding colonies of northern elephant seals.',
        address: 'New Years Creek Rd, Pescadero, CA 94060',
        lat: 37.1088,
        lng: -122.3296,
        county: 'San Mateo',
        contact_email: 'anonuevo@parks.ca.gov',
        website: 'https://parks.ca.gov/anonuevo',
        status: 'active',
        profile_score: 72
      },
      {
        id: partnerFarmlab,
        name: 'Farmlab / Manzanita Seed',
        type: 'agriculture',
        description: 'Urban agriculture education in Los Angeles offering programs on seed saving, food sovereignty, Indigenous food systems, and urban soil science for elementary through high school students.',
        address: '1745 N Spring St, Los Angeles, CA 90012',
        lat: 34.0664,
        lng: -118.2521,
        county: 'Los Angeles',
        contact_email: 'info@farmlab.us',
        website: 'https://farmlab.us',
        status: 'active',
        profile_score: 76
      }
    ]
    const partnerStmt = sqlite.prepare(
      `INSERT OR IGNORE INTO partners (id, name, type, description, address, lat, lng, county, contact_email, website, status, profile_score, geocoding_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'success')`
    )
    for (const p of partners) partnerStmt.run(p.id, p.name, p.type, p.description, p.address, p.lat, p.lng, p.county, p.contact_email, p.website, p.status, p.profile_score)
    counts.partners = partners.length

    // ── Programs ────────────────────────────────────────────────────────────────
    const now = Math.floor(Date.now() / 1000)

    const programs = [
      // Elkhorn Slough
      {
        id: newId(), partner_id: partnerElkhorn,
        title: 'Slough Explorers: Estuarine Food Webs',
        description: 'Students wade into the slough ecosystem to collect invertebrate samples and construct food web diagrams. They discover how energy flows from phytoplankton through shrimp, fish, and birds, and investigate how sea level rise threatens this fragile system.',
        grade_levels: JSON.stringify(['4', '5', '6']),
        subjects: JSON.stringify(['Life Science', 'Earth Science', 'Biodiversity']),
        max_students: 30, duration_mins: 180, cost: 8,
        season: JSON.stringify(['Fall', 'Spring']),
        lat: 36.8278, lng: -121.7453
      },
      {
        id: newId(), partner_id: partnerElkhorn,
        title: 'Coastal Bird Monitoring & Climate Indicators',
        description: 'An advanced program for middle and high schoolers to conduct real shorebird surveys using field ID guides and eBird data submission. Students analyze 10-year trend data to understand how phenology shifts indicate climate change.',
        grade_levels: JSON.stringify(['6', '7', '8', '9', '10']),
        subjects: JSON.stringify(['Life Science', 'Earth Science']),
        max_students: 24, duration_mins: 240, cost: 12,
        season: JSON.stringify(['Fall', 'Winter', 'Spring']),
        lat: 36.8278, lng: -121.7453
      },
      // Pie Ranch
      {
        id: newId(), partner_id: partnerPieRanch,
        title: 'From Seed to Table: Farm Science Immersion',
        description: 'A full-day farm visit where students plant, harvest, and cook a seasonal dish. Activities include soil texture testing, composting biology, and a guided harvest walk connecting photosynthesis to the food on their plate.',
        grade_levels: JSON.stringify(['2', '3', '4', '5']),
        subjects: JSON.stringify(['Agriculture', 'Life Science']),
        max_students: 28, duration_mins: 360, cost: 15,
        season: JSON.stringify(['Spring', 'Fall']),
        lat: 37.2566, lng: -122.4014
      },
      {
        id: newId(), partner_id: partnerPieRanch,
        title: 'Soil Health & Carbon: What\'s Under Our Feet',
        description: 'Students dig soil profiles, measure organic matter, and conduct Brix testing on vegetables to explore the connection between soil health, plant nutrition, and carbon sequestration as a climate solution.',
        grade_levels: JSON.stringify(['6', '7', '8']),
        subjects: JSON.stringify(['Agriculture', 'Earth Science', 'Life Science']),
        max_students: 25, duration_mins: 270, cost: 10,
        season: JSON.stringify(['Spring', 'Fall']),
        lat: 37.2566, lng: -122.4014
      },
      // UCSC Farm
      {
        id: newId(), partner_id: partnerUCSCFarm,
        title: 'Biointensive Gardening Workshop for Schools',
        description: 'Led by UCSC farm apprentices, students learn double-digging raised bed techniques, companion planting, and integrated pest management in the historic Chadwick Garden. Each class plants a bed they return to tend throughout the season.',
        grade_levels: JSON.stringify(['3', '4', '5', '6']),
        subjects: JSON.stringify(['Agriculture', 'Life Science']),
        max_students: 32, duration_mins: 150, cost: 0,
        season: JSON.stringify(['Spring']),
        lat: 36.9914, lng: -122.0618
      },
      {
        id: newId(), partner_id: partnerUCSCFarm,
        title: 'Pollinator Pathways: Bee Biology & Native Plants',
        description: 'Students explore the UCSC Farm\'s certified organic vegetable fields and native habitat areas to study pollinator decline, native bee identification, and habitat restoration design. Includes a hands-on habitat planting activity.',
        grade_levels: JSON.stringify(['4', '5', '6', '7']),
        subjects: JSON.stringify(['Life Science', 'Biodiversity']),
        max_students: 30, duration_mins: 180, cost: 5,
        season: JSON.stringify(['Spring', 'Summer']),
        lat: 36.9914, lng: -122.0618
      },
      // Point Reyes
      {
        id: newId(), partner_id: partnerPointReyes,
        title: 'Tule Elk & Grassland Ecology',
        description: 'Students hike through the Tomales Point wildlife corridor to observe the reintroduced tule elk herd and study grassland food webs, carrying capacity, and the role of apex species in maintaining biodiversity.',
        grade_levels: JSON.stringify(['5', '6', '7', '8']),
        subjects: JSON.stringify(['Life Science', 'Biodiversity', 'Earth Science']),
        max_students: 28, duration_mins: 300, cost: 5,
        season: JSON.stringify(['Fall', 'Winter', 'Spring']),
        lat: 38.0698, lng: -122.8005
      },
      {
        id: newId(), partner_id: partnerPointReyes,
        title: 'Intertidal Zone Science: Rocky Shore Surveys',
        description: 'Guided by reserve staff, students conduct quadrat surveys of rocky intertidal zones, documenting species distribution by tidal zone. Students compare data to 20-year baseline records to observe climate-driven range shifts.',
        grade_levels: JSON.stringify(['6', '7', '8', '9', '10', '11', '12']),
        subjects: JSON.stringify(['Life Science', 'Earth Science', 'Biodiversity']),
        max_students: 20, duration_mins: 360, cost: 8,
        season: JSON.stringify(['Spring', 'Summer']),
        lat: 38.0698, lng: -122.8005
      },
      // TreePeople
      {
        id: newId(), partner_id: partnerTreePeople,
        title: 'Urban Forest Rangers: Tree Planting & Stewardship',
        description: 'Students become certified "Urban Forest Rangers" by learning tree ID, planting technique, and stormwater benefits of urban trees. Each class plants trees in their neighborhood and tracks their growth over the school year using TreePeople\'s app.',
        grade_levels: JSON.stringify(['3', '4', '5', '6', '7']),
        subjects: JSON.stringify(['Life Science', 'Earth Science', 'Climate Justice']),
        max_students: 35, duration_mins: 120, cost: 0,
        season: JSON.stringify(['Fall', 'Winter', 'Spring']),
        lat: 34.0840, lng: -118.4343
      },
      {
        id: newId(), partner_id: partnerTreePeople,
        title: 'Cool Neighborhoods: Urban Heat & Climate Equity',
        description: 'High school students use infrared thermometers to map temperature differences between tree-lined and heat-exposed streets in their community, then analyze equity implications and design evidence-based urban cooling proposals.',
        grade_levels: JSON.stringify(['9', '10', '11', '12']),
        subjects: JSON.stringify(['Climate Justice', 'Earth Science']),
        max_students: 30, duration_mins: 240, cost: 0,
        season: JSON.stringify(['Spring', 'Summer', 'Fall']),
        lat: 34.0840, lng: -118.4343
      },
      // Coyote Hills
      {
        id: newId(), partner_id: partnerCoyoteHills,
        title: 'Marsh Discovery: Bay Area Wetland Ecology',
        description: 'Students explore pickleweed marshes and mudflats at Coyote Hills to investigate seasonal flooding, salt tolerance adaptations, and the role of wetlands as carbon sinks and storm buffers. Includes a canoe option for middle schoolers.',
        grade_levels: JSON.stringify(['4', '5', '6', '7']),
        subjects: JSON.stringify(['Life Science', 'Earth Science', 'Biodiversity']),
        max_students: 32, duration_mins: 210, cost: 6,
        season: JSON.stringify(['Fall', 'Winter', 'Spring']),
        lat: 37.5500, lng: -122.0591
      },
      {
        id: newId(), partner_id: partnerCoyoteHills,
        title: 'Ohlone Lifeways & Traditional Ecological Knowledge',
        description: 'Facilitated by Ohlone community partners, students explore the reconstructed Ohlone village site and tule marsh to learn about traditional ecological knowledge, sustainable harvesting practices, and the long history of Bay Area land stewardship.',
        grade_levels: JSON.stringify(['3', '4', '5']),
        subjects: JSON.stringify(['Biodiversity', 'Life Science']),
        max_students: 30, duration_mins: 180, cost: 4,
        season: JSON.stringify(['Fall', 'Spring']),
        lat: 37.5500, lng: -122.0591
      },
      // YES
      {
        id: newId(), partner_id: partnerYES,
        title: 'Home Energy Audit: Youth as Climate Advocates',
        description: 'Students learn to use energy audit tools (kill-a-watt meters, thermal imaging cameras) to assess energy waste in homes and public buildings. They create community reports and present recommendations to school board or city council.',
        grade_levels: JSON.stringify(['7', '8', '9', '10', '11', '12']),
        subjects: JSON.stringify(['Climate Justice', 'Earth Science']),
        max_students: 25, duration_mins: 180, cost: 0,
        season: JSON.stringify(['Fall', 'Winter', 'Spring', 'Summer']),
        lat: 37.8044, lng: -122.2469
      },
      // LA Waterkeeper
      {
        id: newId(), partner_id: partnerLAWaterkeeper,
        title: 'LA River Macroinvertebrate Monitoring',
        description: 'Students wade into the LA River with Waterkeeper scientists to collect benthic macroinvertebrates, identify them using dichotomous keys, and calculate biotic integrity indices to assess water quality—real data used in regulatory reporting.',
        grade_levels: JSON.stringify(['6', '7', '8', '9', '10']),
        subjects: JSON.stringify(['Water', 'Life Science', 'Earth Science', 'Climate Justice']),
        max_students: 24, duration_mins: 240, cost: 0,
        season: JSON.stringify(['Spring', 'Fall']),
        lat: 34.0195, lng: -118.4912
      },
      {
        id: newId(), partner_id: partnerLAWaterkeeper,
        title: 'Stormwater & Environmental Justice: Who Bears the Flood Risk?',
        description: 'An urban science program where students map impervious surfaces and flood-vulnerable neighborhoods, analyze FEMA flood maps against income data, and design green infrastructure solutions for their school or community.',
        grade_levels: JSON.stringify(['8', '9', '10', '11', '12']),
        subjects: JSON.stringify(['Water', 'Climate Justice', 'Earth Science']),
        max_students: 30, duration_mins: 180, cost: 0,
        season: JSON.stringify(['Fall', 'Winter', 'Spring']),
        lat: 34.0195, lng: -118.4912
      },
      // Año Nuevo
      {
        id: newId(), partner_id: partnerAnoNuevo,
        title: 'Elephant Seal Biology & Population Dynamics',
        description: 'Docent-led guided walks to observe the Northern elephant seal breeding colony. Students learn reproductive ecology, polygynous mating systems, deep-diving physiology, and population recovery as a conservation success story.',
        grade_levels: JSON.stringify(['4', '5', '6', '7', '8']),
        subjects: JSON.stringify(['Life Science', 'Biodiversity']),
        max_students: 25, duration_mins: 240, cost: 12,
        season: JSON.stringify(['Winter', 'Spring']),
        lat: 37.1088, lng: -122.3296
      },
      // Farmlab
      {
        id: newId(), partner_id: partnerFarmlab,
        title: 'Seed Sovereignty: Indigenous Food Systems & Urban Agriculture',
        description: 'Students learn seed saving techniques from Indigenous food sovereignty advocates, explore the history of seed patents and food colonization, and plant their own seed gardens to take home. Curriculum centers community voices.',
        grade_levels: JSON.stringify(['5', '6', '7', '8', '9', '10']),
        subjects: JSON.stringify(['Agriculture', 'Biodiversity', 'Climate Justice']),
        max_students: 28, duration_mins: 150, cost: 0,
        season: JSON.stringify(['Spring', 'Fall']),
        lat: 34.0664, lng: -118.2521
      }
    ]

    const programStmt = sqlite.prepare(
      `INSERT OR IGNORE INTO programs (id, partner_id, title, description, grade_levels, subjects, max_students, duration_mins, cost, season, lat, lng, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    for (const p of programs) programStmt.run(p.id, p.partner_id, p.title, p.description, p.grade_levels, p.subjects, p.max_students, p.duration_mins, p.cost, p.season, p.lat, p.lng, now)
    counts.programs = programs.length

    // ── Program Standards ───────────────────────────────────────────────────────
    const stdStmt = sqlite.prepare(
      `INSERT OR IGNORE INTO program_standards (id, program_id, standard_code, standard_desc, framework) VALUES (?, ?, ?, ?, ?)`
    )

    const standardsMap: Record<number, Array<{ code: string; desc: string; framework: string }>> = {
      0: [ // Elkhorn Food Webs
        { code: 'LS2-1', desc: 'Analyze and interpret data to provide evidence for the effects of resource availability on organisms and populations', framework: 'NGSS' },
        { code: 'ESS3-1', desc: 'Construct a scientific explanation based on evidence for how the uneven distributions of Earth\'s mineral, energy, and groundwater resources are the result of past and current geoscience processes', framework: 'NGSS' },
        { code: 'EP&C-I', desc: 'Species, ecosystems, and ecological processes are interconnected', framework: 'EP&Cs' }
      ],
      1: [ // Coastal Bird Monitoring
        { code: 'LS4-5', desc: 'Evaluate the evidence supporting claims that changes in environmental conditions may result in increases in the number of individuals of some species, the emergence of new species over time, and the extinction of other species', framework: 'NGSS' },
        { code: 'ESS2-4', desc: 'Develop a model to describe the cycling of water through Earth\'s systems driven by energy from the sun and the force of gravity', framework: 'NGSS' },
        { code: 'EP&C-III', desc: 'Natural systems change over time in ways that are driven by both internal and external factors', framework: 'EP&Cs' }
      ],
      2: [ // Pie Ranch Seed to Table
        { code: 'LS1-6', desc: 'Construct a scientific explanation based on evidence for the role of photosynthesis in the cycling of matter and the flow of energy into and out of organisms', framework: 'NGSS' },
        { code: 'EP&C-II', desc: 'Goods and services vital to individual and community well-being are derived from natural world', framework: 'EP&Cs' }
      ],
      3: [ // Soil Health & Carbon
        { code: 'ESS2-1', desc: 'Develop a model to describe the cycling of Earth\'s materials and the flow of energy that drives this process', framework: 'NGSS' },
        { code: 'ESS3-3', desc: 'Apply scientific principles to design a method for monitoring and minimizing a human impact on the environment', framework: 'NGSS' },
        { code: 'EP&C-V', desc: 'Humans can affect the natural world through decisions about food, energy, and materials; individuals and societies can take actions to protect the natural world', framework: 'EP&Cs' }
      ],
      6: [ // Tule Elk
        { code: 'LS2-6', desc: 'Evaluate the claims, evidence, and reasoning that the complex interactions in ecosystems maintain relatively consistent numbers and types of organisms in stable conditions, but changing conditions may result in a new ecosystem state', framework: 'NGSS' },
        { code: 'LS4-4', desc: 'Construct an explanation based on evidence for how natural selection leads to adaptation of populations', framework: 'NGSS' }
      ],
      8: [ // Urban Forest Rangers
        { code: 'ESS3-3', desc: 'Apply scientific principles to design a method for monitoring and minimizing a human impact on the environment', framework: 'NGSS' },
        { code: 'EP&C-V', desc: 'Humans can affect the natural world; individuals and societies can take actions to protect the natural world', framework: 'EP&Cs' }
      ],
      12: [ // Energy Audit
        { code: 'ESS3-2', desc: 'Analyze and interpret data on natural hazards to forecast future catastrophic events and inform the development of technologies to mitigate their effects', framework: 'NGSS' },
        { code: 'EP&C-IV', desc: 'Decisions made by individuals and societies affect both the integrity and the services provided by natural systems', framework: 'EP&Cs' }
      ]
    }

    let stdCount = 0
    for (const [idx, stds] of Object.entries(standardsMap)) {
      const prog = programs[Number(idx)]
      if (!prog) continue
      for (const s of stds) {
        stdStmt.run(newId(), prog.id, s.code, s.desc, s.framework)
        stdCount++
      }
    }
    counts.program_standards = stdCount

    // ── Bookmarks & Engagements (for teacher Maria) ─────────────────────────────
    const bookmarkStmt = sqlite.prepare(
      `INSERT OR IGNORE INTO bookmarks (id, teacher_id, program_id, created_at) VALUES (?, ?, ?, ?)`
    )
    const engagementStmt = sqlite.prepare(
      `INSERT OR IGNORE INTO engagements (id, teacher_id, program_id, type, occurred_at, notes) VALUES (?, ?, ?, ?, ?, ?)`
    )

    // Maria bookmarks Elkhorn and UCSC Farm programs
    bookmarkStmt.run(newId(), teacherMaria, programs[0].id, now - 86400 * 10)
    bookmarkStmt.run(newId(), teacherMaria, programs[4].id, now - 86400 * 5)
    // James bookmarks Coyote Hills
    bookmarkStmt.run(newId(), teacherJames, programs[10].id, now - 86400 * 3)
    counts.bookmarks = 3

    // Maria attended the Elkhorn Food Webs program last fall
    engagementStmt.run(newId(), teacherMaria, programs[0].id, 'attend', now - 86400 * 120, 'Great field trip! Students loved the mud invertebrates.')
    engagementStmt.run(newId(), teacherMaria, programs[0].id, 'view', now - 86400 * 125, null)
    engagementStmt.run(newId(), teacherJames, programs[12].id, 'click', now - 86400 * 7, null)
    counts.engagements = 3

    // ── Reviews ─────────────────────────────────────────────────────────────────
    const reviewStmt = sqlite.prepare(
      `INSERT OR IGNORE INTO reviews (id, teacher_id, program_id, rating, text, visited_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    reviewStmt.run(
      newId(), teacherMaria, programs[0].id, 5,
      'Absolutely phenomenal field trip. The reserve educator was incredibly knowledgeable and the kids were completely engaged collecting invertebrates. Aligned perfectly with our NGSS food web unit. Highly recommend for any 4th or 5th grade teacher!',
      now - 86400 * 119, now - 86400 * 118
    )
    reviewStmt.run(
      newId(), teacherJames, programs[10].id, 4,
      'Really solid program for 6th graders. The marsh ecology content was excellent and the docent was great with urban kids who hadn\'t spent much time in nature. One star off only because parking is difficult — plan ahead.',
      now - 86400 * 45, now - 86400 * 44
    )
    counts.reviews = 2

    // ── Set active teacher to Maria ──────────────────────────────────────────────
    sqlite.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES ('active_teacher_id', ?)`).run(teacherMaria)

    return { inserted: counts }
  }

  async clearDemo(): Promise<void> {
    const sqlite = getSqlite()
    // Delete in dependency order
    sqlite.prepare(`DELETE FROM reviews`).run()
    sqlite.prepare(`DELETE FROM bookmarks`).run()
    sqlite.prepare(`DELETE FROM engagements`).run()
    sqlite.prepare(`DELETE FROM lesson_plans`).run()
    sqlite.prepare(`DELETE FROM program_standards`).run()
    sqlite.prepare(`DELETE FROM programs`).run()
    sqlite.prepare(`DELETE FROM partners`).run()
    sqlite.prepare(`DELETE FROM teacher_interests`).run()
    sqlite.prepare(`DELETE FROM teachers`).run()
    sqlite.prepare(`DELETE FROM schools`).run()
    sqlite.prepare(`DELETE FROM districts`).run()
    sqlite.prepare(`DELETE FROM settings WHERE key = 'active_teacher_id'`).run()
  }
}

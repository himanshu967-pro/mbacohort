const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://toyylgwekkcvorwiceas.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRveXlsZ3dla2tjdm9yd2ljZWFzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTI5MTcyNSwiZXhwIjoyMDgwODY3NzI1fQ.Ma2xDvpdFcaA7Lz-s2VuWlOwg-JmjQRPN-m1pqYu24A'
);

// Course code mappings for full names
const COURSE_NAMES = {
    'B2BM': 'B2B Marketing',
    'CD': 'Corporate Development',
    'IPPP': 'IPPP',
    'TPBH': 'TPBH',
    'ATPMA': 'ATPMA',
    'WBIFM': 'WBIFM',
    'PMNPD': 'Product Management & NPD',
    'WDV': 'Web Development',
    'WAM': 'WAM',
    'TOC': 'Theory of Constraints',
    'BM': 'Brand Management',
    'MAA': 'Marketing Analytics & AI',
    'SAE': 'SAE',
    'WSBN': 'Workshop (Full Day)'
};

// Time slots
const TIME_SLOTS = [
    { start: '09:00', end: '10:15' },
    { start: '10:30', end: '11:45' },
    { start: '12:00', end: '13:15' },
    { start: '14:30', end: '15:45' },
    { start: '16:00', end: '17:15' },
    { start: '17:30', end: '18:45' },
    { start: '19:00', end: '20:15' }
];

// CSV Data
const csvData = `Date,Classroom,9:00 - 10:15,10:30 - 11:45,12:00 - 13:15,14:30-15:45,16:00 - 17:15,17:30-18:45,19:00-20:15
"Thursday, December 11, 2025",F-101,B2BM-3,CD-13,IPPP-1,TPBH-2,TPBH-3,ATPMA-3,ATPMA-4
"Friday, December 12, 2025",F-101,IPPP-2,WBIFM-4,WBIFM-5,PMNPD-3,PMNPD-4,ATPMA-5,
"Saturday, December 13, 2025",F-101,,IPPP-3,,WDV-6,WDV-7,,
"Sunday, December 14, 2025",F-101,,,,,,,
"Monday, December 15, 2025",F-101,CD-14,WDV-8,WAM-4,TPBH-4,TPBH-5,TOC-6,TOC-7
"Tuesday, December 16, 2025",F-101,,WBIFM-6,WBIFM-7,CD-15,TPBH-6,TOC-8,TOC-9
"Wednesday, December 17, 2025",F-101,TOC-10,,WAM-5,TPBH-7,TPBH-8,,
"Thursday, December 18, 2025",F-101,BM-11,TPBH-9,WBIFM-8,MAA-1,MAA-2,,
"Friday, December 19, 2025",F-101,TPBH-10,IPPP-4,BM-12,PMNPD-5,PMNPD-6,,
"Saturday, December 20, 2025",F-101,WSBN,WSBN,WSBN,WSBN,WSBN,,
"Sunday, December 21, 2025",F-101,WSBN,WSBN,WSBN,WSBN,WSBN,,
"Monday, December 22, 2025",I-101,IPPP-5,WBIFM-9,WBIFM-10,PMNPD-7,PMNPD-8,,
"Tuesday, December 23, 2025",I-101,SAE-7,BM-13,IPPP-6,MAA-3,MAA-4,,`;

function parseDate(dateStr) {
    // Parse "Thursday, December 11, 2025" format
    const cleaned = dateStr.replace(/"/g, '');
    const parts = cleaned.split(', ');
    const monthDay = parts[1]; // "December 11"
    const year = parts[2]; // "2025"

    const months = {
        'January': '01', 'February': '02', 'March': '03', 'April': '04',
        'May': '05', 'June': '06', 'July': '07', 'August': '08',
        'September': '09', 'October': '10', 'November': '11', 'December': '12'
    };

    const [month, day] = monthDay.split(' ');
    return `${year}-${months[month]}-${day.padStart(2, '0')}`;
}

function getCourseName(code) {
    if (!code || code.trim() === '') return null;
    const baseCode = code.replace(/-\d+$/, ''); // Remove session number
    return COURSE_NAMES[baseCode] || baseCode;
}

async function createEvents() {
    const lines = csvData.trim().split('\n');
    const events = [];

    // Skip header
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        // Parse CSV properly handling quoted values
        const matches = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g) || [];
        const values = matches.map(v => v.replace(/^"|"$/g, '').trim());

        const date = parseDate(values[0]);
        const classroom = values[1];

        // Process each time slot (columns 2-8)
        for (let slot = 0; slot < TIME_SLOTS.length; slot++) {
            const classCode = values[slot + 2];
            if (!classCode || classCode.trim() === '') continue;

            const courseName = getCourseName(classCode);
            const timeSlot = TIME_SLOTS[slot];

            const event = {
                title: `${classCode} - ${courseName}`,
                description: `Session: ${classCode}\nClassroom: ${classroom}`,
                event_date: `${date}T${timeSlot.start}:00+05:30`,
                end_date: `${date}T${timeSlot.end}:00+05:30`,
                location: classroom,
                event_type: 'academic',
                created_by: null // System generated
            };

            events.push(event);
        }
    }

    console.log(`Found ${events.length} classes to create as events\n`);

    // Show preview
    console.log('Preview of events:');
    events.slice(0, 5).forEach(e => {
        console.log(`  - ${e.title} @ ${e.event_date.split('T')[0]} ${e.event_date.split('T')[1].slice(0, 5)} in ${e.location}`);
    });
    console.log(`  ... and ${events.length - 5} more\n`);

    // Insert events
    console.log('Inserting events into database...');
    const { data, error } = await supabase
        .from('events')
        .insert(events)
        .select('id');

    if (error) {
        console.error('Error inserting events:', error.message);
        return;
    }

    console.log(`✅ Successfully created ${data.length} events!`);
}

createEvents();

/**
 * Fix Names Script - Updates user names from CSV
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://toyylgwekkcvorwiceas.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRveXlsZ3dla2tjdm9yd2ljZWFzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTI5MTcyNSwiZXhwIjoyMDgwODY3NzI1fQ.Ma2xDvpdFcaA7Lz-s2VuWlOwg-JmjQRPN-m1pqYu24A';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Correct name mapping from CSV
const nameMapping = {
    'e25aadiths@iimidr.ac.in': 'Aadith Suresh',
    'e25abhishekr@iimidr.ac.in': 'Abhishek Roy',
    'e25adityad@iimidr.ac.in': 'Aditya Dubey',
    'e25adityap@iimidr.ac.in': 'Aditya Pathania',
    'e25akashk@iimidr.ac.in': 'Akash Kumar',
    'e25akshats@iimidr.ac.in': 'Akshat Sharma',
    'e25amaleshd@iimidr.ac.in': 'Amalesh Deka',
    'e25anjalis@iimidr.ac.in': 'Anjali Sachan',
    'e25anjalisinha@iimidr.ac.in': 'Anjali Sinha',
    'e25anshikas@iimidr.ac.in': 'Anshika Singh',
    'e25anshulk@iimidr.ac.in': 'Anshul Khare',
    'e25anshumanp@iimidr.ac.in': 'Anshuman Panda',
    'e25anujj@iimidr.ac.in': 'Anuj Jain',
    'e25arkanilc@iimidr.ac.in': 'Arkanil Chaki',
    'e25ashwanit@iimidr.ac.in': 'Ashwani Kr. Tiwary',
    'e25atulp@iimidr.ac.in': 'Atul Patel',
    'e25chinmayv@iimidr.ac.in': 'Chinmay Manoj Varma',
    'e25debleenar@iimidr.ac.in': 'Debleena Roy',
    'e25schandand@iimidr.ac.in': 'Deva Sai Chandan',
    'e25ganeshramc@iimidr.ac.in': 'Ganeshram C',
    'e25garveshs@iimidr.ac.in': 'Garvesh Sonone',
    'e25gauravkumarr@iimidr.ac.in': 'Gauravkumar Raut',
    'e25seshaa@iimidr.ac.in': 'H A Sesha Pramod',
    'e25harjagjitd@iimidr.ac.in': 'Harjagjit Singh Dhanjal',
    'e25harnilg@iimidr.ac.in': 'Harnil Gupta',
    'e25harshita@iimidr.ac.in': 'Harshit Arora',
    'e25hemantp@iimidr.ac.in': 'Hemant Parashar',
    'e25himanshum@iimidr.ac.in': 'Himanshu Mittal',
    'e25hrithikv@iimidr.ac.in': 'Hrithik Verma',
    'e25irfanm@iimidr.ac.in': 'Irfan Manzoor',
    'e25ishaanb@iimidr.ac.in': 'Ishaan Bhatia',
    'e25jiteshk@iimidr.ac.in': 'Jitesh Kumar',
    'e25abhisekk@iimidr.ac.in': 'Abhisek Kalakurthi',
    'e25ameyk@iimidr.ac.in': 'Amey Khanzode',
    'e25kowshikk@iimidr.ac.in': 'Kowshik Sarma Katta',
    'e25mayankg@iimidr.ac.in': 'Mayank Gupta',
    'e25naveenr@iimidr.ac.in': 'Naveen R',
    'e25navneetk@iimidr.ac.in': 'Navneet Kumar',
    'e25parismitar@iimidr.ac.in': 'Parismita Rajkhowa',
    'e25prasadj@iimidr.ac.in': 'Prasad Vijay Joshi',
    'e25prashants@iimidr.ac.in': 'Prashant Singh',
    'e25rahulg@iimidr.ac.in': 'Rahul Harish Goplani',
    'e25rajug@iimidr.ac.in': 'Raju Venkati Gaikwad',
    'e25ranas@iimidr.ac.in': 'Rana Vishwajeet Singh',
    'e25riyas@iimidr.ac.in': 'Riya Sinha',
    'e25roshanc@iimidr.ac.in': 'Roshan Castelino',
    'e25sraghubirp@iimidr.ac.in': 'S Raghubir Pattnaik',
    'e25sandeepb@iimidr.ac.in': 'Sandeep Baruah',
    'e25saransha@iimidr.ac.in': 'Saransh Agarwal',
    'e25sayanm@iimidr.ac.in': 'Sayan Maji',
    'e25seshav@iimidr.ac.in': 'Sesha Monica Vadrevu',
    'e25shiprav@iimidr.ac.in': 'Shipra Varshney',
    'e25shubhamc@iimidr.ac.in': 'Shubham Chouhan',
    'e25shubhamm@iimidr.ac.in': 'Shubham Kumar Mishra',
    'e25shubhamy@iimidr.ac.in': 'Shubham Yadav',
    'e25shubhankarc@iimidr.ac.in': 'Shubhankar Choudhary',
    'e25somnathd@iimidr.ac.in': 'Somnath Dutta',
    'e25venkatay@iimidr.ac.in': 'Sudheer Yerra',
    'e25tanmayk@iimidr.ac.in': 'Tanmay Anil Kale',
    'e25tushaars@iimidr.ac.in': 'Tushaar Shukla',
    'e25umeshk@iimidr.ac.in': 'Umesh Kaushik',
    'e25vaibhavk@iimidr.ac.in': 'Vaibhav Kandiyal',
    'e25vaibhavkeshri@iimidr.ac.in': 'Vaibhav Keshri',
    'e25vasug@iimidr.ac.in': 'Vasu Gupta',
    'e25vijayaraghavendrar@iimidr.ac.in': 'Vijayaraghavendra R',
    'e25vikrams@iimidr.ac.in': 'Vikram Aditya Singh',
    'e25yashshvis@iimidr.ac.in': 'Yashshvi Sharma',
};

async function fixNames() {
    console.log('🔧 Fixing user names...\n');

    let success = 0;
    let failed = 0;

    for (const [email, name] of Object.entries(nameMapping)) {
        process.stdout.write(`Updating ${email}... `);

        const { error } = await supabase
            .from('users')
            .update({ name: name })
            .eq('email', email);

        if (error) {
            console.log('❌', error.message);
            failed++;
        } else {
            console.log('✅', name);
            success++;
        }
    }

    console.log('\n========================================');
    console.log(`✅ Updated: ${success} users`);
    console.log(`❌ Failed: ${failed} users`);
}

fixNames();

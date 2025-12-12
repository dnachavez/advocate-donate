
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file manually
const envPath = path.resolve(__dirname, '../../.env');
let envContent = '';
try {
    envContent = fs.readFileSync(envPath, 'utf-8');
} catch (e) {
    console.error('Error reading .env file:', e);
    process.exit(1);
}

const env: Record<string, string> = {};

envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
        }
        env[key] = value;
        // console.log(`Loaded key: ${key}`);
    }
});

console.log('Keys loaded:', Object.keys(env));


const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDonations() {
    console.log('Checking recent donations...');

    const { data: donations, error } = await supabase
        .from('donations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Error fetching donations:', error);
        return;
    }

    console.log(`Found ${donations.length} donations.`);
    donations.forEach(d => {
        console.log('---');
        console.log(`ID: ${d.id}`);
        console.log(`Target Type: ${d.target_type}`);
        console.log(`Target ID: ${d.target_id}`);
        console.log(`Target Name: ${d.target_name}`);
        console.log(`Organization ID: ${d.organization_id}`);
        console.log(`Campaign ID: ${d.campaign_id}`);
        console.log(`Payment Status: ${d.payment_status}`);
        console.log(`Amount: ${d.amount}`);
    });
}

checkDonations();

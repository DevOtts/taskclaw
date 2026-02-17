const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Simple .env parser
function loadEnv() {
    try {
        const envPath = path.resolve(process.cwd(), '.env.local');
        const envFile = fs.readFileSync(envPath, 'utf8');
        const env = {};
        envFile.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                let value = match[2].trim();
                if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.slice(1, -1);
                }
                env[key] = value;
            }
        });
        return env;
    } catch (e) {
        console.error('Could not read .env.local:', e.message);
        return {};
    }
}

async function testConnection() {
    const env = loadEnv();
    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    console.log('Testing Supabase Connection...');
    console.log('URL:', supabaseUrl);
    console.log('Key length:', supabaseKey ? supabaseKey.length : 0);

    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase credentials in .env.local');
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
        if (error) {
            console.error('Supabase Error:', error);
        } else {
            console.log('Successfully connected to Supabase!');
        }
    } catch (e) {
        console.error('Connection failed:', e);
    }
}

testConnection();

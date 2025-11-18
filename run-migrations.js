const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Create Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function runMigrations() {
  console.log('🚀 Starting database migrations...\n');

  const migrations = [
    '001_create_users_table.sql',
    '002_create_storage_bucket.sql',
    '003_revenue_tracking.sql'
  ];

  for (const migrationFile of migrations) {
    const filePath = path.join(__dirname, 'supabase', 'migrations', migrationFile);
    const sql = fs.readFileSync(filePath, 'utf8');

    console.log(`📝 Running migration: ${migrationFile}`);

    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql_string: sql }).catch(() => {
        // If RPC doesn't exist, we'll need to run migrations manually through Supabase SQL Editor
        return { error: 'RPC function not available' };
      });

      if (error) {
        // Try executing via direct query (may not work for DDL in some cases)
        console.log(`⚠️  Note: Cannot execute via API. Please run manually in Supabase SQL Editor.`);
        console.log(`   Migration: ${migrationFile}\n`);
      } else {
        console.log(`✅ Migration ${migrationFile} completed successfully!\n`);
      }
    } catch (err) {
      console.error(`❌ Error in ${migrationFile}:`, err.message);
      console.log(`   You may need to run this migration manually in Supabase SQL Editor.\n`);
    }
  }

  console.log('\n✅ Migration process completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Verify tables exist in Supabase Table Editor');
  console.log('2. If any migration failed, run it manually in SQL Editor');
  console.log('3. Continue with contract deployment\n');
}

runMigrations().catch(console.error);

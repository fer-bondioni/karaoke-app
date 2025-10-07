import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyFix() {
  try {
    console.log('Reading SQL fix file...');
    const sql = readFileSync('./fix-session-code.sql', 'utf8');
    
    console.log('Applying fix to Supabase...');
    const { data, error } = await supabase.rpc('query', { query_string: sql });
    
    if (error) {
      console.error('Error applying fix:', error);
      
      // Try alternative approach - split and execute statements
      console.log('Trying alternative approach...');
      const statements = sql.split(';').filter(s => s.trim());
      
      for (const statement of statements) {
        if (statement.trim()) {
          const { error: err } = await supabase.rpc('query', { query_string: statement + ';' });
          if (err) {
            console.error('Statement error:', err);
          } else {
            console.log('Statement executed successfully');
          }
        }
      }
    } else {
      console.log('✅ Fix applied successfully!');
    }
    
    // Test the function
    console.log('\nTesting generate_session_code function...');
    const { data: testData, error: testError } = await supabase.rpc('generate_session_code');
    
    if (testError) {
      console.error('❌ Function test failed:', testError);
    } else {
      console.log('✅ Function test passed! Generated code:', testData);
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

applyFix();

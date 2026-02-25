import { createServerClient } from '@/lib/server-supabase'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = createServerClient()
    
    if (!supabase) {
      return NextResponse.json({ 
        success: false, 
        error: 'Database connection not available. Please check SUPABASE_SERVICE_ROLE_KEY env variable.' 
      }, { status: 500 })
    }
    
    // Try to execute the SQL using exec_sql RPC
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        -- Drop existing constraint if it exists
        ALTER TABLE activity_logs DROP CONSTRAINT IF EXISTS activity_logs_entity_type_check;
        
        -- Create new constraint with 'role' and 'invoice_settings' included
        ALTER TABLE activity_logs ADD CONSTRAINT activity_logs_entity_type_check 
        CHECK (entity_type IN (
          'product', 
          'sale', 
          'customer', 
          'supplier', 
          'user', 
          'role',
          'expense', 
          'customer_payment', 
          'supplier_payment',
          'category',
          'unit',
          'invoice_settings'
        ));
      `
    })
    
    if (error) {
      // Check if it's the exec_sql not found error
      if (error.message.includes('exec_sql') || error.code === 'PGRST116') {
        return NextResponse.json({ 
          success: false, 
          requiresManualFix: true,
          error: 'exec_sql function not available. Please run the SQL manually.',
          instructions: [
            '1. Go to your Supabase project dashboard',
            '2. Navigate to SQL Editor',
            '3. Copy and paste the following SQL:',
            '',
            '--- Drop existing constraint (if any)',
            'ALTER TABLE activity_logs DROP CONSTRAINT IF EXISTS activity_logs_entity_type_check;',
            '',
            '--- Create new constraint with role and invoice_settings included',
            "ALTER TABLE activity_logs ADD CONSTRAINT activity_logs_entity_type_check CHECK (entity_type IN ('product', 'sale', 'customer', 'supplier', 'user', 'role', 'expense', 'customer_payment', 'supplier_payment', 'category', 'unit', 'invoice_settings'));",
            '',
            '4. Execute the SQL',
            '5. Try editing invoice settings again - it should now appear in Activity Tab'
          ],
          sql: `
-- Drop existing constraint (if any)
ALTER TABLE activity_logs DROP CONSTRAINT IF EXISTS activity_logs_entity_type_check;

-- Create new constraint with role and invoice_settings included
ALTER TABLE activity_logs ADD CONSTRAINT activity_logs_entity_type_check 
CHECK (entity_type IN (
  'product', 
  'sale', 
  'customer', 
  'supplier', 
  'user', 
  'role',
  'expense', 
  'customer_payment', 
  'supplier_payment',
  'category',
  'unit',
  'invoice_settings'
));
`
        }, { status: 400 })
      }
      
      console.error('Error adding constraint:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Activity logs constraint updated to include role entity type' 
    })
  } catch (error) {
    console.error('Error in fix-activity-logs-constraint:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

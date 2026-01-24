import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting units table creation...')

    if (!supabase) {
      return NextResponse.json(
        {
          success: false,
          error: 'Database connection not available'
        },
        { status: 500 }
      )
    }

    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), 'create_units_table.sql')
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8')

    // Split the SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

    console.log(`📄 Found ${statements.length} SQL statements to execute`)

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim()) {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`)

        try {
          const { error } = await supabase.rpc('exec_sql', {
            sql: statement + ';'
          })

          if (error) {
            console.error(`❌ Error in statement ${i + 1}:`, error)
            // Continue with other statements even if one fails
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`)
          }
        } catch (stmtError) {
          console.error(`❌ Exception in statement ${i + 1}:`, stmtError)
          // Continue with other statements
        }
      }
    }

    console.log('🎉 Units table creation process completed')

    return NextResponse.json({
      success: true,
      message: 'Units table creation process completed. Check logs for details.',
      statementsExecuted: statements.length
    })

  } catch (error) {
    console.error('❌ Error creating units table:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create units table',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

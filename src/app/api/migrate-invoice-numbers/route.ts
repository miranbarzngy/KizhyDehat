import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('Starting invoice number migration...')

    // First, ensure invoice settings exist
    const { data: existingSettings, error: checkError } = await supabase
      .from('invoice_settings')
      .select('*')
      .limit(1)

    if (checkError) {
      console.error('Error checking invoice settings:', checkError)
    }

    if (!existingSettings || existingSettings.length === 0) {
      console.log('Creating default invoice settings...')
      const { error: createError } = await supabase
        .from('invoice_settings')
        .insert({
          shop_name: 'فرۆشگای کوردستان',
          shop_phone: '',
          shop_address: '',
          shop_logo: '',
          thank_you_note: 'سوپاس بۆ کڕینەکەتان! بە هیوای دووبارە بینین.',
          qr_code_url: '',
          starting_invoice_number: 1000,
          current_invoice_number: 1000
        })

      if (createError) {
        console.error('Error creating invoice settings:', createError)
        return NextResponse.json({
          success: false,
          error: 'Failed to create invoice settings'
        }, { status: 500 })
      }
    }

    // Get invoice settings for starting number
    const { data: settingsData, error: settingsError } = await supabase
      .from('invoice_settings')
      .select('starting_invoice_number')
      .single()

    if (settingsError) {
      console.error('Error fetching invoice settings:', settingsError)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch invoice settings'
      }, { status: 500 })
    }

    const startingNumber = settingsData?.starting_invoice_number || 1000
    console.log('Starting invoice number:', startingNumber)

    // Get all sales ordered by date
    const { data: salesData, error: salesError } = await supabase
      .from('sales')
      .select('id, date')
      .order('date', { ascending: true })

    if (salesError) {
      console.error('Error fetching sales:', salesError)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch sales data'
      }, { status: 500 })
    }

    console.log(`Found ${salesData?.length || 0} sales to update`)

    // Update each sale with sequential invoice numbers
    let invoiceNumber = startingNumber
    const updatePromises = (salesData || []).map(async (sale: any) => {
      try {
        const { error: updateError } = await supabase
          .from('sales')
          .update({ invoice_number: invoiceNumber })
          .eq('id', sale.id)

        if (updateError) {
          console.error(`Error updating sale ${sale.id}:`, updateError)
          return { id: sale.id, success: false, error: updateError }
        }

        console.log(`Updated sale ${sale.id} with invoice number ${invoiceNumber}`)
        invoiceNumber++
        return { id: sale.id, success: true }
      } catch (error) {
        console.error(`Exception updating sale ${sale.id}:`, error)
        return { id: sale.id, success: false, error: error }
      }
    })

    const results = await Promise.all(updatePromises)

    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length

    console.log(`Migration completed: ${successful} successful, ${failed} failed`)

    return NextResponse.json({
      success: true,
      message: `Migration completed successfully`,
      stats: {
        total: salesData?.length || 0,
        successful,
        failed,
        startingNumber,
        finalNumber: startingNumber + successful - 1
      },
      results
    })

  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json({
      success: false,
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

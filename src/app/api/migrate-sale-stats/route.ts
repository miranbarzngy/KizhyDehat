import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({
        error: 'Database connection not available',
        details: 'Supabase client is not initialized. Please check your environment variables.'
      }, { status: 500 })
    }

    // Add sale statistics columns to inventory table
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE inventory ADD COLUMN IF NOT EXISTS total_sold NUMERIC(10,2) DEFAULT 0;
        ALTER TABLE inventory ADD COLUMN IF NOT EXISTS total_revenue NUMERIC(10,2) DEFAULT 0;
        ALTER TABLE inventory ADD COLUMN IF NOT EXISTS total_profit NUMERIC(10,2) DEFAULT 0;
        COMMENT ON COLUMN inventory.total_sold IS 'Total quantity sold for this item';
        COMMENT ON COLUMN inventory.total_revenue IS 'Total revenue generated from sales of this item';
        COMMENT ON COLUMN inventory.total_profit IS 'Total profit generated from sales of this item';
      `
    })

    if (alterError) {
      console.error('Error adding sale statistics columns:', alterError)
      // Try direct approach
      const { error: directError } = await supabase
        .from('inventory')
        .select('id')
        .limit(1)

      if (directError) {
        return NextResponse.json({
          error: 'Database connection issue',
          details: directError.message
        }, { status: 500 })
      }

      // If we can select, try to add column through a different approach
      return NextResponse.json({
        message: 'Please run the migration manually in Supabase SQL Editor',
        sql: `
          ALTER TABLE inventory ADD COLUMN IF NOT EXISTS total_sold NUMERIC(10,2) DEFAULT 0;
          ALTER TABLE inventory ADD COLUMN IF NOT EXISTS total_revenue NUMERIC(10,2) DEFAULT 0;
          ALTER TABLE inventory ADD COLUMN IF NOT EXISTS total_profit NUMERIC(10,2) DEFAULT 0;
          COMMENT ON COLUMN inventory.total_sold IS 'Total quantity sold for this item';
          COMMENT ON COLUMN inventory.total_revenue IS 'Total revenue generated from sales of this item';
          COMMENT ON COLUMN inventory.total_profit IS 'Total profit generated from sales of this item';
        `
      })
    }

    // Sync historical sales data
    console.log('🔄 Syncing historical sales data...')

    // Get all sale_items with their inventory data
    const { data: saleItemsData, error: saleItemsError } = await supabase
      .from('sale_items')
      .select(`
        item_id,
        quantity,
        price,
        cost_price,
        inventory:item_id (
          id,
          item_name,
          cost_price,
          total_sold,
          total_revenue,
          total_profit
        )
      `)

    if (saleItemsError) {
      console.error('Error fetching sale items:', saleItemsError)
      return NextResponse.json({
        error: 'Failed to sync historical data',
        details: saleItemsError.message
      }, { status: 500 })
    }

    console.log(`📊 Processing ${saleItemsData?.length || 0} sale item records...`)

    // Group sales by item_id and calculate totals
    const itemStats: { [key: string]: {
      total_sold: number,
      total_revenue: number,
      total_profit: number,
      item_name: string,
      missing_cost_price: boolean
    } } = {}

    let itemsWithMissingCostPrice = 0

    saleItemsData?.forEach((item: any) => {
      const itemId = item.item_id
      const quantity = Number(item.quantity) || 0
      const salePrice = Number(item.price) || 0 // Price from sale_items (what was actually sold for)
      const inventoryCostPrice = Number(item.inventory?.cost_price) || 0 // Cost price from inventory table

      // Use sale_items cost_price if available, otherwise use inventory cost_price
      const costPrice = Number(item.cost_price) || inventoryCostPrice || 0

      const revenue = quantity * salePrice
      const profit = quantity * (salePrice - costPrice)

      console.log(`🔍 Processing ${item.inventory?.item_name || 'Unknown Item'}:`)
      console.log(`   Quantity: ${quantity}, Sale Price: ${salePrice}, Cost Price: ${costPrice}`)
      console.log(`   Revenue: ${revenue}, Profit: ${profit}`)

      if (!itemStats[itemId]) {
        itemStats[itemId] = {
          total_sold: 0,
          total_revenue: 0,
          total_profit: 0,
          item_name: item.inventory?.item_name || 'Unknown Item',
          missing_cost_price: costPrice === 0
        }
      }

      itemStats[itemId].total_sold += quantity
      itemStats[itemId].total_revenue += revenue
      itemStats[itemId].total_profit += profit

      if (costPrice === 0) {
        itemStats[itemId].missing_cost_price = true
        itemsWithMissingCostPrice++
      }
    })

    console.log(`📈 Calculated stats for ${Object.keys(itemStats).length} items`)
    console.log(`⚠️  ${itemsWithMissingCostPrice} items have missing cost price data`)

    // Update inventory table with calculated statistics (OVERWRITE existing values)
    const updatePromises = Object.entries(itemStats).map(async ([itemId, stats]) => {
      console.log(`💾 Updating ${stats.item_name}: sold=${stats.total_sold}, revenue=${stats.total_revenue}, profit=${stats.total_profit}`)

      const { error: updateError } = await supabase!
        .from('inventory')
        .update({
          total_sold: stats.total_sold,
          total_revenue: stats.total_revenue,
          total_profit: stats.total_profit
        })
        .eq('id', itemId)

      if (updateError) {
        console.error(`❌ Error updating item ${itemId} (${stats.item_name}):`, updateError)
        return { itemId, itemName: stats.item_name, error: updateError }
      }

      return { itemId, itemName: stats.item_name, success: true }
    })

    const updateResults = await Promise.all(updatePromises)
    const failedUpdates = updateResults.filter(result => result && 'error' in result)
    const successfulUpdates = updateResults.filter(result => result && 'success' in result)

    console.log(`✅ Successfully synced ${successfulUpdates.length} items`)
    console.log(`❌ Failed to sync ${failedUpdates.length} items`)

    return NextResponse.json({
      message: 'Sale statistics columns added and historical data synced successfully',
      syncedItems: successfulUpdates.length,
      failedUpdates: failedUpdates.length,
      itemsWithMissingCostPrice: itemsWithMissingCostPrice,
      details: {
        totalItemsProcessed: Object.keys(itemStats).length,
        successfulUpdates: successfulUpdates.length,
        failedUpdates: failedUpdates.length,
        itemsWithMissingCostPrice: itemsWithMissingCostPrice,
        sampleResults: successfulUpdates.slice(0, 3).map(item => ({
          itemName: item.itemName,
          stats: itemStats[item.itemId]
        }))
      }
    })

  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json({
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
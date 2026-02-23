import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Create Supabase client with service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
  try {
    const { name, image, phone, location, email, password, roleId, isActive } = await request.json()

    // Validate required fields
    if (!email || !password || !roleId) {
      return NextResponse.json(
        { error: 'ئیمەیڵ و وشەی نهێنی و ڕۆڵ پێویستە بە دروستی پڕبکرێتەوە' },
        { status: 400 }
      )
    }

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        phone,
        location
      }
    })

    if (authError) {
      console.error('Auth error:', authError)
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 400 }
      )
    }

    // Create profile with is_active (default to true if not provided)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        name,
        image,
        phone,
        location,
        email,
        role_id: roleId,
        is_active: isActive !== false
      })

    if (profileError) {
      console.error('Profile error:', profileError)
      // Try to delete the auth user if profile creation failed
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        { error: 'Failed to create user profile' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name,
        phone,
        location
      }
    })

  } catch (error) {
    console.error('User creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check if Supabase admin is properly configured
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('SUPABASE_SERVICE_ROLE_KEY not configured')
      return NextResponse.json(
        { error: 'Server configuration error', details: 'Service role key not configured' },
        { status: 500 }
      )
    }

    const { id, name, image, phone, location, email, password, roleId, isActive } = await request.json()

    // Validate required fields
    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Prepare update data
    const updateData: any = {
      name,
      image,
      phone,
      location,
      email,
      role_id: roleId,
      is_active: isActive
    }

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key]
      }
    })

    // Update profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', id)

    if (profileError) {
      console.error('Profile update error:', profileError)
      return NextResponse.json(
        { error: 'Failed to update user profile', details: profileError.message },
        { status: 400 }
      )
    }

    // If user is being set to inactive, invalidate their sessions
    if (isActive === false) {
      try {
        // Get all sessions for this user and invalidate them
        const { data: sessionsData, error: sessionsError } = await supabaseAdmin.auth.admin.listSessions(id)
        
        if (sessionsError) {
          console.warn('Could not list sessions:', sessionsError.message)
        } else if (sessionsData && sessionsData.sessions && sessionsData.sessions.length > 0) {
          // Sign out user from all devices by invalidating refresh tokens
          const { error: signOutError } = await supabaseAdmin.auth.admin.signOut(id)
          
          if (signOutError) {
            console.warn('Could not sign out user from all sessions:', signOutError.message)
          } else {
            console.log('User sessions invalidated successfully for user:', id)
          }
        }
      } catch (sessionError: any) {
        console.warn('Session invalidation error:', sessionError?.message)
        // Don't fail the update - just log the warning
      }
    }

    // Update password if provided (this is optional - don't fail the whole update if password update fails)
    let passwordUpdated = false
    if (password && password.trim() !== '') {
      try {
        const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(id, {
          password: password
        })

        if (passwordError) {
          console.warn('Password update warning:', passwordError.message)
          // Don't fail the whole operation - just warn about password
        } else {
          passwordUpdated = true
        }
      } catch (passwordCatchError: any) {
        console.warn('Password update exception:', passwordCatchError?.message)
        // Continue anyway - profile update might have succeeded
      }
    }

    return NextResponse.json({
      success: true,
      message: isActive === false 
        ? 'User deactivated and logged out from all devices' 
        : (passwordUpdated ? 'User and password updated successfully' : 'User updated successfully'),
      warning: !passwordUpdated && password ? 'Password could not be updated' : undefined
    })

  } catch (error: any) {
    console.error('User update error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()

    // Validate required fields
    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // First delete the profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', id)

    if (profileError) {
      console.error('Profile deletion error:', profileError)
      return NextResponse.json(
        { error: 'Failed to delete user profile' },
        { status: 400 }
      )
    }

    // Then delete the auth user
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id)

    if (authError) {
      console.error('Auth user deletion error:', authError)
      return NextResponse.json(
        { error: 'Failed to delete user account' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    })

  } catch (error) {
    console.error('User deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Get all users with their profiles and roles
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select(`
        id,
        name,
        image,
        phone,
        location,
        email,
        role_id,
        is_active,
        roles (
          name,
          permissions
        )
      `)

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 400 }
      )
    }

    return NextResponse.json({ users: data || [] })

  } catch (error) {
    console.error('Users fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
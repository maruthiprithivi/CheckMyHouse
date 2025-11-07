import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * Disconnect user by clearing connection cookies
 */
export async function POST() {
  try {
    const cookieStore = await cookies();

    // Delete the connection config cookie
    cookieStore.delete('clickhouse_config');

    return NextResponse.json({
      success: true,
      message: 'Disconnected successfully',
    });
  } catch (error) {
    console.error('Disconnect error:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET() {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 50,
    });
    
    // Format response to match AuditLog client schema (converting Date to ISO string)
    const formatted = logs.map(log => ({
      id: log.id,
      timestamp: log.timestamp.toISOString(),
      responsibleEmail: log.responsibleEmail,
      action: log.action as any,
      details: log.details
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { action, details, responsibleEmail } = await req.json();
    
    const log = await prisma.auditLog.create({
      data: {
        action,
        details,
        responsibleEmail: responsibleEmail || 'pai@exemplo.com',
      },
    });

    return NextResponse.json({
      id: log.id,
      timestamp: log.timestamp.toISOString(),
      responsibleEmail: log.responsibleEmail,
      action: log.action,
      details: log.details
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

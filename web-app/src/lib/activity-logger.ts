import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface LogActivityParams {
  userId?: string | null;
  userName?: string | null;
  userRole?: string | null;
  action: string; // e.g. "JOB_CREATED", "JOB_DELIVERED", "INVOICE_GENERATED", "PAYMENT_RECEIVED", "LEAD_CONVERTED", "PUNCH_IN", "PAYROLL_RUN"
  category?: 'PROJECTS' | 'FINANCE' | 'MARKETING' | 'HR' | 'SYSTEM' | 'GENERAL';
  entityType?: 'JOB' | 'INVOICE' | 'CLIENT' | 'LEAD' | 'PAYSLIP' | 'ATTENDANCE' | 'USER';
  entityId?: string | null;
  entityTitle?: string | null;
  clientId?: string | null;
  description: string;
  metadata?: any;
}

export async function recordActivity(params: LogActivityParams) {
  try {
    const metaStr = params.metadata ? JSON.stringify(params.metadata) : null;
    return await prisma.activityLog.create({
      data: {
        userId: params.userId || undefined,
        userName: params.userName || undefined,
        userRole: params.userRole || undefined,
        action: params.action,
        category: params.category || 'GENERAL',
        entityType: params.entityType || undefined,
        entityId: params.entityId || undefined,
        entityTitle: params.entityTitle || undefined,
        clientId: params.clientId || undefined,
        description: params.description,
        metadata: metaStr,
      },
    });
  } catch (err) {
    console.error('Failed to record activity log:', err);
    return null;
  }
}

import cron from 'node-cron';
import { AppDataSource } from '../config/database.js';
import { RecurringJobTemplate, RecurringFrequency } from '../entities/RecurringJobTemplate.js';
import { Job } from '../entities/Job.js';
import { JobStatus } from '../types/enums.js';
import { addDays, addWeeks, addMonths, addQuarters, addYears, format, parseISO } from 'date-fns';

function nextDate(from: string, freq: RecurringFrequency): string {
  const d = parseISO(from);
  let next: Date;
  switch (freq) {
    case 'daily':     next = addDays(d, 1); break;
    case 'weekly':    next = addWeeks(d, 1); break;
    case 'biweekly':  next = addWeeks(d, 2); break;
    case 'monthly':   next = addMonths(d, 1); break;
    case 'quarterly': next = addQuarters(d, 1); break;
    case 'yearly':    next = addYears(d, 1); break;
    default:          next = addMonths(d, 1);
  }
  return format(next, 'yyyy-MM-dd');
}

async function spawnDueJobs(): Promise<void> {
  if (!AppDataSource.isInitialized) return;
  const today = format(new Date(), 'yyyy-MM-dd');

  const tplRepo = AppDataSource.getRepository(RecurringJobTemplate);
  const due = await tplRepo
    .createQueryBuilder('t')
    .where('t.isActive = true')
    .andWhere('t.nextRunAt <= :today', { today })
    .andWhere('(t.endDate IS NULL OR t.endDate >= :today)', { today })
    .getMany();

  for (const tpl of due) {
    const jobRepo = AppDataSource.getRepository(Job);
    const job = jobRepo.create({
      userId: tpl.userId,
      clientId: tpl.clientId,
      title: tpl.title,
      description: tpl.description,
      status: JobStatus.ACTIVE,
      startDate: tpl.nextRunAt ?? today,
      isRecurring: true,
      recurringTemplateId: tpl.id,
    });
    await jobRepo.save(job);

    tpl.jobsSpawned += 1;
    const nextRun = nextDate(tpl.nextRunAt ?? today, tpl.frequency);
    tpl.nextRunAt = nextRun;
    if (tpl.endDate && nextRun > tpl.endDate) {
      tpl.isActive = false;
    }
    await tplRepo.save(tpl);
  }

  if (due.length > 0) {
    console.log(`[cron] Spawned ${due.length} recurring job(s)`);
  }
}

export function startRecurringJobCron(): void {
  // Run daily at 00:05
  cron.schedule('5 0 * * *', () => {
    spawnDueJobs().catch((err) => console.error('[cron] recurring jobs error:', err));
  });
  // Also run on startup to catch any missed runs
  spawnDueJobs().catch((err) => console.error('[cron] startup recurring jobs error:', err));
  console.log('[cron] Recurring job scheduler started');
}

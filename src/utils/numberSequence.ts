import { AppDataSource } from '../config/database.js';
import { NumberSequence } from '../entities/NumberSequence.js';

export async function getNextNumber(userId: string, prefix: string): Promise<string> {
  return AppDataSource.transaction(async (manager) => {
    const sequenceRepository = manager.getRepository(NumberSequence);

    // Lock the row for this user+prefix to prevent concurrent duplicates
    let sequence = await sequenceRepository.findOne({
      where: { userId, prefix },
      lock: { mode: 'pessimistic_write' },
    });

    if (!sequence) {
      sequence = sequenceRepository.create({
        userId,
        prefix,
        lastNumber: 0,
      });
    }

    sequence.lastNumber += 1;
    await sequenceRepository.save(sequence);

    const paddedNumber = sequence.lastNumber.toString().padStart(4, '0');
    return `${prefix}${paddedNumber}`;
  });
}

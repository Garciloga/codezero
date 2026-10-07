export type BlockEvidence = {
  lessonIds: readonly number[]; completedLessonIds: readonly number[];
  examIds: readonly number[]; passedExamIds: readonly number[];
  projectIds: readonly number[]; approvedProjectIds: readonly number[];
};
/** Called only with current published requirements and server-owned learner records. */
export function canIssueBlockDiploma(evidence: BlockEvidence): boolean {
  if (!evidence.lessonIds.length || !evidence.examIds.length) return false;
  const valid = (ids: readonly number[]) => ids.every(id => Number.isSafeInteger(id) && id > 0);
  if (!Object.values(evidence).every(valid)) return false;
  const complete = (required: readonly number[], actual: readonly number[]) => {
    const found = new Set(actual);
    return required.every(id => found.has(id));
  };
  return complete(evidence.lessonIds, evidence.completedLessonIds)
    && complete(evidence.examIds, evidence.passedExamIds)
    && complete(evidence.projectIds, evidence.approvedProjectIds);
}

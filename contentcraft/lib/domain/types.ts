export const USER_ROLES = ['ADMIN', 'DESIGNER', 'WRITER', 'REVIEWER'] as const
export type UserRole = typeof USER_ROLES[number]

export const CONTENT_OBJECT_TYPES = ['CO1', 'CO2', 'CO3', 'CO4', 'CO5', 'CO6', 'CO7'] as const
export type ContentObjectType = typeof CONTENT_OBJECT_TYPES[number]

export const BLOOMS_LEVELS = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYSE', 'EVALUATE', 'CREATE'] as const
export type BloomsLevel = typeof BLOOMS_LEVELS[number]

export const RUN_STATUSES = ['PENDING', 'RESEARCHING', 'GENERATING', 'COMPLETE', 'FAILED'] as const
export type RunStatus = typeof RUN_STATUSES[number]

export const REVIEW_STATUSES = ['DRAFT', 'IN_REVIEW', 'REVISION_REQUESTED', 'APPROVED'] as const
export type ReviewStatus = typeof REVIEW_STATUSES[number]

export const PROPOSAL_TYPES = ['TEMPLATE', 'PROMPT'] as const
export type ProposalType = typeof PROPOSAL_TYPES[number]

export const PROPOSAL_STATUSES = ['PENDING', 'ACCEPTED', 'REJECTED'] as const
export type ProposalStatus = typeof PROPOSAL_STATUSES[number]

import { relations } from 'drizzle-orm';
import {
  boolean,
  doublePrecision,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

// 1. Profiles (Main Identity linked to Auth UID / Credentials)
export const profiles = pgTable('profiles', {
  id: serial('id').primaryKey(),
  firebaseUid: text('firebase_uid').notNull().unique(),
  email: text('email').notNull().unique(),
  fullName: text('full_name').notNull(),
  role: text('role').notNull().default('UMKM'), // 'UMKM' | 'MENTOR' | 'ADMIN'
  accountStatus: text('account_status').notNull().default('ACTIVE'), // 'ACTIVE' | 'INACTIVE' | 'INVITED' | 'PENDING' | 'SUSPENDED'
  passwordHash: text('password_hash'),
  inviteToken: text('invite_token'),
  resetToken: text('reset_token'),
  resetExpiresAt: timestamp('reset_expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 2. UMKM Business Profile
export const umkmProfiles = pgTable('umkm_profiles', {
  id: serial('id').primaryKey(),
  profileId: integer('profile_id').references(() => profiles.id).notNull().unique(),
  businessName: text('business_name').notNull(),
  ownerName: text('owner_name').notNull(),
  whatsapp: text('whatsapp'),
  email: text('email'),
  cityRegency: text('city_regency'),
  district: text('district'),
  address: text('address'),
  establishedYear: integer('established_year'),
  businessSector: text('business_sector'),
  commodity: text('commodity'),
  description: text('description'),
  nib: text('nib'),
  instagram: text('instagram'),
  marketplace: text('marketplace'),
  logoUrl: text('logo_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 3. Mentor Profile
export const mentorProfiles = pgTable('mentor_profiles', {
  id: serial('id').primaryKey(),
  profileId: integer('profile_id').references(() => profiles.id).notNull().unique(),
  fullName: text('full_name').notNull(),
  email: text('email').notNull(),
  whatsapp: text('whatsapp'),
  photoUrl: text('photo_url'),
  institution: text('institution'),
  position: text('position'),
  bio: text('bio'),
  expertise: text('expertise'), // Comma-separated or JSON
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 4. Products
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  umkmId: integer('umkm_id').references(() => umkmProfiles.id).notNull(),
  name: text('name').notNull(),
  sku: text('sku'),
  unit: text('unit').notNull().default('pcs'),
  defaultSellingPrice: doublePrecision('default_selling_price').notNull().default(0),
  defaultHpp: doublePrecision('default_hpp').notNull().default(0),
  status: text('status').notNull().default('ACTIVE'), // 'ACTIVE' | 'INACTIVE'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 5. Sales Channels (Toko Fisik, WhatsApp, Shopee, etc.)
export const salesChannels = pgTable('sales_channels', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
});

// 6. Sales
export const sales = pgTable('sales', {
  id: serial('id').primaryKey(),
  umkmId: integer('umkm_id').references(() => umkmProfiles.id).notNull(),
  transactionDate: text('transaction_date').notNull(), // Format YYYY-MM-DD
  salesChannelId: integer('sales_channel_id').references(() => salesChannels.id).notNull(),
  customerName: text('customer_name'),
  notes: text('notes'),
  totalRevenue: doublePrecision('total_revenue').notNull().default(0),
  totalHpp: doublePrecision('total_hpp').notNull().default(0),
  grossProfit: doublePrecision('gross_profit').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

// 7. Sale Items (with HPP & Selling Price snapshot!)
export const saleItems = pgTable('sale_items', {
  id: serial('id').primaryKey(),
  saleId: integer('sale_id').references(() => sales.id).notNull(),
  productId: integer('product_id').references(() => products.id).notNull(),
  productNameSnapshot: text('product_name_snapshot').notNull(),
  quantity: doublePrecision('quantity').notNull().default(1),
  sellingPrice: doublePrecision('selling_price').notNull().default(0),
  hppSnapshot: doublePrecision('hpp_snapshot').notNull().default(0),
  subtotal: doublePrecision('subtotal').notNull().default(0),
  totalHpp: doublePrecision('total_hpp').notNull().default(0),
  grossProfit: doublePrecision('gross_profit').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 8. Mentoring Programs
export const programs = pgTable('programs', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  organizer: text('organizer'),
  startDate: text('start_date'),
  endDate: text('end_date'),
  status: text('status').notNull().default('ACTIVE'), // 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'
  createdBy: integer('created_by').references(() => profiles.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 9. Program Participants (UMKM & Mentors enrolled in a program)
export const programParticipants = pgTable('program_participants', {
  id: serial('id').primaryKey(),
  programId: integer('program_id').references(() => programs.id).notNull(),
  profileId: integer('profile_id').references(() => profiles.id).notNull(),
  participantRole: text('participant_role').notNull(), // 'UMKM' | 'MENTOR'
  status: text('status').notNull().default('ACTIVE'), // 'ACTIVE' | 'INACTIVE' | 'COMPLETED'
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
  removedAt: timestamp('removed_at'),
});

// 10. Mentor Assignments (Mentor <-> UMKM pairing per Program)
export const mentorAssignments = pgTable('mentor_assignments', {
  id: serial('id').primaryKey(),
  programId: integer('program_id').references(() => programs.id).notNull(),
  mentorId: integer('mentor_id').references(() => mentorProfiles.id).notNull(),
  umkmId: integer('umkm_id').references(() => umkmProfiles.id).notNull(),
  status: text('status').notNull().default('ACTIVE'), // 'ACTIVE' | 'INACTIVE' | 'ENDED'
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
  endedAt: timestamp('ended_at'),
  createdBy: integer('created_by').references(() => profiles.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 11. Mentoring Sessions
export const mentoringSessions = pgTable('mentoring_sessions', {
  id: serial('id').primaryKey(),
  programId: integer('program_id').references(() => programs.id).notNull(),
  mentorId: integer('mentor_id').references(() => mentorProfiles.id).notNull(),
  umkmId: integer('umkm_id').references(() => umkmProfiles.id).notNull(),
  sessionDate: text('session_date').notNull(),
  topic: text('topic').notNull(),
  problem: text('problem'),
  findings: text('findings'),
  recommendation: text('recommendation').notNull(),
  additionalNotes: text('additional_notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 12. Action Plans
export const actionPlans = pgTable('action_plans', {
  id: serial('id').primaryKey(),
  programId: integer('program_id').references(() => programs.id).notNull(),
  mentoringSessionId: integer('mentoring_session_id').references(() => mentoringSessions.id),
  mentorId: integer('mentor_id').references(() => mentorProfiles.id).notNull(),
  umkmId: integer('umkm_id').references(() => umkmProfiles.id).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  target: text('target'),
  pic: text('pic'),
  deadline: text('deadline').notNull(), // YYYY-MM-DD
  status: text('status').notNull().default('NOT_STARTED'), // 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'NOT_ACHIEVED' | 'CANCELLED'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
});

// 13. Action Plan Evaluations
export const actionPlanEvaluations = pgTable('action_plan_evaluations', {
  id: serial('id').primaryKey(),
  actionPlanId: integer('action_plan_id').references(() => actionPlans.id).notNull(),
  mentorId: integer('mentor_id').references(() => mentorProfiles.id).notNull(),
  evaluationDate: text('evaluation_date').notNull(),
  status: text('status').notNull(),
  evaluationNotes: text('evaluation_notes').notNull(),
  result: text('result'),
  nextRecommendation: text('next_recommendation'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 14. Invitations
export const invitations = pgTable('invitations', {
  id: serial('id').primaryKey(),
  email: text('email').notNull(),
  role: text('role').notNull().default('MENTOR'),
  programId: integer('program_id').references(() => programs.id),
  invitedBy: integer('invited_by').references(() => profiles.id),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  acceptedAt: timestamp('accepted_at'),
  status: text('status').notNull().default('PENDING'), // 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 15. Audit Logs
export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  actorProfileId: integer('actor_profile_id'),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id'),
  metadata: text('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations Definitions
export const profilesRelations = relations(profiles, ({ one, many }) => ({
  umkmProfile: one(umkmProfiles, {
    fields: [profiles.id],
    references: [umkmProfiles.profileId],
  }),
  mentorProfile: one(mentorProfiles, {
    fields: [profiles.id],
    references: [mentorProfiles.profileId],
  }),
  programParticipants: many(programParticipants),
}));

export const umkmProfilesRelations = relations(umkmProfiles, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [umkmProfiles.profileId],
    references: [profiles.id],
  }),
  products: many(products),
  sales: many(sales),
  mentorAssignments: many(mentorAssignments),
  mentoringSessions: many(mentoringSessions),
  actionPlans: many(actionPlans),
}));

export const mentorProfilesRelations = relations(mentorProfiles, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [mentorProfiles.profileId],
    references: [profiles.id],
  }),
  mentorAssignments: many(mentorAssignments),
  mentoringSessions: many(mentoringSessions),
  actionPlans: many(actionPlans),
  evaluations: many(actionPlanEvaluations),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  umkm: one(umkmProfiles, {
    fields: [products.umkmId],
    references: [umkmProfiles.id],
  }),
  saleItems: many(saleItems),
}));

export const salesRelations = relations(sales, ({ one, many }) => ({
  umkm: one(umkmProfiles, {
    fields: [sales.umkmId],
    references: [umkmProfiles.id],
  }),
  salesChannel: one(salesChannels, {
    fields: [sales.salesChannelId],
    references: [salesChannels.id],
  }),
  items: many(saleItems),
}));

export const saleItemsRelations = relations(saleItems, ({ one }) => ({
  sale: one(sales, {
    fields: [saleItems.saleId],
    references: [sales.id],
  }),
  product: one(products, {
    fields: [saleItems.productId],
    references: [products.id],
  }),
}));

export const programsRelations = relations(programs, ({ many }) => ({
  participants: many(programParticipants),
  assignments: many(mentorAssignments),
  mentoringSessions: many(mentoringSessions),
  actionPlans: many(actionPlans),
}));

export const programParticipantsRelations = relations(programParticipants, ({ one }) => ({
  program: one(programs, {
    fields: [programParticipants.programId],
    references: [programs.id],
  }),
  profile: one(profiles, {
    fields: [programParticipants.profileId],
    references: [profiles.id],
  }),
}));

export const mentorAssignmentsRelations = relations(mentorAssignments, ({ one }) => ({
  program: one(programs, {
    fields: [mentorAssignments.programId],
    references: [programs.id],
  }),
  mentor: one(mentorProfiles, {
    fields: [mentorAssignments.mentorId],
    references: [mentorProfiles.id],
  }),
  umkm: one(umkmProfiles, {
    fields: [mentorAssignments.umkmId],
    references: [umkmProfiles.id],
  }),
}));

export const mentoringSessionsRelations = relations(mentoringSessions, ({ one, many }) => ({
  program: one(programs, {
    fields: [mentoringSessions.programId],
    references: [programs.id],
  }),
  mentor: one(mentorProfiles, {
    fields: [mentoringSessions.mentorId],
    references: [mentorProfiles.id],
  }),
  umkm: one(umkmProfiles, {
    fields: [mentoringSessions.umkmId],
    references: [umkmProfiles.id],
  }),
  actionPlans: many(actionPlans),
}));

export const actionPlansRelations = relations(actionPlans, ({ one, many }) => ({
  program: one(programs, {
    fields: [actionPlans.programId],
    references: [programs.id],
  }),
  mentoringSession: one(mentoringSessions, {
    fields: [actionPlans.mentoringSessionId],
    references: [mentoringSessions.id],
  }),
  mentor: one(mentorProfiles, {
    fields: [actionPlans.mentorId],
    references: [mentorProfiles.id],
  }),
  umkm: one(umkmProfiles, {
    fields: [actionPlans.umkmId],
    references: [umkmProfiles.id],
  }),
  evaluations: many(actionPlanEvaluations),
}));

export const actionPlanEvaluationsRelations = relations(actionPlanEvaluations, ({ one }) => ({
  actionPlan: one(actionPlans, {
    fields: [actionPlanEvaluations.actionPlanId],
    references: [actionPlans.id],
  }),
  mentor: one(mentorProfiles, {
    fields: [actionPlanEvaluations.mentorId],
    references: [mentorProfiles.id],
  }),
}));

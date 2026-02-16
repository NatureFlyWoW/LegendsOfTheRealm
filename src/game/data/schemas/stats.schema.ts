// src/game/data/schemas/stats.schema.ts

import { z } from "zod";

/**
 * Zod schema for rating conversion structure.
 * Maps rating values to percentage gains.
 */
export const ratingConversionSchema = z.object({
  stat: z.string(),
  ratingPerPercent: z.number(),
});

/**
 * Zod schema for stat cap structure.
 * Defines soft and hard caps for various stats.
 */
export const statCapSchema = z.object({
  stat: z.string(),
  softCap: z.number().optional(),
  hardCap: z.number().optional(),
  description: z.string(),
});

/**
 * Zod schema for stat formulas.
 * Validates StatFormulas from definitions.ts
 */
export const statFormulasSchema = z.object({
  health: z.object({
    staminaMultiplier: z.number(),
  }),
  mana: z.object({
    intellectMultiplier: z.number(),
  }),
  armorReduction: z.object({
    constantBase: z.number(),
    levelMultiplier: z.number(),
  }),
  critChance: z.object({
    agilityDivisor: z.number(),
    intDivisor: z.number(),
    baseCritSuppression: z.number(),
  }),
  dodge: z.object({
    agilityDivisor: z.number(),
    diminishingReturnThreshold: z.number(),
  }),
  parry: z.object({
    basePercent: z.number(),
  }),
  block: z.object({
    basePercent: z.number(),
    strengthDivisor: z.number(),
  }),
  ratingConversions: z.array(ratingConversionSchema),
  caps: z.array(statCapSchema),
});

/**
 * Type inference helpers
 */
export type RatingConversionSchema = z.infer<typeof ratingConversionSchema>;
export type StatCapSchema = z.infer<typeof statCapSchema>;
export type StatFormulasSchema = z.infer<typeof statFormulasSchema>;

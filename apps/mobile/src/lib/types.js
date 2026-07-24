/**
 * @typedef {Object} Profile
 * @property {string} id - uuid
 * @property {string|null} email
 * @property {string|null} full_name
 * @property {string|null} avatar_url
 * @property {'client'|'dietitian'|'admin'} role
 * @property {string} created_at
 */

/**
 * @typedef {Object} DailyLog
 * @property {string} id - uuid
 * @property {string} client_id - uuid references profiles.id
 * @property {string} date - date string YYYY-MM-DD
 * @property {number|null} current_weight
 * @property {number|null} water_intake
 * @property {string|null} mood
 * @property {string} created_at
 */

/**
 * @typedef {'pending' | 'approved' | 'rejected' | 'cancelled'} MealChangeStatus
 */

/**
 * @typedef {Object} MealChangeRequest
 * @property {string} id - uuid
 * @property {string} client_id - uuid
 * @property {string} dietitian_id - uuid
 * @property {string} plan_date - date string YYYY-MM-DD
 * @property {string} meal_slot - e.g., 'breakfast', 'lunch'
 * @property {Object} requested_meals - JSON object containing alternatives
 * @property {string|null} notes
 * @property {MealChangeStatus} status
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} Measurement
 * @property {string} id - uuid
 * @property {string} client_id - uuid
 * @property {string} measured_at - timestamptz
 * @property {number|null} weight
 * @property {number|null} waist
 * @property {number|null} hip
 * @property {number|null} arm
 * @property {number|null} right_arm
 * @property {number|null} left_arm
 * @property {number|null} chest
 * @property {number|null} thigh
 * @property {number|null} calf
 * @property {number|null} right_calf
 * @property {number|null} left_calf
 * @property {number|null} neck
 * @property {string|null} notes
 * @property {string} created_at
 * @property {string} updated_at
 */

export {};

/**
 * Hackathon Tournament Whitelist
 *
 * Tournament IDs from the Cloud9 x JetBrains Hackathon dataset.
 * Content is limited to past 2 years + these specific tournament IDs.
 *
 * Source: https://grid.helpjuice.com/en_US/cloud9-x-jetbrains-hackathon/which-content-is-included-in-the-hackathon
 */

/**
 * League of Legends tournament IDs in the Hackathon dataset
 *
 * Source: https://grid.helpjuice.com/en_US/cloud9-x-jetbrains-hackathon/which-content-is-included-in-the-hackathon
 * Content is limited to past 2 years + these specific tournament IDs.
 */
export const HACKATHON_TOURNAMENT_IDS_LOL: string[] = [
  // LCK
  '775192', // LCK - Regional Qualifier 2024
  '758024', // LCK - Spring 2024
  '774794', // LCK - Summer 2024
  '825490', // LCK - Split 2 2025
  '826679', // LCK - Split 3 2025
  '775623', // LCK - LCK Cup 2025
  // LCS
  '758043', // LCS - Spring 2024
  '774888', // LCS - Summer 2024
  // LEC
  '758077', // LEC - Spring 2024
  '774622', // LEC - Summer 2024
  '758041', // LEC - Winter 2024
  '775075', // LEC - Season Finals 2024
  '825468', // LEC - Spring 2025
  '826906', // LEC - Summer 2025
  '775513', // LEC - Winter 2025
  // LPL
  '775167', // LPL - Regional Qualifier 2024
  '758054', // LPL - Spring 2024
  '774845', // LPL - Summer 2024
  '775662', // LPL - Split 1 2025
  '825450', // LPL - Split 2 2025
  '826789', // LPL - Split 3 2025
  // LTA North
  '775631', // LTA North - Split 1 2025
  '825567', // LTA North - Split 2 2025
  '826763', // LTA North - Split 3 2025
  // LTA South
  '775636', // LTA South - Split 1 2025
  '825600', // LTA South - Split 2 2025
  '826775', // LTA South - Split 3 2025
  // LTA Cross-Conference
  '775878', // LTA Cross-Conference - Split 1 2025
  '826782', // LTA Cross-Conference - Regional Championship 2025
];

/**
 * Valorant tournament IDs in the Hackathon dataset
 *
 * Source: https://grid.helpjuice.com/en_US/cloud9-x-jetbrains-hackathon/which-content-is-included-in-the-hackathon
 * Content is limited to past 2 years + these specific tournament IDs.
 */
export const HACKATHON_TOURNAMENT_IDS_VAL: string[] = [
  '757371', // VCT Americas - Kickoff 2024
  '757481', // VCT Americas - Stage 1 2024
  '774782', // VCT Americas - Stage 2 2024
  '775516', // VCT Americas - Kickoff 2025
  '800675', // VCT Americas - Stage 1 2025
  '826660', // VCT Americas - Stage 2 2025
  '757614', // VALORANT Masters - Masters Madrid
];

/**
 * All Hackathon tournament IDs (concatenated LoL + VAL)
 */
export const HACKATHON_TOURNAMENT_IDS_ALL: string[] = [
  ...HACKATHON_TOURNAMENT_IDS_LOL,
  ...HACKATHON_TOURNAMENT_IDS_VAL,
];

/**
 * Gets the default tournament IDs for Hackathon dataset.
 *
 * This function returns the whitelisted tournament IDs that should be used
 * by default when querying series, unless TOURNAMENT_IDS env var is provided.
 *
 * @returns Array of tournament ID strings
 */
export function getDefaultTournamentIds(): string[] {
  return HACKATHON_TOURNAMENT_IDS_ALL;
}


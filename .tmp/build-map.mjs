/**
 * Builds scripts/i18n-maps/learn-diagrams.json.
 *
 * The Nepali and English text is taken verbatim from the two extraction passes
 * rather than retyped, so the only thing curated here is the key name. Each
 * row is [catalogue key, source id]; ids beginning with a file name come from
 * the second pass, the rest are first-pass proposals.
 */
import { readFileSync, writeFileSync } from "node:fs";

const pass1 = JSON.parse(readFileSync(".tmp/extract-raw.json", "utf8"));
const pass2 = JSON.parse(readFileSync(".tmp/extract2.json", "utf8"));

const P = "learn.diagrams.";

/* ── calendar-cycle-diagrams ───────────────────────────────────────────── */
const ROWS = [
  // HoraWeekdayCycle
  [`${P}hora_cycle_label`, "learn.diagrams.the_seven_graha_hora_cycle_and"],
  [`${P}hora_cycle_caption`, "learn.diagrams.the_seven_grahas_sit_in_a"],
  [`${P}hora_cycle_remainder`, "learn.diagrams.24_7_remainder_3"],
  [`${P}hora_cycle_step`, "learn.diagrams.3_places_along"],
  [`${P}hora_ring_saturn`, "calendar-cycle-diagrams:71#object*"],
  [`${P}hora_ring_jupiter`, "calendar-cycle-diagrams:72#object*"],
  [`${P}hora_ring_mars`, "calendar-cycle-diagrams:73#object*"],
  ["grahas.sun", "calendar-cycle-diagrams:74#object*"],
  [`${P}hora_ring_venus`, "calendar-cycle-diagrams:75#object*"],
  [`${P}hora_ring_mercury`, "calendar-cycle-diagrams:76#object*"],
  ["grahas.moon", "calendar-cycle-diagrams:77#object*"],

  // YearLengthLadder
  [`${P}year_length_label`, "learn.diagrams.julian_gregorian_and_true_year_lengths"],
  [`${P}year_length_caption`, "learn.diagrams.the_julian_rule_calls_a_year"],
  [`${P}year_length_zero_error`, "learn.diagrams.zero_error"],
  [`${P}year_length_row_julian`, "calendar-cycle-diagrams:173#object*"],
  [`${P}year_length_row_gregorian`, "calendar-cycle-diagrams:174#object*"],
  [`${P}year_length_row_true`, "calendar-cycle-diagrams:175#object*"],
  [`${P}year_length_excess_unit`, "learn.diagrams.d_yr"],
  [`${P}year_length_gregorian_drift`, "calendar-cycle-diagrams:223#tmpl"],

  // GregorianJump
  [`${P}gregorian_jump_label`, "learn.diagrams.the_ten_days_removed_from_october"],
  [`${P}gregorian_jump_caption`, "learn.diagrams.ten_days_were_struck_from_october"],
  [`${P}gregorian_jump_month`, "learn.diagrams.october_1582"],
  [`${P}gregorian_jump_lost_days`, "learn.diagrams.ten_days_removed_these_never_happened"],
  ["common.days", "learn.diagrams.days"],
  [`${P}country_italy_spain_portugal`, "calendar-cycle-diagrams:254#object*"],
  [`${P}country_britain`, "calendar-cycle-diagrams:255#object*"],
  [`${P}country_russia`, "calendar-cycle-diagrams:256#object*"],
  [`${P}country_greece`, "calendar-cycle-diagrams:257#object*"],

  // EclipseSeasonWindow
  [`${P}eclipse_season_label`, "learn.diagrams.the_34_day_eclipse_window_and"],
  [`${P}eclipse_season_caption`, "learn.diagrams.an_eclipse_needs_the_sun_near"],
  [`${P}eclipse_phase_new_moon`, "calendar-cycle-diagrams:371#object*"],
  [`${P}eclipse_phase_full_moon`, "calendar-cycle-diagrams:372#object*"],
  [`${P}eclipse_event_solar`, "calendar-cycle-diagrams:371#xEn"],
  [`${P}eclipse_event_lunar`, "calendar-cycle-diagrams:372#xEn"],

  // SunRayAngle
  [`${P}ray_angle_label`, "learn.diagrams.the_same_quantity_of_light_arriving"],
  [`${P}ray_angle_caption`, "learn.diagrams.the_beam_is_the_same_width"],
  [`${P}ray_steep`, "calendar-cycle-diagrams:452#object*"],
  [`${P}ray_steep_result`, "calendar-cycle-diagrams:452#xEn"],
  [`${P}ray_slant`, "calendar-cycle-diagrams:453#object*"],
  [`${P}ray_slant_result`, "calendar-cycle-diagrams:453#xEn"],

  /* ── day-timeline-diagrams ──────────────────────────────────────────── */
  [`${P}sidereal_day_label`, "learn.diagrams.sidereal_versus_solar_day_the_four"],
  [`${P}sidereal_day_caption`, "learn.diagrams.a_mark_on_earth_starts_lined"],
  [`${P}sidereal_star_direction`, "learn.diagrams.direction_to_the_distant_star_the"],
  [`${P}sidereal_panel_start`, "day-timeline-diagrams:78#object*"],
  [`${P}sidereal_panel_one_rotation`, "day-timeline-diagrams:79#object*"],
  [`${P}sidereal_day_total`, "learn.diagrams.23h_56m_sidereal_day_4m_24"],

  [`${P}day_length_label`, "learn.diagrams.day_length_2h_the_hour_angle"],
  [`${P}day_length_caption`, "learn.diagrams.the_h_that_the_sunrise_equation"],
  [`${P}local_noon`, "learn.diagrams.local_noon"],
  ["panchanga.wheel.sunrise", "learn.diagrams.sunrise"],
  [`${P}sunset`, "learn.diagrams.sunset"],
  [`${P}summer_solstice`, "day-timeline-diagrams:187#object*"],
  [`${P}winter_solstice`, "day-timeline-diagrams:188#object*"],

  [`${P}moonrise_slip_label`, "learn.diagrams.moonrise_slips_50_minutes_a_day"],
  [`${P}moonrise_slip_caption`, "learn.diagrams.the_moon_moves_about_13_along"],
  [`${P}moonrise_none`, "learn.diagrams.no_moonrise_this_day"],

  [`${P}sunrise_sample_label`, "learn.diagrams.the_tithi_running_at_sunrise_is"],
  [`${P}sunrise_sample_caption`, "learn.diagrams.a_tithi_can_start_and_end"],
  [`${P}tithi_tritiya`, "day-timeline-diagrams:392#object*"],
  [`${P}tithi_chaturthi`, "day-timeline-diagrams:393#object*"],
  [`${P}one_civil_day`, "learn.diagrams.one_civil_day"],

  [`${P}tithi_zones_label`, "learn.diagrams.one_tithi_boundary_two_cities_which"],
  [`${P}tithi_zones_caption`, "learn.diagrams.the_tithi_ends_at_one_absolute"],
  [`${P}city_kathmandu`, "day-timeline-diagrams:463#object*"],
  [`${P}city_sydney`, "day-timeline-diagrams:464#object*"],
  [`${P}tithi_ended_before_sunrise`, "learn.diagrams.ended_before_sunrise_next_tithi"],
  [`${P}tithi_ended_after_sunrise`, "learn.diagrams.ended_after_sunrise_same_tithi"],

  /* ── motion-and-month-diagrams ──────────────────────────────────────── */
  [`${P}retrograde_label`, "learn.diagrams.retrograde_motion_the_sightline_slides_backwards"],
  [`${P}retrograde_caption`, "learn.diagrams.earth_runs_fast_on_the_inner"],
  [`${P}retrograde_star_backdrop`, "learn.diagrams.the_fixed_star_backdrop_the_apparent"],
  [`${P}retrograde_earth_faster`, "learn.diagrams.earth_faster"],
  [`${P}retrograde_mars_slower`, "learn.diagrams.mars_slower"],
  [`${P}retrograde_red_span`, "learn.diagrams.red_span_retrograde_the_sightline_sliding"],

  [`${P}manda_shighra_label`, "learn.diagrams.manda_and_shighra_corrections_turning_a"],
  [`${P}manda_shighra_caption`, "learn.diagrams.a_mean_planet_moves_at_a"],
  [`${P}manda_row_mean`, "motion-and-month-diagrams:171#object*"],
  [`${P}manda_row_mean_note`, "learn.diagrams.uniform_circular_motion"],
  [`${P}manda_row_manda`, "motion-and-month-diagrams:179#object*"],
  [`${P}manda_row_manda_note`, "learn.diagrams.orbit_not_centred_on_us_one"],
  [`${P}manda_row_shighra`, "motion-and-month-diagrams:187#object*"],
  [`${P}manda_row_shighra_note`, "learn.diagrams.our_own_motion_this_is_where"],
  [`${P}one_revolution_axis`, "learn.diagrams.one_revolution"],

  [`${P}paksha_strip_label`, "learn.diagrams.shukla_and_krishna_paksha_the_two"],
  [`${P}paksha_strip_caption`, "learn.diagrams.a_lunation_runs_from_new_moon"],
  [`${P}paksha_shukla`, "motion-and-month-diagrams:304#object*"],
  [`${P}paksha_krishna`, "motion-and-month-diagrams:305#object*"],
  [`${P}paksha_tithi_range`, "learn.diagrams.tithi_1_15"],
  [`${P}phase_new_short`, "motion-and-month-diagrams:318#object*"],
  [`${P}phase_full_short`, "motion-and-month-diagrams:319#object*"],

  /* ── zodiac-frame-diagrams ──────────────────────────────────────────── */
  [`${P}two_zeros_label`, "learn.diagrams.the_tropical_and_sidereal_zeros_on"],
  [`${P}two_zeros_caption`, "learn.diagrams.both_zodiacs_run_0_to_360"],
  [`${P}tropical_scale_zero`, "learn.diagrams.tropical_zero_at_the_spring_equinox"],
  [`${P}sidereal_scale_zero`, "learn.diagrams.sidereal_zero_fixed_against_the_stars"],

  [`${P}belt_width_label`, "learn.diagrams.the_width_of_the_zodiac_belt"],
  [`${P}belt_width_caption`, "learn.diagrams.the_sun_is_on_the_ecliptic"],
  ["grahas.mercury", "zodiac-frame-diagrams:159#object*"],
  [`${P}belt_latitude_sun`, "learn.diagrams.0_by_definition"],
  [`${P}belt_latitude_moon`, "learn.diagrams.5_1"],
  [`${P}belt_latitude_mercury`, "learn.diagrams.7"],
  [`${P}ecliptic_latitude_zero`, "learn.diagrams.the_ecliptic_latitude_0"],
  [`${P}belt_total_width`, "learn.diagrams.the_zodiac_belt_about_18_wide"],

  [`${P}ecliptic_cross_label`, "learn.diagrams.the_ecliptic_and_the_celestial_equator"],
  [`${P}ecliptic_cross_caption`, "learn.diagrams.two_great_circles_on_one_sphere"],
  [`${P}celestial_equator`, "learn.diagrams.celestial_equator"],
  [`${P}ecliptic_curve`, "learn.diagrams.the_ecliptic"],
  [`${P}spring_equinox`, "zodiac-frame-diagrams:257#object*"],
  [`${P}autumn_equinox`, "zodiac-frame-diagrams:259#object*"],
  [`${P}ecliptic_longitude_axis`, "learn.diagrams.ecliptic_longitude_0_360"],

  /* ── HierarchyDiagram ───────────────────────────────────────────────── */
  ["grahas.earth", "HierarchyDiagram:48#object*"],
  [`${P}hierarchy_driver_earth`, "learn.diagrams.spin_on_its_own_axis"],
  ["learn.playground.day", "HierarchyDiagram:51#object*"],
  [`${P}hierarchy_step_vaara`, "learn.diagrams.v_ra"],
  [`${P}hierarchy_rule_one_turn`, "learn.diagrams.1_turn"],
  [`${P}hierarchy_driver_sun`, "learn.diagrams.annual_path_through_the_zodiac"],
  [`${P}hierarchy_step_rashi`, "learn.diagrams.r_i"],
  [`${P}hierarchy_step_sankranti`, "learn.diagrams.sa_kr_nti"],
  [`${P}hierarchy_step_solar_month`, "learn.diagrams.solar_month_gate"],
  [`${P}hierarchy_rule_rashi_span`, "learn.diagrams.30_segment"],
  [`${P}hierarchy_rule_boundary`, "learn.diagrams.boundary_crossed"],
  [`${P}hierarchy_mana_solar`, "learn.diagrams.sauram_na"],
  [`${P}hierarchy_driver_moon`, "learn.diagrams.angular_gap_from_the_sun"],
  ["tithi", "HierarchyDiagram:80#object*"],
  [`${P}hierarchy_step_paksha`, "learn.diagrams.pak_a"],
  [`${P}hierarchy_step_lunar_month`, "learn.diagrams.lunar_month"],
  [`${P}hierarchy_rule_tithi_span`, "learn.diagrams.every_12"],
  [`${P}hierarchy_rule_paksha_count`, "learn.diagrams.15_tithis"],
  [`${P}hierarchy_rule_month_count`, "learn.diagrams.30_tithis"],
  [`${P}hierarchy_mana_lunar`, "learn.diagrams.ch_ndram_na"],
  [`${P}hierarchy_top`, "learn.diagrams.celestial_motion"],
  [`${P}hierarchy_converge`, "learn.diagrams.panchanga"],
  [`${P}hierarchy_result`, "learn.diagrams.one_bikram_sambat_date"],
  [`${P}hierarchy_result_fields`, "learn.diagrams.year_month_gate_tithi_vaara"],
  [`${P}hierarchy_wide_aria`, "learn.diagrams.earth_s_the_sun_s_and"],
  [`${P}hierarchy_stacked_aria`, "learn.diagrams.the_chain_from_celestial_motion_to"],
  [`${P}hierarchy_caption`, "learn.diagrams.three_motions_three_streams_one_date"],

  /* ── TwoSystemsDiagram, DayPlaygroundDiagram ────────────────────────── */
  [`${P}scene_loading`, "learn.diagrams.preparing_the_sky"],
];

const map = {};
const seenPair = new Map();
for (const [key, id] of ROWS) {
  const src = pass2[id] ?? pass1[id];
  if (!src) throw new Error(`no source pair for ${key} (${id})`);
  const pair = JSON.stringify([src.ne, src.en]);
  if (seenPair.has(pair)) throw new Error(`${key} duplicates ${seenPair.get(pair)}`);
  seenPair.set(pair, key);
  if (map[key]) throw new Error(`duplicate key ${key}`);
  map[key] = { ne: src.ne, en: src.en };
}

/* HeliocentricOrbitDiagram is Nepali-only — no English ever existed. Read the
   Nepali out of the file so it is not retyped; the English is new copy. */
const helio = readFileSync("src/components/learn/HeliocentricOrbitDiagram.tsx", "utf8");
const HELIO = [
  [`${P}orbit_perihelion`, "उपसौर (नजिक)", "Perihelion (nearest)"],
  [`${P}orbit_aphelion`, "अपसौर (टाढा)", "Aphelion (farthest)"],
  [`${P}orbit_direction`, "↺ वामावर्त (वास्तविक दिशा)", "↺ counter-clockwise (the true direction)"],
  [`${P}orbit_sun_focus`, "सूर्य (केन्द्रबिन्दु)", "Sun (at the focus)"],
  [`${P}orbit_north_pole`, "उत्तर", "North"],
  [`${P}orbit_speed`, "गति", "Speed"],
  [`${P}orbit_speed_fast`, "छिटो", "faster"],
  [`${P}orbit_speed_slow`, "ढिलो", "slower"],
  [`${P}orbit_speed_mean`, "मध्यम", "mean"],
];
for (const [key, ne, en] of HELIO) {
  if (!helio.includes(ne)) throw new Error(`not in HeliocentricOrbitDiagram: ${ne}`);
  map[key] = { ne, en };
}

const ordered = Object.fromEntries(
  Object.entries(map).sort(([a], [b]) => a.localeCompare(b)),
);
writeFileSync(
  "scripts/i18n-maps/learn-diagrams.json",
  `${JSON.stringify(ordered, null, 2)}\n`,
  "utf8",
);
console.log(`${Object.keys(ordered).length} keys written`);

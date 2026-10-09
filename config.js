/* ===========================================================
   CONFIG
   ===========================================================
   This is the only file you normally need to edit.
   Change a value here, save, commit. Nothing else moves.
   =========================================================== */


/* -----------------------------------------------------------
   1. WHERE THE SCORES COME FROM
   -----------------------------------------------------------
   Paste the link Google gives you from:

       File  →  Share  →  Publish to web
         • pick the "Scores" tab  (NOT "Entire document")
         • change the format to  Comma-separated values (.csv)
         • click Publish

   The link should end in  output=csv

   IMPORTANT: whatever tab you publish becomes readable by anyone
   who has this link. Publish the Scores tab only. See README.md,
   section "Keeping the rest of your data private".
----------------------------------------------------------- */
var SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vStHQRtmwLMkoxH1-BIqNs6GqE5dg1N1pj0b1mHMVSGQqU_buegArLz-c946Wd2Vzd2GJ0ZKPn6hs1p/pub?gid=0&single=true&output=csv";

/* -----------------------------------------------------------
   2. HOW MANY PLACES THE BOARD SHOWS
   -----------------------------------------------------------
   5 keeps it on one phone screen. 10 gives more people a reason
   to look. Anyone outside this number can still find themselves
   using the search box.
----------------------------------------------------------- */
var TOP_N = 5;


/* -----------------------------------------------------------
   3. THE TEXT ALONG THE TOP
   -----------------------------------------------------------
   Change these when a new cohort starts.
----------------------------------------------------------- */
var BRAND_NAME = "CyberFoundHer Mentorship Program";
var BRAND_SUB  = ".";
var BOARD_TITLE = "LEADERBOARD";
var FOOTER_NOTE = "updated monthly by the program team";

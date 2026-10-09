/* ===========================================================
   CyberFoundHer Leaderboard — app.js
   ===========================================================

   WHAT THIS FILE DOES, IN ORDER

     1. Asks Google for the published sheet, as CSV text
     2. Turns that text into rows and columns
     3. Turns those rows into a list of people and their scores
     4. Sorts them, and draws the board
     5. Redraws when someone picks a month or types in the search

   Everything happens in the browser. There is no server, no
   database and no login. The sheet IS the database.

   The whole file sits inside one function that runs itself
   (the "(function(){ ... })();" wrapper at top and bottom).
   That keeps its variables to itself instead of leaking them
   into the page.
   =========================================================== */

(function(){
  "use strict";

  /* ---------------------------------------------------------
     STATE
     ---------------------------------------------------------
     Two objects hold everything the page knows.

     data  — what came from the sheet. Set once, then left alone.
     view  — what the visitor is currently looking at. Changes as
             they click around.
  --------------------------------------------------------- */
  var data = {
    months: [],   // e.g. ["October","November"] — taken from the sheet headings
    people: []    // e.g. [{ name:"Amara Okonkwo", scores:{ October:480 } }]
  };

  var view = {
    month: null,  // which month is selected, or "all"
    query: ""     // what is typed in the search box
  };

  var root = document.getElementById("root");


  /* =========================================================
     HELPERS
     ========================================================= */

  /* Makes text safe to put inside HTML.

     Names come from a spreadsheet, and a name containing < or &
     would otherwise break the page. Everything from the sheet
     goes through here before it is displayed. */
  function esc(s){
    return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){
      return { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c];
    });
  }

  /* "Amara Okonkwo" -> "AO", for the avatar circle.
     One word gives one letter. No name gives "?". */
  function initials(name){
    var parts = String(name || "").trim().split(/\s+/);
    var first = (parts[0] || "")[0] || "?";
    var second = (parts[1] || "")[0] || "";
    return (first + second).toUpperCase();
  }

  /* Turns a cell into a whole number.

     Strips anything that is not a digit, so "1,200" and "1200 pts"
     both become 1200. Blank or non-numeric becomes 0. */
  function toNumber(value){
    var clean = String(value == null ? "" : value).replace(/[^0-9.\-]/g, "");
    if(clean === "" || isNaN(Number(clean))) return 0;
    return Math.round(Number(clean));
  }


  /* =========================================================
     STEP 2 — READING CSV
     =========================================================

     A CSV looks simple but has one trap: a field can contain a
     comma if it is wrapped in quotes. So "Okonkwo, Amara" is ONE
     name, not two fields. Splitting on commas would break it.

     This reads the text one character at a time and keeps track
     of whether it is currently inside quotes.
  ========================================================= */
  function parseCSV(text){
    text = text.replace(/^\uFEFF/, "");   // strip the invisible marker Google adds

    var rows = [];      // finished rows
    var row = [];       // the row being built
    var field = "";     // the cell being built
    var inQuotes = false;
    var i = 0;

    while(i < text.length){
      var ch = text[i];

      if(inQuotes){
        if(ch === '"'){
          // two quotes in a row means a real quote character
          if(text[i+1] === '"'){ field += '"'; i += 2; continue; }
          inQuotes = false; i++; continue;          // closing quote
        }
        field += ch; i++; continue;                 // ordinary character, commas included
      }

      if(ch === '"'){ inQuotes = true; i++; continue; }   // opening quote
      if(ch === ','){ row.push(field); field = ""; i++; continue; }  // end of cell
      if(ch === '\r'){ i++; continue; }                   // ignore Windows line endings
      if(ch === '\n'){ row.push(field); rows.push(row); row = []; field = ""; i++; continue; }

      field += ch; i++;
    }

    // whatever is left when the text runs out
    row.push(field);
    if(row.length > 1 || row[0] !== "") rows.push(row);

    return rows;
  }


  /* =========================================================
     STEP 3 — MAKING SENSE OF THE ROWS
     =========================================================

     Expected sheet shape:

         Name            | October | November
         Amara Okonkwo   | 480     | 300
         Zainab Diallo   | 455     | 340

     First column is the name. Every column after it is a month,
     and the heading you typed becomes the label on the board.
     Add December by adding a column — no code changes.
  ========================================================= */
  function buildData(rows){
    if(!rows.length) return { months: [], people: [] };

    var header = rows[0].map(function(h){ return String(h).trim(); });

    // everything after the Name column, ignoring blank headings
    var months = header.slice(1).filter(function(h){ return h !== ""; });

    var people = [];
    for(var r = 1; r < rows.length; r++){
      var name = String(rows[r][0] || "").trim();
      if(!name) continue;                       // skip blank rows

      var scores = {};
      for(var c = 0; c < months.length; c++){
        scores[months[c]] = toNumber(rows[r][c + 1]);
      }
      people.push({ name: name, scores: scores });
    }

    return { months: months, people: people };
  }


  /* =========================================================
     STEP 4 — SORTING
     ========================================================= */

  /* One person's score for the selected month.
     "all" adds every month together. */
  function pointsFor(person, month){
    if(month === "all"){
      var total = 0;
      for(var key in person.scores) total += person.scores[key] || 0;
      return total;
    }
    return person.scores[month] || 0;
  }

  /* Everyone with a score above zero, highest first.

     Two people on the same score are put in alphabetical order,
     so the board does not reshuffle at random between reloads. */
  function ranked(){
    return data.people
      .map(function(person){
        return { person: person, value: pointsFor(person, view.month) };
      })
      .filter(function(entry){ return entry.value > 0; })
      .sort(function(a, b){
        return b.value - a.value || a.person.name.localeCompare(b.person.name);
      });
  }


  /* =========================================================
     STEP 5 — DRAWING
     ========================================================= */

  /* The three medal colour sets: gold, silver, bronze.
     a = highlight, b = middle, c = shadow, ring = inner circle. */
  var MEDAL_COLOURS = {
    1: { a:"#F6DC94", b:"#E0B44C", c:"#B98A26", ring:"#FBEFC4" },
    2: { a:"#EFF2EE", b:"#C6CBC4", c:"#9AA098", ring:"#FAFBF9" },
    3: { a:"#E7B98F", b:"#C08551", c:"#956034", ring:"#F3D8BF" }
  };

  /* Draws a medal as SVG: two ribbon strips crossing at the top,
     then the disc with the rank number stamped on it.
     SVG rather than an image file, so it stays sharp at any size
     and there is nothing extra to download. */
  function medalSvg(rank){
    var c = MEDAL_COLOURS[rank];
    return '<svg class="medal" viewBox="0 0 44 52" aria-hidden="true" focusable="false">'
      + '<defs>'
      +   '<linearGradient id="medal-grad-' + rank + '" x1="0" y1="0" x2="1" y2="1">'
      +     '<stop offset="0" stop-color="' + c.a + '"/>'
      +     '<stop offset=".55" stop-color="' + c.b + '"/>'
      +     '<stop offset="1" stop-color="' + c.c + '"/>'
      +   '</linearGradient>'
      + '</defs>'
      + '<path d="M8 0 L18 0 L27 19 L17 22 Z" fill="#2C7A3F"/>'   /* green ribbon  */
      + '<path d="M26 0 L36 0 L27 22 L17 19 Z" fill="#E9E4D8"/>'  /* beige ribbon  */
      + '<circle cx="22" cy="34" r="17" fill="' + c.c + '"/>'     /* disc shadow   */
      + '<circle cx="22" cy="33" r="16" fill="url(#medal-grad-' + rank + ')"/>'
      + '<circle cx="22" cy="33" r="12.5" fill="none" stroke="' + c.ring + '" '
      +   'stroke-opacity=".75" stroke-width="1.2"/>'             /* inner ring    */
      + '<text x="22" y="33" text-anchor="middle" dominant-baseline="central" '
      +   'font-family="Archivo, Arial, sans-serif" font-size="16" font-weight="900" '
      +   'fill="#5A4410">' + rank + '</text>'
      + '</svg>';
  }

  /* One line of the board: medal or number, avatar, name and score. */
  function rowHtml(entry, rank){
    var badge = rank <= 3
      ? medalSvg(rank)
      : '<div class="medal mn">' + rank + '</div>';

    return '<li class="row' + (rank === 1 ? ' lead' : '') + '">'
      +   badge
      +   '<div class="ava">' + esc(initials(entry.person.name)) + '</div>'
      +   '<div class="pill">'
      +     '<span class="nm">' + esc(entry.person.name) + '</span>'
      +     '<span class="pts">' + entry.value.toLocaleString() + '</span>'
      +   '</div>'
      + '</li>';
  }

  /* Rebuilds the whole page.

     Building one string and assigning it once is faster than
     changing the page piece by piece, and it means there is only
     ever one place where the markup is decided. */
  function render(){
    var rows = ranked();
    var top = rows.slice(0, TOP_N);
    var period = view.month === "all" ? "All months so far" : view.month;

    var html =
        '<div class="brand"><b>' + esc(BRAND_NAME) + '</b>'
      +   '<span>' + esc(BRAND_SUB) + '</span></div>'

      + '<section class="board">'
      +   '<div class="title">' + esc(BOARD_TITLE) + '</div>'
      +   '<p class="period">' + esc(period || "") + '</p>'

      /* one button per month, plus "All" */
      +   '<div class="chips" role="group" aria-label="Choose a month">'
      +     data.months.map(function(month){
              return '<button class="chip" type="button" data-month="' + esc(month) + '" '
                   + 'aria-pressed="' + (view.month === month) + '">' + esc(month) + '</button>';
            }).join("")
      +     '<button class="chip" type="button" data-month="all" '
      +       'aria-pressed="' + (view.month === "all") + '">All</button>'
      +   '</div>';

    html += top.length
      ? '<ol class="rows">'
        + top.map(function(entry, i){ return rowHtml(entry, i + 1); }).join("")
        + '</ol>'
      : '<div class="state"><b>Nothing scored for ' + esc(period || "this month") + ' yet.</b>'
        + 'The board goes up once the month has been marked.</div>';

    html +=
        '<div class="find">'
      +   '<label for="q">Find your position</label>'
      +   '<input id="q" type="text" autocomplete="off" placeholder="Type your name" '
      +     'value="' + esc(view.query) + '">'
      +   '<div class="result" id="result"></div>'
      + '</div>'
      + '</section>'

      + '<footer>' + rows.length + ' on the board &middot; ' + esc(FOOTER_NOTE) + '</footer>';

    root.innerHTML = html;
    renderResult();   // the search result is drawn separately, see below
    wire();           // and the new buttons need their clicks attached
  }

  /* Draws the search result only.

     Kept separate from render() so that typing updates just this
     small area. If it went through render(), the input would be
     rebuilt on every keystroke and lose the cursor. */
  function renderResult(){
    var box = document.getElementById("result");
    if(!box) return;

    var query = view.query.trim().toLowerCase();
    if(!query){ box.innerHTML = ""; return; }

    var rows = ranked();
    var hits = [];
    for(var i = 0; i < rows.length && hits.length < 5; i++){
      if(rows[i].person.name.toLowerCase().indexOf(query) > -1){
        hits.push({ entry: rows[i], rank: i + 1 });   // i+1 is the real position
      }
    }

    if(!hits.length){
      // Distinguish "she has no points this month" from "no such person"
      var knownName = data.people.some(function(p){
        return p.name.toLowerCase().indexOf(query) > -1;
      });
      box.innerHTML = '<p class="miss">' + (knownName
        ? "No points recorded under that name for this month yet."
        : "No one by that name on the board. Check the spelling, or ask in the community channel.")
        + '</p>';
      return;
    }

    box.innerHTML = hits.map(function(hit){
      return '<div><p class="you">YOUR POSITION</p>'
           + '<ol class="rows" style="margin:0">' + rowHtml(hit.entry, hit.rank) + '</ol></div>';
    }).join("");
  }

  /* Attaches click and typing handlers.

     Must run after every render(), because render() replaces the
     buttons with brand new ones that have no handlers yet. */
  function wire(){
    document.querySelectorAll("[data-month]").forEach(function(button){
      button.onclick = function(){
        view.month = button.getAttribute("data-month");
        render();
      };
    });

    var input = document.getElementById("q");
    if(input){
      input.oninput = function(e){
        view.query = e.target.value;
        renderResult();   // not render(), so the cursor stays put
      };
    }
  }

  /* Replaces the board with a message: loading, or something wrong. */
  function showState(title, body){
    root.innerHTML =
        '<div class="brand"><b>' + esc(BRAND_NAME) + '</b>'
      +   '<span>' + esc(BRAND_SUB) + '</span></div>'
      + '<section class="board">'
      +   '<div class="title">' + esc(BOARD_TITLE) + '</div>'
      +   '<div class="state"><b>' + esc(title) + '</b>' + esc(body) + '</div>'
      + '</section>';
  }

  /* Which month to show when the page opens.

     The most recent one that actually has scores, so in November
     you see November, and in the gap before November is marked you
     still see October rather than an empty board. */
  function defaultMonth(){
    for(var i = data.months.length - 1; i >= 0; i--){
      var month = data.months[i];
      var hasScores = data.people.some(function(p){ return (p.scores[month] || 0) > 0; });
      if(hasScores) return month;
    }
    return data.months[0] || null;
  }


  /* =========================================================
     STEP 1 — FETCHING THE SHEET
     =========================================================
     Runs last in the file but first in time. Everything above is
     a definition; this is what actually starts the page.
  ========================================================= */
  function load(){
    // Nobody has pasted the link into config.js yet
    if(!SHEET_CSV_URL || SHEET_CSV_URL.indexOf("PASTE_YOUR") === 0){
      showState("Not connected to the sheet yet.",
                "Open config.js and set SHEET_CSV_URL to your published CSV link.");
      return;
    }

    // cache:"no-store" asks the browser for a fresh copy rather than
    // a stored one, so an update to the sheet shows up promptly
    fetch(SHEET_CSV_URL, { cache: "no-store" })
      .then(function(response){
        if(!response.ok) throw new Error("HTTP " + response.status);
        return response.text();
      })
      .then(function(text){
        data = buildData(parseCSV(text));

        if(!data.months.length || !data.people.length){
          showState("The sheet is empty.",
                    "Add a Name column, one column per month, and a row for each mentee.");
          return;
        }

        view.month = defaultMonth();
        render();
      })
      .catch(function(){
        // Deliberately vague to the visitor: a mentee cannot fix this,
        // and the detail belongs in the browser console, not on screen.
        showState("Could not load the scores.",
                  "The sheet may not be published, or the link may be wrong. Try again shortly.");
      });
  }

  load();

})();
